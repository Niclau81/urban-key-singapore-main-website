# Asset-inclusive Vercel package validation

The independent production build was checked in a browser after adding the portable asset bundle.

| Check | Result |
| --- | --- |
| Homepage visual | The bundled Singapore skyline image rendered from `/assets/marina-skyline_8ccbeb9b.jpg`. |
| Property visuals | Listing-card images are served from the included `/assets/` directory. |
| Map without a Google Maps key | The page rendered `singapore-map-fallback.svg` and a clear configuration notice instead of an empty canvas. |
| User-data JSON | `supabase/user-data-schema.json` parsed successfully and intentionally contains schema/template data only, not private user records. |

The live Google Maps surface activates after a browser-restricted `VITE_GOOGLE_MAPS_API_KEY` is configured in Vercel and the project is redeployed.
