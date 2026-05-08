# Methodology

## Crawl

| Setting | Value |
|---|---|
| Tool | Firecrawl CLI v1.15.1 (`firecrawl crawl`) |
| Seed URL | `https://www.mass.gov/orgs/massability` |
| Path filter | `mass.gov/orgs/massability/*` + linked `mass.gov/info-details/*` + filtered `mass.gov/news/*` |
| Max depth | 3 |
| Max URLs (initial run) | 300 |
| Output formats | `markdown`, `links` |
| PDF handling | `parsePDF=true`; raw PDF binary saved temporarily then gitignored, extracted markdown committed |
| De-dup | by URL (redirects collapsed to canonical) |

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
  "fetched_at": "2026-05-08T...Z",
  "redirected_from": null,
  "status": "ok | linked | skipped",
  "linked_repo_url": null
}
```

`status: "linked"` means the URL was already covered by [`509dds-data`](https://github.com/Woop91/509dds-data) and the file was not duplicated here — `linked_repo_url` points to the sister-repo path.

## Re-running

```bash
./scripts/crawl.sh                  # fetch
node scripts/refresh-manifest.mjs   # rebuild manifest + dedupe report
```

The crawl is idempotent: re-running re-fetches all URLs, but only commits files whose `sha256` changed. The manifest's `fetched_at` always updates.

## Caveats

- mass.gov is JS-rendered; Firecrawl handles this but timeouts are possible on slow pages — see manifest `status: "error"` rows
- News archive depth is limited; older press releases may require a separate seed run
- Per-employee CTHRU payroll is not part of this repo — see [`509dds-data/data/cthru-staffing/`](https://github.com/Woop91/509dds-data/tree/main/data/cthru-staffing) for the DDS-Det subset, or query `https://cthru.data.socrata.com/resource/rxhc-k6iz.json?$where=chris='MRC'` directly for the full agency
