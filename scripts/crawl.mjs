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

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
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

async function scrapeAll(seeds) {
  console.log(`==> [2/3] Scrape ${seeds.length} URLs (concurrency=${CONCURRENCY})`);
  await mkdir(PAGES_DIR, { recursive: true });

  let done = 0;
  let failed = 0;
  const queue = seeds.map((s, i) => ({ seed: s, idx: i }));

  async function worker() {
    while (queue.length) {
      const { seed, idx } = queue.shift();
      const outFile = join(PAGES_DIR, `${String(idx).padStart(4, "0")}.json`);
      try {
        await runFc([
          "scrape",
          seed.url,
          "--only-main-content",
          "--format", "markdown",
          "--json",
          "--output", outFile,
        ]);
      } catch (err) {
        failed++;
        console.error(`    [${idx}] FAIL ${seed.url} — ${err.message.slice(0, 120)}`);
      }
      done++;
      if (done % 25 === 0 || done === seeds.length) {
        console.log(`    Progress: ${done}/${seeds.length} (failed=${failed})`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  console.log(`    Done. Succeeded=${done - failed}, Failed=${failed}`);
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
  const seeds = await discover();
  if (seeds.length === 0) {
    console.error("No relevant URLs discovered. Aborting.");
    process.exit(1);
  }
  await scrapeAll(seeds);
  await merge();
  console.log("\n==> Crawl complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
