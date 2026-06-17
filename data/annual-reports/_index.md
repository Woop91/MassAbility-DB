# data/annual-reports

Agency and council annual reports published by **MassAbility** (formerly the
Massachusetts Rehabilitation Commission, MRC), converted to Markdown.

This bucket holds reports about the **broad MassAbility agency / its Vocational
Rehabilitation (VR) program** — i.e. the umbrella scope of this repo.

> **Scope note.** Reports that carry **Disability Determination Services (DDS-Det)**
> budget/headcount/operational stats — the SSI/SSDI claims-adjudication division
> staffed by SEIU Local 509's Vocational Disability Examiners — are kept canonically
> in the sister chapter repo [`509dds-data/data/ma-annual-reports/`](https://github.com/Woop91/509dds-data/tree/main/data/ma-annual-reports)
> (MassAbility FY24/FY25, MRC FY23) and **linked** from here via
> [`docs/related-repos.md`](../../docs/related-repos.md), not duplicated.

## Inventory

| File | Type | Sidecar | Notes |
|---|---|---|---|
| `src-fy22.md` | MD | ✅ | **State Rehabilitation Council (SRC)** Annual Report FY2022. The SRC is the federally mandated advisory body to MassAbility's **Vocational Rehabilitation** division — VR program governance, no DDS-Det content. |
| `src-fy23.md` | MD | ✅ | SRC Annual Report FY2023 (same scope as FY22). |

### Provenance

`src-fy22.md` and `src-fy23.md` were **relocated here on 2026-06-17** from
`509dds-data/data/ma-annual-reports/`. They are State Rehabilitation Council
reports, which by federal statute advise only the **Vocational Rehabilitation (VR)**
division — they contain zero DDS-Det / Vocational Disability Examiner content and
therefore do not belong in the DDS-Det chapter repo. Their original `.meta.json`
provenance sidecars travelled with them (with `relocated_from` recorded). The
genuine SRC FY24 report is not held in either repo (the file once named
`src-fy24.md` in the chapter repo was a mislabeled byte-identical duplicate of the
MassAbility FY24 agency report and was removed there).
