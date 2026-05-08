#!/usr/bin/env node
// Post-processes .firecrawl/crawl.json into:
//   - data/<bucket>/<slug>.md       (committed source documents)
//   - docs/crawl-manifest.json       (audit trail with sha256 + fetched_at)
//
// Skips files whose canonical URL is already covered by 509dds-data
// (records them as status: "linked" in the manifest).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const CRAWL_PATH = join(REPO_ROOT, ".firecrawl", "crawl.json");
const MANIFEST_PATH = join(REPO_ROOT, "docs", "crawl-manifest.json");

// URL prefixes already covered by sister repos. If a crawled URL starts with one
// of these, we record it as "linked" instead of writing the markdown locally.
const LINKED = [
  // 509dds-data MA annual reports
  { match: /\/doc\/massability-fy(24|25)-annual-report/i, repo: "509dds-data", path: "data/ma-annual-reports/" },
  { match: /\/doc\/mrc-fy23-annual-report/i, repo: "509dds-data", path: "data/ma-annual-reports/mrc-fy23.md" },
  { match: /\/doc\/state-rehabilitation-council-fy(22|23|24)/i, repo: "509dds-data", path: "data/ma-annual-reports/" },
  // 509dds-data RA process
  { match: /\/info-details\/reasonable-accommodation/i, repo: "509dds-data", path: "data/ra-process/" },
];

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function bucketForUrl(url) {
  const u = new URL(url);
  if (u.pathname === "/orgs/massability" || u.pathname === "/orgs/massability/") {
    return { dir: "data/orgs-massability", name: "_index.md" };
  }
  let m = u.pathname.match(/^\/orgs\/massability\/(.+?)\/?$/);
  if (m) return { dir: "data/orgs-massability", name: `${slugify(m[1])}.md` };
  m = u.pathname.match(/^\/info-details\/(.+?)\/?$/);
  if (m) return { dir: "data/info-details", name: `${slugify(m[1])}.md` };
  m = u.pathname.match(/^\/news\/(.+?)\/?$/);
  if (m) return { dir: "data/press-releases", name: `${slugify(m[1])}.md` };
  if (u.pathname.endsWith(".pdf")) {
    const base = u.pathname.split("/").pop().replace(/\.pdf$/i, "");
    return { dir: "data/pdfs", name: `${slugify(base)}.md` };
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
    console.error(`No crawl output at ${CRAWL_PATH}. Run scripts/crawl.sh first.`);
    process.exit(1);
  }

  const crawl = JSON.parse(await readFile(CRAWL_PATH, "utf8"));
  const pages = Array.isArray(crawl) ? crawl : crawl.data || [];

  const manifest = [];
  let written = 0;
  let linked = 0;
  let skipped = 0;

  for (const p of pages) {
    const url = p.metadata?.sourceURL || p.url;
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

    const md = p.markdown || "";
    const body = `---\nsource_url: ${url}\nfetched_at: ${new Date().toISOString()}\n---\n\n${md}\n`;
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

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  console.log(`Wrote: ${written}, linked: ${linked}, skipped: ${skipped}`);
  console.log(`Manifest: ${MANIFEST_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
