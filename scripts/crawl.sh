#!/usr/bin/env bash
# Firecrawl crawl of mass.gov/orgs/massability tree.
# Idempotent: re-running overwrites data/* with fresh fetches.
# Output is post-processed by scripts/refresh-manifest.mjs.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${REPO_ROOT}/.firecrawl"
mkdir -p "${OUT_DIR}"

SEED="https://www.mass.gov/orgs/massability"
LIMIT="${LIMIT:-300}"
MAX_DEPTH="${MAX_DEPTH:-3}"

echo "==> Firecrawl crawl"
echo "    seed:   ${SEED}"
echo "    limit:  ${LIMIT} URLs"
echo "    depth:  ${MAX_DEPTH}"
echo "    output: ${OUT_DIR}"
echo ""

firecrawl crawl "${SEED}" \
  --limit "${LIMIT}" \
  --max-depth "${MAX_DEPTH}" \
  --include-paths "/orgs/massability,/info-details,/news" \
  --wait \
  --progress \
  --pretty \
  --output "${OUT_DIR}/crawl.json"

echo ""
echo "==> Crawl complete. Run: node scripts/refresh-manifest.mjs"
