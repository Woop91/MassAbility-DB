# MassAbility-DB

Open data, source documents, and analysis for **MassAbility** — the Massachusetts state agency formerly known as the Massachusetts Rehabilitation Commission (MRC).

> **Naming note:** MRC was renamed **MassAbility** in 2024. CTHRU payroll and many federal datasets still use the legacy code `MRC` (`chris='MRC'`). Treat the two names as synonymous for this dataset.

## What's here

| Folder | Contents |
|---|---|
| [`data/orgs-massability/`](data/orgs-massability/) | Crawled markdown of every page under `mass.gov/orgs/massability/*` |
| [`data/info-details/`](data/info-details/) | Crawled markdown of `mass.gov/info-details/*` pages linked from the agency tree (service catalogs, eligibility, handbooks) |
| [`data/press-releases/`](data/press-releases/) | `mass.gov/news/*` items mentioning MassAbility or MRC |
| [`data/pdfs/`](data/pdfs/) | Markdown extractions of PDFs encountered during the crawl. Raw `.pdf` binaries are gitignored — re-fetch via the source URL recorded in [`docs/crawl-manifest.json`](docs/crawl-manifest.json) |
| [`data/leadership/`](data/leadership/) | Org chart + leadership bios extracted from the above |
| [`docs/`](docs/) | Methodology, sister-repo links, crawl manifest |
| [`scripts/`](scripts/) | Firecrawl invocation + manifest builder |

## MassAbility divisions covered

MassAbility delivers services through several programs/divisions. This repo covers the agency umbrella:

- **Vocational Rehabilitation (VR)** — services that help people with disabilities get and keep jobs
- **Community Living** — including the Statewide Head Injury Program (SHIP)
- **Independent Living** — Independent Living Centers, peer support
- **Disability Determination Services (DDS-Det)** — adjudicates SSI/SSDI claims for the Social Security Administration → see sister repo [`509dds-data`](https://github.com/Woop91/509dds-data) for in-depth coverage of this division

## Sister repo

[`509dds-data`](https://github.com/Woop91/509dds-data) is the canonical reference for the **Disability Determination Services (DDS-Det)** division of MassAbility — the SSDI/SSI claims adjudication arm staffed by SEIU Local 509 members. Where 509dds-data already holds an annual report or dataset, MassAbility-DB links to it rather than duplicating. See [`docs/related-repos.md`](docs/related-repos.md) for the linkage table.

> **DDS disambiguation:** "DDS" in this repo and 509dds-data means **Disability Determination Services** (under MassAbility). It is **NOT** the Department of Developmental Services (DDS-Dev) — a separate MA agency. CTHRU code: `chris='MRC'` for DDS-Det; `DMR` is the legacy code for DDS-Dev.

## License

This repository aggregates data from public-domain government sources (mass.gov, MassAbility publications). Original source documents retain their respective licenses.
