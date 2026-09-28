# Listing parity audit — 2026-09-28

**Scope:** independent Vercel package `urban-key-main-website-vercel-independent` compared with the managed UrbanKey Singapore catalog.

## Result

| Check | Result |
| --- | --- |
| Managed catalog records | 33 |
| Independent catalog records | 33 |
| Missing independent IDs | 0 |
| Independent-only IDs | 0 |
| Tour-enabled listing IDs | 6 on both sides |
| Exact match on audited business fields | 30 records |
| Intentional independent enrichments | 3 residential records add explicit floor/unit identity |

The audited fields are title, district, address, property type, listing mode, guide price, guide rent, bedrooms, bathrooms, size, tenure, MRT, coordinates, listing floor, and listing unit.

## Intentional enrichments

The managed condominium source derives unit level from its current transaction rows. The independent catalog stores the same identity explicitly so the local Building / Floor plate control can highlight it deterministically:

| Listing | Independent level identity |
| --- | --- |
| Marina Cove Residence | `#28-08` · Level 28 |
| The Interlace Garden Home | `#06-12` · Level 6 |
| Orchard Boulevard Atelier | `#19-02` · Level 19 |

The ten Singapore HDB demonstration listings use the same managed source unit/floor sequence, including Queenstown's `#12-128` · Level 12.

## Media and tour rules

- Marina Cove packages the finalized, matched Morning / Noon / Night media for all six rooms. Timing changes always keep the room's composition-specific source.
- The Interlace and Queenstown show one **As photographed** view for rooms whose alternative timing assets are not published as valid image media; no placeholder or failed image response is exposed.
- The three lead property galleries use bundled product-demo assets, so deployed pages have no runtime dependency on a Manus asset host.
- Every listing remains labelled illustrative unless independently marked verified through the Supabase publication workflow.

## Validation method

A typed Vitest comparison imported both property catalogs and asserted a complete one-to-one ID set. The audit output reported 33 managed and 33 independent records, no missing or extra IDs, the same six tour-enabled IDs, and only the three documented intentional level enrichments.
