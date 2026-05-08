# MassAbility-DB — Design

**Date:** 2026-05-08
**Author:** Brainstorming session, FOUR
**Status:** Approved

## Purpose

Open-data publishing repo for MassAbility (formerly MRC) — the Massachusetts state agency that delivers Vocational Rehabilitation, Community Living / Statewide Head Injury Program, Independent Living, and Disability Determination Services. Mirrors the structure of the sister repo [`509dds-data`](https://github.com/Woop91/509dds-data), which covers the DDS-Det division in depth.

## Scope

- **In:** mass.gov pages under `/orgs/massability/*` and any `/info-details/*` linked from there; press releases at `/news/*` mentioning MassAbility or MRC.
- **Out:** per-employee payroll, court filings, FOIA outputs, anything not already on mass.gov.
- **Linked, not copied:** annual reports + RA-process pages already in `509dds-data`. Recorded as `status: "linked"` in the crawl manifest.

## Repo layout

```
MassAbility-DB/
├── README.md
├── data/
│   ├── orgs-massability/       (crawl: /orgs/massability/*)
│   ├── info-details/           (crawl: /info-details/*)
│   ├── press-releases/         (crawl: /news/*, filtered)
│   ├── pdfs/                   (extracted markdown only; raw .pdf gitignored)
│   └── leadership/             (post-extracted org chart + bios)
├── docs/
│   ├── crawl-manifest.json     (URL → local_path, sha256, fetched_at, status)
│   ├── methodology.md
│   ├── related-repos.md        (509dds-data linkage table)
│   └── superpowers/specs/      (this file)
├── scripts/
│   ├── crawl.sh                (firecrawl crawl invocation)
│   └── refresh-manifest.mjs    (rebuild manifest + dedupe)
└── .gitignore
```

## Crawl plan

| Setting | Value |
|---|---|
| Seed | `https://www.mass.gov/orgs/massability` |
| Path filter | `/orgs/massability/*` + `/info-details/*` (linked) + `/news/*` (filtered) |
| Max depth | 3 |
| Max URLs (initial run) | 300 |
| Formats | `markdown`, `links` |
| PDFs | `parsePDF=true`; markdown committed, raw PDF gitignored |

## URL → file mapping

| URL pattern | Saved to |
|---|---|
| `mass.gov/orgs/massability` | `data/orgs-massability/_index.md` |
| `mass.gov/orgs/massability/<slug>` | `data/orgs-massability/<slug>.md` |
| `mass.gov/info-details/<slug>` | `data/info-details/<slug>.md` |
| `mass.gov/news/<slug>` | `data/press-releases/<slug>.md` |
| `*.pdf` | `data/pdfs/<basename>.md` |

## Dedupe rules (linked, not copied)

- `mass.gov/doc/massability-fy24-annual-report` → 509dds-data/data/ma-annual-reports/massability-fy24.md
- `mass.gov/doc/massability-fy25-annual-report` → 509dds-data/data/ma-annual-reports/massability-fy25.md
- `mass.gov/doc/mrc-fy23-annual-report` → 509dds-data/data/ma-annual-reports/mrc-fy23.md
- `mass.gov/doc/state-rehabilitation-council-fy{22,23,24}` → 509dds-data/data/ma-annual-reports/src-fy*.md
- `mass.gov/info-details/reasonable-accommodation*` → 509dds-data/data/ra-process/

These rules are encoded in `scripts/refresh-manifest.mjs::LINKED`.

## Hosting

- Local: `C:\Users\deskc\Documents\MassAbility-DB`
- Remote: `github.com/Woop91/MassAbility-DB` (public)

## Cost

Firecrawl: ~300 URLs × ~$0.001 = ~$0.30 + PDF extraction credits.

## Open items

- After first crawl lands, decide whether to add `data/leadership/` extraction script (org chart from `/orgs/massability/who-we-are` if such a page exists).
- After first crawl lands, evaluate whether full agency CTHRU expansion (all `chris='MRC'` divisions, not just DDS-Det) belongs here or in `509dds-data`.
- Decide cron cadence for re-crawl (mass.gov changes infrequently — likely quarterly).
