# Portable visual asset manifest

These files are copied into the independent deployment bundle so Vercel serves them from `/assets/` rather than from a managed-platform storage path. They remain illustrative product imagery and must not be represented as verified current property photography.

| File | Used for |
| --- | --- |
| `marina-skyline_8ccbeb9b.jpg` | Home-page Singapore skyline visual |
| `interlace-aerial_74c51dd9.jpg` | Residential listing visual |
| `office-interior_791afa97.jpg` | Residential/office listing visual |
| `office-building_b7b74f98.jpg` | HDB/office listing visual |
| `shophouse-office_0083057a.jpg` | Shophouse listing visual |
| `warehouse-exterior_25db9dac.jpg` | Warehouse listing visual |
| `factory-interior_71f18145.jpg` | Factory listing visual |
| `singapore-map-fallback.svg` | Static map fallback when Google Maps is unconfigured or unavailable |

The independent user-data structure is separately supplied as `supabase/user-data-schema.json`. It is a schema/template only and deliberately does not contain private user records, authentication credentials, sessions, or password material.
