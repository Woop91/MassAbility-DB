# Status

## Pending: initial Firecrawl crawl (target: 2026-05-15)

The repo currently contains only scaffolding — `data/` subfolders hold `.gitkeep` placeholders and no actual content.

The initial Firecrawl crawl of `mass.gov/orgs/massability/*` is **deferred until 2026-05-15**, when the Firecrawl billing period resets and credits become available again. Plan: 300-URL, depth-3 crawl per [`docs/methodology.md`](methodology.md) and [`docs/superpowers/specs/2026-05-08-massability-db-design.md`](superpowers/specs/2026-05-08-massability-db-design.md).

## Run sequence on 2026-05-15

```bash
cd C:\Users\deskc\Documents\MassAbility-DB
firecrawl credit-usage         # confirm credits available
./scripts/crawl.sh             # ~5-15 min crawl
node scripts/refresh-manifest.mjs
git add -A
git commit -m "data: initial mass.gov/orgs/massability crawl (N pages)"
git push origin main
```

## Why not curl/Playwright instead

- mass.gov serves **403 Forbidden** to plain `curl` regardless of User-Agent (WAF / bot detection).
- Playwright would work but is slower per-page and token-heavier; for a one-shot 300-URL pull, Firecrawl is the right tool. If credits become a recurring blocker, revisit this trade-off.
