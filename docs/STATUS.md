# Status

## Pending: initial Firecrawl crawl (target: 2026-05-15 13:00 UTC / 09:00 EDT)

The repo currently contains only scaffolding — `data/` subfolders hold `.gitkeep` placeholders and no actual content.

The initial crawl is automated via [`.github/workflows/crawl.yml`](../.github/workflows/crawl.yml) and will fire on **2026-05-15 at 13:00 UTC (09:00 EDT)** — the date the Firecrawl billing cycle resets. It then re-runs **monthly on the 15th** to keep the data fresh; the crawl is idempotent (manifest tracks sha256, so commits only land if content actually changed).

## One manual step required: set the FIRECRAWL_API_KEY secret

The workflow needs your Firecrawl API key as a repo secret. Until it's set, the workflow's first step will hard-fail with a clear error message.

**Option A — `gh` CLI:**
```bash
# Get your key from https://www.firecrawl.dev/app/api-keys
gh secret set FIRECRAWL_API_KEY --repo Woop91/MassAbility-DB
# Paste the key when prompted; it never appears in logs or the UI again.
```

**Option B — GitHub web UI:**
1. https://github.com/Woop91/MassAbility-DB/settings/secrets/actions
2. Click **New repository secret**
3. Name: `FIRECRAWL_API_KEY`
4. Value: paste the key from https://www.firecrawl.dev/app/api-keys
5. Click **Add secret**

## How to test before May 15

Once the secret is set, you can manually trigger a workflow run from the Actions tab to verify wiring (it'll abort safely on the credit-check step until credits are available again, but you'll see whether checkout / install / API-key wiring is working):

- https://github.com/Woop91/MassAbility-DB/actions/workflows/crawl.yml → **Run workflow**

## Run flow on May 15

1. GitHub Actions cron fires at 13:00 UTC
2. Workflow checks out repo, installs Node 22 + firecrawl CLI
3. Verifies `FIRECRAWL_API_KEY` is set and credits ≥ 300
4. Runs `scripts/crawl.sh` (300-URL, depth-3 crawl of `mass.gov/orgs/massability/*`)
5. Runs `node scripts/refresh-manifest.mjs` (builds `docs/crawl-manifest.json` + dedupe)
6. Commits as `github-actions[bot]` with a `data:` message including page counts
7. Pushes back to `main`
8. Logs visible at https://github.com/Woop91/MassAbility-DB/actions

## Why GitHub Actions (not a Claude Code routine)

A `/schedule` remote routine was considered first but rejected — Anthropic's cloud sandbox has no secret-injection mechanism for the Firecrawl API key (it would have to be embedded in the prompt, exposed in the routine config), and write-access to push back to `Woop91/MassAbility-DB` from a remote agent is uncertain.

GitHub Actions naturally solves both: encrypted repo secrets + auto-provisioned `GITHUB_TOKEN` with write access via `permissions: contents: write`.

## Why not curl/Playwright

mass.gov serves **403 Forbidden** to plain `curl` regardless of User-Agent (WAF / bot detection). Playwright would work but is slower per-page and token-heavier; for a one-shot 300-URL pull, Firecrawl is the right tool.
