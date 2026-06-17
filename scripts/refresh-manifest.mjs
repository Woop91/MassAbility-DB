#!/usr/bin/env node
// Post-processes .firecrawl/crawl.json into:
//   - data/<bucket>/<slug>.md       (committed source documents)
//   - docs/crawl-manifest.json       (audit trail with sha256 + fetched_at)
//
// Skips files whose canonical URL is already covered by 509dds-data
// (records them as status: "linked" in the manifest).
//
// v2 changes:
//   - New buckets: data/locations/, data/lists/, data/orgs-other/
//   - /doc/* → data/pdfs/ (mass.gov /doc/ paths are document downloads)
//   - Standalone slugs containing "massability" → data/orgs-massability/
//   - Pagination disambiguation: querystring appended to slug as -p<N>
//   - Strip mass.gov boilerplate header (state seal + "official website" preamble)

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const CRAWL_PATH = join(REPO_ROOT, ".firecrawl", "crawl.json");
const MANIFEST_PATH = join(REPO_ROOT, "docs", "crawl-manifest.json");

const LINKED = [
  { match: /\/doc\/massability-fy(24|25)-annual-report/i, repo: "509dds-data", path: "data/ma-annual-reports/" },
  { match: /\/doc\/mrc-fy23-annual-report/i, repo: "509dds-data", path: "data/ma-annual-reports/mrc-fy23.md" },
  { match: /\/doc\/state-rehabilitation-council-fy(22|23|24)/i, repo: "509dds-data", path: "data/ma-annual-reports/" },
  { match: /\/info-details\/reasonable-accommodation/i, repo: "509dds-data", path: "data/ra-process/" },
];

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

// mass.gov pages prefix every body with a state-seal image + "official website"
// preamble that is ~25 lines of boilerplate identical across every page. Strip
// it so we don't commit ~1KB of header noise × N pages.
function stripMassGovHeader(md) {
  if (!md) return md;
  const marker = /\n(- This page,|# )/m;
  const m = md.match(marker);
  if (!m) return md;
  if (m.index < 50) return md; // No header to strip
  const isBoilerplate = /official website of the Commonwealth/i.test(md.slice(0, m.index));
  if (!isBoilerplate) return md;
  // Strip everything up to the first "# " heading or "- This page," section
  if (md.slice(m.index).startsWith("\n- This page,")) {
    // Find the heading after the "This page" block
    const headingMatch = md.slice(m.index).match(/\n# /);
    if (headingMatch) return md.slice(m.index + headingMatch.index + 1);
  }
  return md.slice(m.index + 1);
}

function bucketForUrl(url) {
  const u = new URL(url);
  const p = u.pathname;
  // Pagination suffix
  const page = u.searchParams.get("page");
  const pageSuffix = page !== null ? `-p${page}` : "";

  if (p === "/orgs/massability" || p === "/orgs/massability/") {
    return { dir: "data/orgs-massability", name: `_index${pageSuffix}.md` };
  }
  let m = p.match(/^\/orgs\/massability\/(.+?)\/?$/);
  if (m) return { dir: "data/orgs-massability", name: `${slugify(m[1])}${pageSuffix}.md` };

  m = p.match(/^\/orgs\/(.+?)\/?$/);
  if (m) return { dir: "data/orgs-other", name: `${slugify(m[1])}${pageSuffix}.md` };

  m = p.match(/^\/info-details\/(.+?)\/?$/);
  if (m) return { dir: "data/info-details", name: `${slugify(m[1])}${pageSuffix}.md` };

  m = p.match(/^\/locations\/(.+?)\/?$/);
  if (m) return { dir: "data/locations", name: `${slugify(m[1])}${pageSuffix}.md` };

  m = p.match(/^\/news\/(.+?)\/?$/);
  if (m) return { dir: "data/press-releases", name: `${slugify(m[1])}${pageSuffix}.md` };

  m = p.match(/^\/lists\/(.+?)\/?$/);
  if (m) return { dir: "data/lists", name: `${slugify(m[1])}${pageSuffix}.md` };

  // mass.gov /doc/<slug>/download is the document download endpoint
  m = p.match(/^\/doc\/(.+?)(\/download)?\/?$/);
  if (m) return { dir: "data/pdfs", name: `${slugify(m[1])}.md` };

  if (p.endsWith(".pdf")) {
    const base = p.split("/").pop().replace(/\.pdf$/i, "");
    return { dir: "data/pdfs", name: `${slugify(base)}.md` };
  }

  // Standalone slugs containing 'massability' or known MassAbility programs
  if (/massability/i.test(p) || /^\/(career-programs-and-services|benefits-counseling|hire-with-massability|independent-living-centers|supported-living-program|power-whats-possible|nextgen-careers|meet-the-nextgen-team|count-me-in|office-of-education-and-vocational-rehabilitation|mass-rehab-commission-pca-job-candidates)$/.test(p)) {
    return { dir: "data/orgs-massability", name: `${slugify(p.slice(1))}.md` };
  }

  return null;
}

function checkLinked(url) {
  for (const rule of LINKED) {
    if (rule.match.test(url)) {
      return { repo: rule.repo, path: rule.path };
    }
  }
  return null;
}

async function main() {
  if (!existsSync(CRAWL_PATH)) {
    console.error(`No crawl output at ${CRAWL_PATH}. Run scripts/crawl.mjs first.`);
    process.exit(1);
  }

  const crawl = JSON.parse(await readFile(CRAWL_PATH, "utf8"));
  const pages = Array.isArray(crawl) ? crawl : crawl.data || [];

  const manifest = [];
  let written = 0;
  let linked = 0;
  let skipped = 0;

  for (const p of pages) {
    const url = p.metadata?.sourceURL || p.url || p.metadata?.url;
    if (!url) {
      skipped++;
      continue;
    }

    const linkedTo = checkLinked(url);
    if (linkedTo) {
      manifest.push({
        url,
        local_path: null,
        sha256: null,
        fetched_at: new Date().toISOString(),
        status: "linked",
        linked_repo_url: `https://github.com/Woop91/${linkedTo.repo}/tree/main/${linkedTo.path}`,
      });
      linked++;
      continue;
    }

    const bucket = bucketForUrl(url);
    if (!bucket) {
      manifest.push({
        url,
        local_path: null,
        sha256: null,
        fetched_at: new Date().toISOString(),
        status: "skipped",
        reason: "no bucket match",
      });
      skipped++;
      continue;
    }

    const md = stripMassGovHeader(p.markdown || "");
    const title = p.metadata?.title || "";
    const body = `---\nsource_url: ${url}\ntitle: ${title.replace(/\n/g, " ")}\nfetched_at: ${new Date().toISOString()}\n---\n\n${md}\n`;
    const outDir = join(REPO_ROOT, bucket.dir);
    await mkdir(outDir, { recursive: true });
    const outPath = join(outDir, bucket.name);
    await writeFile(outPath, body, "utf8");

    manifest.push({
      url,
      local_path: `${bucket.dir}/${bucket.name}`,
      sha256: sha256(Buffer.from(body, "utf8")),
      fetched_at: new Date().toISOString(),
      status: "ok",
    });
    written++;
  }

  // Record committed source docs this crawl did NOT re-fetch. Firecrawl /map
  // discovery is non-deterministic, so any given run may not re-surface every
  // previously-captured page. Without this, such pages silently drop out of the
  // manifest's audit trail even though their files remain committed. We re-hash
  // them from disk and mark them "retained" so the manifest stays complete.
  const tracked = new Set(manifest.filter((e) => e.local_path).map((e) => e.local_path));
  const DATA_DIR = join(REPO_ROOT, "data");
  let retained = 0;
  const onDisk = (await readdir(DATA_DIR, { recursive: true }))
    .map((f) => "data/" + f.split("\\").join("/"))
    .filter((f) => f.endsWith(".md"))
    .sort();
  for (const rel of onDisk) {
    if (tracked.has(rel)) continue;
    const buf = await readFile(join(REPO_ROOT, rel), "utf8");
    const urlMatch = buf.match(/^source_url:\s*(.+)$/m);
    const fetchedMatch = buf.match(/^fetched_at:\s*(.+)$/m);
    manifest.push({
      url: urlMatch ? urlMatch[1].trim() : null,
      local_path: rel,
      sha256: sha256(Buffer.from(buf, "utf8")),
      fetched_at: fetchedMatch ? fetchedMatch[1].trim() : null,
      status: "retained",
    });
    retained++;
  }

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  console.log(`Wrote: ${written}, linked: ${linked}, retained: ${retained}, skipped: ${skipped}`);
  console.log(`Manifest: ${MANIFEST_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
