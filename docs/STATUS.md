# Status

## ✅ Live — automated monthly crawl is running

The initial-crawl scaffolding described in earlier versions of this file is **done**.
`data/` holds real content (78 committed source documents), and the crawl runs
unattended on GitHub Actions.

| | |
|---|---|
| State | **Live / automated** |
| Last run | **2026-06-15 18:04 UTC** — `github-actions[bot]`, commit `3ccba15` |
| Last run result | 65 pages fetched OK · 13 retained from prior runs · 4 skipped (non-MassAbility) |
| Source docs committed | 78 `.md` files under `data/` |
| Manifest entries | 82 (`docs/crawl-manifest.json`) |
| Schedule | `0 13 15 * *` — 13:00 UTC on the 15th of every month |
| Next run | **2026-07-15 13:00 UTC** |
| `FIRECRAWL_API_KEY` secret | Set (confirmed — the May 18 and Jun 15 bot runs cleared the credit-check gate) |

Workflow: [`.github/workflows/crawl.yml`](../.github/workflows/crawl.yml) ·
Run logs: https://github.com/Woop91/MassAbility-DB/actions/workflows/crawl.yml

## Run history

| Date | Author | Pages | Note |
|---|---|---|---|
| 2026-05-08 | Wardis | — | Scaffold + workflow + STATUS |
| 2026-05-17 | Wardis | 10 | v1 BFS crawl (seed-only; mass.gov hides links behind JS) |
| 2026-05-18 | github-actions[bot] | 58 | v2 pipeline (map → filter → scrape) |
| 2026-06-15 | github-actions[bot] | 65 | v2 pipeline (current) |

## How it works

The workflow ([`crawl.yml`](../.github/workflows/crawl.yml)) on each run:

1. Checks out the repo, installs Node 22 + `firecrawl-cli`.
2. Verifies `FIRECRAWL_API_KEY` is set and remaining credits ≥ 300 (hard-fails otherwise).
3. Runs [`scripts/crawl.mjs`](../scripts/crawl.mjs) — the **v2 pipeline**:
   `firecrawl /map` (≈500 candidate URLs for query `massability`) → relevance filter
   → per-URL `scrape` → merge into `.firecrawl/crawl.json` (gitignored).
4. Runs [`scripts/refresh-manifest.mjs`](../scripts/refresh-manifest.mjs) — writes
   `data/<bucket>/<slug>.md`, strips mass.gov boilerplate, and rebuilds
   `docs/crawl-manifest.json` with sha256 + `fetched_at`.
5. Commits as `github-actions[bot]` (only if something changed) and pushes to `main`.

It is idempotent: a re-fetch only lands a commit if a page's `sha256` actually changed.

## Retained pages (non-deterministic discovery)

Firecrawl's `/map` discovery is not deterministic — a given run may not re-surface
every previously-captured page. `refresh-manifest.mjs` therefore re-hashes any
committed `data/**/*.md` that the current run did **not** re-fetch and records it
with `status: "retained"`, so the manifest stays a complete audit trail of every
file in the repo (no page silently disappears from the trail). As of 2026-06-17
there are 13 such retained pages (e.g. the Brockton / Fall River / Malden / Roxbury
office pages and the full locations index), all originally fetched 2026-05-18.

## Triggering a run manually

GitHub UI: https://github.com/Woop91/MassAbility-DB/actions/workflows/crawl.yml →
**Run workflow**.

Locally (requires `FIRECRAWL_API_KEY` in the environment + ≥300 credits):

```bash
node scripts/crawl.mjs            # fetch → .firecrawl/crawl.json
node scripts/refresh-manifest.mjs # write data/*.md + rebuild manifest
```

## Notes / caveats

- **DST drift:** cron is fixed at 13:00 UTC = 09:00 ET during EDT, but 08:00 ET
  during EST (Nov–Mar). Cosmetic only; adjust the cron if the wall-clock hour matters.
- **Why GitHub Actions, not a Claude `/schedule` routine:** the cloud sandbox has no
  secret-injection path for the Firecrawl key, and push access from a remote agent is
  uncertain. Actions gives encrypted repo secrets + an auto-provisioned `GITHUB_TOKEN`
  with `contents: write`.
- **Why not curl/Playwright:** mass.gov returns 403 to plain `curl` (WAF/bot
  detection); Playwright works but is slower and token-heavier per page than Firecrawl.
