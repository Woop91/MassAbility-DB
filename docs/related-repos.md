# Related repos

Where another Woop91 repo already holds a MassAbility-relevant artifact, MassAbility-DB
links to it instead of duplicating. The crawl post-process flags any URL whose
canonical destination already lives in a sister repo as `status: "linked"` in
`crawl-manifest.json`.

The relationship is **directional**: MassAbility-DB (the umbrella agency repo) MAY
reference the **entire** DDS-Det chapter below; the chapter repo (`509dds-data`) never
references back up to the umbrella. This file maps the **whole** DDS-Det chapter so the
umbrella can point at any part of it.

## 509dds-data — the full DDS-Det chapter

[`Woop91/509dds-data`](https://github.com/Woop91/509dds-data) — the canonical reference
for the **DDS-Det division** of MassAbility (**Disability Determination Services**, the
SSI/SSDI claim-adjudication division), and for the **Vocational Disability Examiners
(VDEs)** who staff it as **SEIU Local 509 Units 8 & 10** (Boston + Worcester).

> **Disambiguation:** "DDS" here is always **Disability Determination Services**, never
> the separate Department of Developmental Services (DDS-Dev). "VDE" (Vocational
> Disability Examiner = claims adjudication) is **not** "VR" (Vocational Rehabilitation
> = a different MassAbility counseling program). The chapter's scope boundary is
> codified in [`509dds-data/SCOPE.md`](https://github.com/Woop91/509dds-data/blob/main/SCOPE.md).

### Repo root

| Path | What it covers |
|---|---|
| [`README.md`](https://github.com/Woop91/509dds-data/blob/main/README.md) | Chapter repo overview and scope |
| [`SCOPE.md`](https://github.com/Woop91/509dds-data/blob/main/SCOPE.md) | The keep-it-VDE-only routing rule (umbrella↔chapter boundary) |
| [`catalog.json`](https://github.com/Woop91/509dds-data/blob/main/catalog.json) / [`llms.txt`](https://github.com/Woop91/509dds-data/blob/main/llms.txt) | Machine catalog + LLM index of the whole dataset |
| [`embeddings/`](https://github.com/Woop91/509dds-data/tree/main/embeddings) | Vector index for AI retrieval over the chapter corpus |
| [`schemas/`](https://github.com/Woop91/509dds-data/tree/main/schemas) | `dataset.meta` JSON schema for the `.meta.json` sidecars |
| [`scripts/`](https://github.com/Woop91/509dds-data/tree/main/scripts) | Build/fetch scripts (metrics-seed migration, VDE/manager pay builders, manifest refresh) |
| [`dds-25-year-chart.html`](https://github.com/Woop91/509dds-data/blob/main/dds-25-year-chart.html), [`staffing-vs-workload.html`](https://github.com/Woop91/509dds-data/blob/main/staffing-vs-workload.html) | Standalone DDS-Det staffing/workload visualizations |
| [`prr-templates/`](https://github.com/Woop91/509dds-data/tree/main/prr-templates) | Ready-to-file MA PRR (c.66) + federal FOIA templates targeting VDE/DDS-Det data gaps (`massability-dds-prr.md`, `massability-dds-prr-2.md`, `ssa-foia-ma-dds.md`, `ma-comptroller-payroll-prr.md`, `ma-hrd-classification-prr.md`; superseded `massability-prr.md`/`ssa-foia.md`; plus `drafts/`) |

> Root tooling/CI/scratch not enumerated here (not umbrella-relevant): `tests/`,
> `.github/`, `.husky/`, `reports/`, `pytest.ini`, and the `gao-urls-found.txt` /
> `search-cbpp-ssdi.json` acquisition scratch files.

### `data/` top-level files

| Path | What it covers |
|---|---|
| [`data/dds-statistics-master-table.json`](https://github.com/Woop91/509dds-data/blob/main/data/dds-statistics-master-table.json) (+ `.meta.json`, `.source.xlsx`) | DDS-Det operational series (receipts, dispositions, % allowed, CDR, CE/MER, accuracy, cost-per-case, DDS-Det operating budget, % federal funding), FY2013–2025 |
| [`data/MANUAL-FETCH-NEEDED.md`](https://github.com/Woop91/509dds-data/blob/main/data/MANUAL-FETCH-NEEDED.md) | Bot-blocked SSA/BLS/GAO/CBPP public-data fetch checklist |
| [`data/fetch-manifest-2026-05-05.json`](https://github.com/Woop91/509dds-data/blob/main/data/fetch-manifest-2026-05-05.json) (+ `.meta.json`) | Playwright crawl provenance log for SSA/BLS/GAO/CBPP sources |

### `data/` folders (the chapter's data backbone)

| Folder | What it covers | Scope note |
|---|---|---|
| [`data/ssa/`](https://github.com/Woop91/509dds-data/tree/main/data/ssa) | SSA datasets backing DDS-Det: `staffing/`, `allowance-rates/`, `budget/` (Congressional Justification DDS work-years + budget authority), `performance/` (APR), `claims/`, `workload-data-total/`, `oho/` (post-DDS ALJ appeal stage), `covid-telework/`, `foia/`, `refresh/`, FYWL/accuracy/CDR/processing-time CSVs, OIG staffing audit, peer-state timeseries, `FETCH_REPORT.md` | DDS-Det adjudication stats + peer-state comparables |
| [`data/external/`](https://github.com/Woop91/509dds-data/tree/main/data/external) | Third-party comparables corpus: `bea-rpp/`, `bls-cpi/`, `bls-oews/` (claims-examiner SOC 13-1031 wages), `cbpp/`, `kff/`, `nade/` (Nat'l Assoc. of Disability Examiners + state-chapter bylaws), `research/` (`gao/ oig/ urban/ academic/ ssa-research/ ssab/ crfb/ cbpp/`), `seiu509/` (the chapter's own parent union), `waiting-times/` | Economic comparables + DDS research + parent-union reference |
| [`data/pay-scales/`](https://github.com/Woop91/509dds-data/tree/main/data/pay-scales) | VDE compensation backbone: Unit 8/10 salary charts (`effective-*.md`), `vde-grades-extracted.json`, per-employee VDE salary+OT, DDS-Det manager timeline, agency-wide MRC manager source pull, `peer-states/` DDS examiner pay | VDE pay/classification + peer-state DDS pay |
| [`data/contract/`](https://github.com/Woop91/509dds-data/tree/main/data/contract) | Executed **SEIU 509 Units 8 & 10 CBA 2024–2026** (`seiu-509-cba-2024-2026.md` + `dds-cba-2024-2026.source.pdf`) governing the VDE job class | The governing contract for VDEs |
| [`data/labor-rights/`](https://github.com/Woop91/509dds-data/tree/main/data/labor-rights) | Filing/reference KB for stewards & members: member guide, cheat sheet, statute index, MA agencies (DLR/MCAD/CSC/AGO/DLS/DIA/Ethics), federal (EEOC/DOL-WHD/OSHA/NLRB), DFML, `agencies.json` | Labor-rights filing references usable by the chapter |
| [`data/oversight/`](https://github.com/Woop91/509dds-data/tree/main/data/oversight) | Federal oversight library: `gao/` (DDS evidence/fraud/CAL/medical-consultant reports) + `oig-other/` (SSA OIG DDS staffing/processing-time audits) | DDS-Det operations/staffing/quality |
| [`data/ma-annual-reports/`](https://github.com/Woop91/509dds-data/tree/main/data/ma-annual-reports) | Agency annual reports kept for their DDS sections: `massability-fy24.md`, `massability-fy25.md`, `mrc-fy23.md` (each carries DDS budget/claim-volume/accuracy/allowance/staffing stats), plus `_index.md` provenance | DDS-Det budget/headcount/operational stats only |
| [`data/prr-responses/`](https://github.com/Woop91/509dds-data/tree/main/data/prr-responses) | The chapter's OWN public-records productions (Vizcaino matter): RA-request counts (`2026-05-21-massability-ra-requests-monthly.csv` + `2026-05-21-ehs-ra-requests-data.source.xlsx`), `2025-06-06-vizcaino-responsive-materials.pdf` | Chapter-procured records |
| [`data/ra-process/`](https://github.com/Woop91/509dds-data/tree/main/data/ra-process) | Reasonable-accommodation reference for DDS-Det/VDE workers: `massability-dds-info.md`, `contacts.md`, MOD EO 592 process, HRD RA application, disability-rights framework, ADA-coordinator listing, DLC self-advocacy guide, `seiu-509-units-8-10.md` | RA process for these workers |
| [`data/workload/`](https://github.com/Woop91/509dds-data/tree/main/data/workload) | DDS Boston workload-pressure evidence: documented overtime weeks + elevated (18-case) intake-cap weeks, May 2025–May 2026 (PII-scrubbed) | VDE workload/overtime |
| [`data/cthru-staffing/`](https://github.com/Woop91/509dds-data/tree/main/data/cthru-staffing) | DDS-Det headcount from MA CTHRU payroll: `dds-staff-totals.json`, `vde-headcount-by-grade-and-year.json`, + `leadership-research/` (DDS-Det management chain & VDE career ladder) | DDS-Det subset of MRC payroll |
| [`data/screenshots/`](https://github.com/Woop91/509dds-data/tree/main/data/screenshots) | Source-evidence images: `2025-dds-stats.png` (MA DDS FY25 case-processing slide), `screenshot-2025-09-09.png` (SSA wait-times-by-state choropleth) | DDS-Det stat captures |

### `docs/` (methodology, disambiguation, design)

| Path | What it covers |
|---|---|
| [`docs/dds-det-vs-dds-dev.md`](https://github.com/Woop91/509dds-data/blob/main/docs/dds-det-vs-dds-dev.md) | **Critical disambiguation:** DDS = Disability Determination Services (not Dept of Developmental Services), and VDE ≠ VR |
| [`docs/methodology.md`](https://github.com/Woop91/509dds-data/blob/main/docs/methodology.md) | Year conventions, per-metric sourcing, CTHRU vs SSA SAOR staffing, VDE salary derivation |
| [`docs/fy22-allowance-rate-reconciliation.md`](https://github.com/Woop91/509dds-data/blob/main/docs/fy22-allowance-rate-reconciliation.md) | MA vs SSA FYWL allowance-rate reconciliation |
| [`docs/peer-states-comparison.json`](https://github.com/Woop91/509dds-data/blob/main/docs/peer-states-comparison.json) | Peer-state DDS workload/allowance comparison (FY2020–2024) |
| [`docs/economic-indicators-design-2026-06-03.md`](https://github.com/Woop91/509dds-data/blob/main/docs/economic-indicators-design-2026-06-03.md) | BLS CPI / BEA cost-of-living indicator design for VDE real-pay arguments |
| [`docs/records-request-gap-analysis.md`](https://github.com/Woop91/509dds-data/blob/main/docs/records-request-gap-analysis.md) | Gap → custodian → PRR/FOIA routing for DDS-Det records |
| [`docs/firecrawl-gap-fill-session-2026-05-08.md`](https://github.com/Woop91/509dds-data/blob/main/docs/firecrawl-gap-fill-session-2026-05-08.md) | DDS-Det source-acquisition session log |
| [`docs/ai-retrieval-index-scope-decisions.md`](https://github.com/Woop91/509dds-data/blob/main/docs/ai-retrieval-index-scope-decisions.md) + [`docs/superpowers/`](https://github.com/Woop91/509dds-data/tree/main/docs/superpowers) | The repo's own embeddings/retrieval + economic-indicator build plans |

## Content relocated INTO this umbrella from the chapter

Material that does not belong in the VDE-only chapter is relocated here and held
canonically by MassAbility-DB:

| Path (here) | Origin | Why moved |
|---|---|---|
| [`data/annual-reports/src-fy22.md`](../data/annual-reports/src-fy22.md), [`src-fy23.md`](../data/annual-reports/src-fy23.md) | `509dds-data/data/ma-annual-reports/` (2026-06-17) | **State Rehabilitation Council** reports — the SRC advises only the **Vocational Rehabilitation** division; no DDS-Det content. Out of chapter scope. |

## How to extend

If you create another Woop91 repo that holds a MassAbility-relevant slice, append a new
section here and re-run `node scripts/refresh-manifest.mjs` so the dedupe table picks it
up. When relocating content **into** MassAbility-DB out of the DDS-Det chapter (e.g. the
SRC VR reports above), add the canonical copy here, record it under "Content relocated
INTO this umbrella," and drop the corresponding row from the 509dds-data map.
