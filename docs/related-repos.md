# Related repos

Where another Woop91 repo already holds a MassAbility-relevant artifact, MassAbility-DB links to it instead of duplicating. The crawl post-process flags any URL whose canonical destination already lives in a sister repo as `status: "linked"` in `crawl-manifest.json`.

## 509dds-data

[`Woop91/509dds-data`](https://github.com/Woop91/509dds-data) — the canonical reference for the **DDS-Det division** of MassAbility (Disability Determination Services).

| Artifact in 509dds-data | What it covers | URL pattern that maps to it |
|---|---|---|
| [`data/ma-annual-reports/massability-fy24.md`](https://github.com/Woop91/509dds-data/blob/main/data/ma-annual-reports/massability-fy24.md) | MassAbility FY24 annual report | mass.gov/doc/massability-fy24-annual-report or equivalent |
| [`data/ma-annual-reports/massability-fy25.md`](https://github.com/Woop91/509dds-data/blob/main/data/ma-annual-reports/massability-fy25.md) | MassAbility FY25 annual report | mass.gov/doc/massability-fy25-annual-report |
| [`data/ma-annual-reports/mrc-fy23.md`](https://github.com/Woop91/509dds-data/blob/main/data/ma-annual-reports/mrc-fy23.md) | MRC FY23 (last under MRC name) | mass.gov/doc/mrc-fy23-annual-report |
| [`data/ma-annual-reports/src-fy22.md`](https://github.com/Woop91/509dds-data/blob/main/data/ma-annual-reports/src-fy22.md), [`src-fy23.md`](https://github.com/Woop91/509dds-data/blob/main/data/ma-annual-reports/src-fy23.md), [`src-fy24.md`](https://github.com/Woop91/509dds-data/blob/main/data/ma-annual-reports/src-fy24.md) | State Rehabilitation Council reports | mass.gov/doc/state-rehabilitation-council-fy24 et al. |
| [`data/cthru-staffing/`](https://github.com/Woop91/509dds-data/tree/main/data/cthru-staffing) | MA Comptroller payroll, **DDS-Det subset** of MRC | (not a mass.gov URL — separate Socrata API source) |
| [`data/ra-process/`](https://github.com/Woop91/509dds-data/tree/main/data/ra-process) | Reasonable Accommodation pages | mass.gov/info-details/reasonable-accommodation-process and related |

## How to extend

If you create another Woop91 repo that holds a MassAbility-relevant slice, append a new section here and re-run `node scripts/refresh-manifest.mjs` so the dedupe table picks it up.
