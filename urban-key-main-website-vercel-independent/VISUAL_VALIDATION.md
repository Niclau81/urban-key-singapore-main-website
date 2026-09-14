# Production Visual Validation

## 2026-09-14

The Vercel production homepage hydrates successfully after client-side JavaScript loads. The hero media container is now rectangular and the bundled `marina-skyline` asset is itself a normal rectangular photograph. A remaining circular overlay is therefore introduced by homepage styling rather than by the image source and must be removed. The listing section remains below the initial viewport and requires a separate rendered check after the overlay repair.

The production package does not contain private credentials. A photorealistic 3D Google map still requires the user-owned `VITE_GOOGLE_MAPS_MAP_ID` and a published Google Cloud 3D Hybrid map style; otherwise the application keeps its standard-map or bundled-fallback behaviour.
