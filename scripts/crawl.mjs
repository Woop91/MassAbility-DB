#!/usr/bin/env node
// v2 pipeline: firecrawl /map → filter → per-URL scrape → merge.
//
// Replaces v1's BFS crawl of a single seed (which only discovered 10 URLs
// because mass.gov hides most internal links behind JS-rendered menus).
//
// The /map endpoint uses sitemap + index discovery and returns ~500
// candidate URLs for the "massability" search query. We filter to ~150
// relevance-scoped URLs and scrape each individually so metadata
// (sourceURL, title) is preserved per page.

import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const OUT_DIR = join(REPO_ROOT, ".firecrawl");
const PAGES_DIR = join(OUT_DIR, "pages");

const CONCURRENCY = parseInt(process.env.CONCURRENCY || "5", 10);
const MAP_LIMIT = parseInt(process.env.MAP_LIMIT || "500", 10);
const SEARCH_QUERY = process.env.SEARCH_QUERY || "massability";
const SEED_URL = process.env.SEED_URL || "https://www.mass.gov";
// Link-expansion passes: after scraping, harvest in-scope mass.gov links from the
// scraped pages and scrape any not yet seen. /map discovery is non-exhaustive, so
// without this, pages only reachable via links inside index pages get missed.
const MAX_EXPAND = parseInt(process.env.MAX_EXPAND || "2", 10);

// Must-have pages that /map has historically failed to surface. Always scraped so
// coverage never silently regresses on these. Link-expansion catches the rest.
const CURATED_SEEDS = [
  "https://www.mass.gov/doc/massability-2025-annual-report/download",
  "https://www.mass.gov/doc/massability-2024-annual-report/download",
  "https://www.mass.gov/doc/massability-programs-and-services-brochure/download",
  "https://www.mass.gov/doc/massability-brain-injury-strategic-plan/download",
  "https://www.mass.gov/doc/massabilitys-brain-injury-implementation-plan/download",
  "https://www.mass.gov/info-details/massability-career-services",
  "https://www.mass.gov/info-details/massability-career-services-and-business-relations",
  "https://www.mass.gov/info-details/massability-disability-benefits-and-rights-services",
  "https://www.mass.gov/locations/massability-salem",
  "https://www.mass.gov/locations/massability-braintree",
  "https://www.mass.gov/locations/massability-greenfield",
  "https://www.mass.gov/locations/massability-hyannis",
];

// Canonical key for de-duping URLs (drop trailing slash + fragment, keep ?page).
function normUrl(u) {
  try {
    const x = new URL(u);
    const page = x.searchParams.get("page");
    return x.origin + x.pathname.replace(/\/+$/, "") + (page !== null ? `?page=${page}` : "");
  } catch {
    return null;
  }
}

// Is a harvested link a MassAbility content page worth scraping?
function inScopeHarvested(url) {
  let p;
  try {
    p = new URL(url).pathname;
  } catch {
    return false;
  }
  if (!/massability/i.test(p)) return false;        // must be MassAbility-related
  if (/^\/massability\/?$/i.test(p)) return false;  // bare vanity URL → redirects to /orgs/massability
  if (/^\/files\//i.test(p)) return false;          // asset / file store
  if (/\.(jpe?g|png|gif|svg|webp|pdf|css|js|ico)$/i.test(p)) return false; // binaries/assets
  return true;
}

function runFc(args) {
  return new Promise((resolve, reject) => {
    let stderr = "";
    const child = spawn("firecrawl", args, { shell: process.platform === "win32" });
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`firecrawl exit ${code}: ${stderr.slice(0, 200)}`))
    );
  });
}

function isRelevant({ url, title = "", description = "" }) {
  const p = new URL(url).pathname;

  if (/^\/(dds-eligibility|dds-self-directed|dds-careers|dds-office-of|careers-with-dds)/.test(p)) {
    return false;
  }

  const boilerplate = /^\/(decision|opinion|consent-order|settlement|rules-of-|supreme-judicial-court-rules|land-court|technical-information-release|industry-letter|circular-letter|memorandum|guides|audit|alerts|topics|event|forms|press-releases\/recent|files|cms-hpt|masshealth|how-to|executive-orders|enterprise|reporting-data-breaches|the-attorney|employer-tax|workplace-discrimination|massachusetts-court-cases|file-my-uniform|mcsr-for|massdot|route-79|artificial-intelligence|doer-electricity|home-care|sitemap)/;
  if (boilerplate.test(p)) {
    return /massability|MRC|rehabilitation commission/i.test(title + " " + description);
  }

  if (/^\/(orgs\/massability|info-details|locations|doc|news|lists)\//.test(p)) {
    return /massability|MRC|rehabilitation|disability/i.test(title + " " + description);
  }

  if (p.startsWith("/orgs/") && !p.startsWith("/orgs/massability")) {
    return /massability|MRC|rehabilitation/i.test(title + " " + description);
  }

  if (/massability/i.test(p)) return true;

  return false;
}

async function discover() {
  console.log(`==> [1/3] firecrawl map: ${SEED_URL} search="${SEARCH_QUERY}"`);
  const rawPath = join(OUT_DIR, "seeds-raw.json");
  await runFc(["map", SEED_URL, "--search", SEARCH_QUERY, "--limit", String(MAP_LIMIT), "--json", "--output", rawPath]);

  const raw = JSON.parse(await readFile(rawPath, "utf8"));
  const links = raw.data?.links || raw.links || [];
  const kept = links.filter(isRelevant);
  await writeFile(join(OUT_DIR, "seeds.json"), JSON.stringify(kept, null, 2));
  console.log(`    Discovered ${links.length}; filtered → ${kept.length} relevant URLs`);

  const counts = {};
  for (const it of kept) {
    const p = new URL(it.url).pathname;
    const b = p.startsWith("/orgs/massability") ? "orgs/massability"
      : p.startsWith("/orgs/") ? "orgs/other"
      : p.startsWith("/info-details/") ? "info-details"
      : p.startsWith("/locations/") ? "locations"
      : p.startsWith("/doc/") ? "doc"
      : p.startsWith("/news/") ? "news"
      : p.startsWith("/lists/") ? "lists"
      : "other";
    counts[b] = (counts[b] || 0) + 1;
  }
  console.log(`    By bucket: ${JSON.stringify(counts)}`);
  return kept;
}

let pageIdx = 0; // global page-file counter, shared across scrape rounds

// Scrape a list of URLs (skipping any already in `seen`), writing one JSON per
// page into PAGES_DIR. Returns the number of new URLs attempted.
async function scrapeUrls(urls, seen) {
  const todo = [];
  for (const u of urls) {
    const n = normUrl(u);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    todo.push(u);
  }
  if (!todo.length) return 0;

  const queue = todo.slice();
  let done = 0;
  let failed = 0;

  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      const outFile = join(PAGES_DIR, `${String(pageIdx++).padStart(5, "0")}.json`);
      try {
        await runFc([
          "scrape",
          url,
          "--only-main-content",
          "--format", "markdown",
          "--json",
          "--output", outFile,
        ]);
      } catch (err) {
        failed++;
        console.error(`    FAIL ${url} — ${err.message.slice(0, 120)}`);
      }
      done++;
      if (done % 25 === 0 || done === todo.length) {
        console.log(`    Progress: ${done}/${todo.length} (failed=${failed})`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  console.log(`    Round done. Succeeded=${done - failed}, Failed=${failed}`);
  return todo.length;
}

// Harvest every in-scope mass.gov link from (a) pages scraped this run and
// (b) the already-committed corpus under data/. Including the committed corpus
// matters because index pages that this run did NOT re-fetch (status "retained")
// still list offices/services we must follow — without this, links only present
// on retained pages get missed.
async function harvestLinks() {
  const re = /https?:\/\/(?:www\.)?mass\.gov\/[^\s)"'\]<>]+/gi;
  const links = new Set();
  const addFrom = (text) => {
    for (const m of text.matchAll(re)) {
      const raw = m[0].replace(/[.,]+$/, "");
      if (inScopeHarvested(raw)) links.add(raw);
    }
  };

  // (a) this run's freshly-scraped pages
  for (const f of (await readdir(PAGES_DIR)).filter((x) => x.endsWith(".json"))) {
    try {
      const d = JSON.parse(await readFile(join(PAGES_DIR, f), "utf8"));
      addFrom(d.markdown || d.data?.markdown || "");
    } catch {
      /* skip unreadable page */
    }
  }

  // (b) the committed corpus (retained index pages, etc.)
  const DATA_DIR = join(REPO_ROOT, "data");
  try {
    const md = (await readdir(DATA_DIR, { recursive: true })).filter((x) => x.endsWith(".md"));
    for (const rel of md) {
      try {
        addFrom(await readFile(join(DATA_DIR, rel), "utf8"));
      } catch {
        /* skip unreadable file */
      }
    }
  } catch {
    /* data/ may not exist on a first run */
  }

  return [...links];
}

async function merge() {
  console.log("==> [3/3] Merge per-URL outputs → crawl.json");
  const files = (await readdir(PAGES_DIR)).filter((f) => f.endsWith(".json")).sort();
  const pages = [];
  for (const f of files) {
    try {
      const d = JSON.parse(await readFile(join(PAGES_DIR, f), "utf8"));
      pages.push(d);
    } catch (e) {
      console.error(`    Skip ${f}: ${e.message}`);
    }
  }
  await writeFile(join(OUT_DIR, "crawl.json"), JSON.stringify(pages));
  console.log(`    Merged ${pages.length} pages into crawl.json`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  // Start from a clean page dir so stale outputs from a prior local run don't merge.
  await rm(PAGES_DIR, { recursive: true, force: true });
  await mkdir(PAGES_DIR, { recursive: true });

  const seeds = await discover();
  if (seeds.length === 0) {
    console.error("No relevant URLs discovered. Aborting.");
    process.exit(1);
  }

  const seen = new Set();
  const seedUrls = [...new Set([...seeds.map((s) => s.url), ...CURATED_SEEDS])];
  console.log(`==> [2/3] Scrape ${seedUrls.length} URLs (seeds + curated, concurrency=${CONCURRENCY})`);
  await scrapeUrls(seedUrls, seen);

  // Expansion: follow in-scope links inside scraped pages that /map missed.
  for (let round = 1; round <= MAX_EXPAND; round++) {
    const fresh = (await harvestLinks()).filter((u) => !seen.has(normUrl(u)));
    if (fresh.length === 0) {
      console.log(`==> Expansion round ${round}: nothing new — coverage converged.`);
      break;
    }
    console.log(`==> Expansion round ${round}: ${fresh.length} newly-linked page(s) to scrape`);
    await scrapeUrls(fresh, seen);
  }

  await merge();
  console.log(`\n==> Crawl complete. ${pageIdx} page(s) scraped.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
