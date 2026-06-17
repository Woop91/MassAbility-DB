# Methodology

## Crawl (v2 pipeline)

The original v1 single-seed BFS crawl only discovered ~10 URLs because mass.gov
hides most internal links behind JS-rendered menus. It was replaced by a
**map → filter → scrape** pipeline ([`scripts/crawl.mjs`](../scripts/crawl.mjs)).

| Setting | Value |
|---|---|
| Tool | Firecrawl CLI (`firecrawl map` + `firecrawl scrape`) |
| Discovery | `firecrawl map https://www.mass.gov --search massability --limit 500` |
| Relevance filter | `isRelevant()` in `crawl.mjs` — keeps massability/MRC/rehabilitation/disability pages, drops boilerplate buckets |
| Scrape | per-URL `firecrawl scrape --only-main-content --format markdown` (concurrency 5) |
| Output formats | `markdown` |
| PDF handling | `mass.gov/doc/<slug>/download` → `data/pdfs/<slug>.md` (extracted); raw `*.pdf` gitignored |
| De-dup | by canonical `sourceURL`; pagination disambiguated as `-p<N>` |

## URL → file mapping

| URL pattern | Saved to |
|---|---|
| `mass.gov/orgs/massability` | `data/orgs-massability/_index.md` |
| `mass.gov/orgs/massability/<slug>` | `data/orgs-massability/<slug>.md` |
| `mass.gov/info-details/<slug>` | `data/info-details/<slug>.md` |
| `mass.gov/news/<slug>` (filtered) | `data/press-releases/<YYYY-MM-DD>-<slug>.md` |
| `*.pdf` | `data/pdfs/<basename>.md` (extracted) + (gitignored) `<basename>.pdf` |

## Manifest

`docs/crawl-manifest.json` is the source-of-truth audit trail. Each entry:

```json
{
  "url": "https://www.mass.gov/orgs/massability/...",
  "local_path": "data/orgs-massability/...",
  "sha256": "...",
  "fetched_at": "2026-06-15T...Z",
  "status": "ok | linked | retained | skipped",
  "linked_repo_url": null
}
```

- `status: "linked"` — the URL was already covered by [`509dds-data`](https://github.com/Woop91/509dds-data); the file was not duplicated here and `linked_repo_url` points to the sister-repo path.
- `status: "retained"` — a previously-committed page the current run did not re-fetch (Firecrawl `/map` discovery is non-deterministic). The file is re-hashed from disk so it stays in the audit trail. See [STATUS.md](STATUS.md).
- `status: "skipped"` — discovered URL with no matching output bucket.

## Re-running

```bash
node scripts/crawl.mjs              # fetch → .firecrawl/crawl.json
node scripts/refresh-manifest.mjs  # write data/*.md + rebuild manifest
```

The crawl is idempotent: re-running re-fetches URLs, but only commits files whose `sha256` changed.

## Caveats

- mass.gov is JS-rendered; Firecrawl handles this but timeouts are possible on slow pages — per-URL scrape failures are logged to the run's stderr (not the manifest) and simply omitted from that run's output
- News archive depth is limited; older press releases may require a separate seed run
- Per-employee CTHRU payroll is not part of this repo — see [`509dds-data/data/cthru-staffing/`](https://github.com/Woop91/509dds-data/tree/main/data/cthru-staffing) for the DDS-Det subset, or query `https://cthru.data.socrata.com/resource/rxhc-k6iz.json?$where=chris='MRC'` directly for the full agency
