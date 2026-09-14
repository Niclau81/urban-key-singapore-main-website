# Production Visual Validation

## 2026-09-14

The Vercel production homepage hydrates successfully after client-side JavaScript loads. The legacy circular hero class was removed: the homepage now shows the bundled `marina-skyline` asset in a rectangular panel with no circular overlay. The curated discovery cards render their bundled local photographs as visible image elements.

The production map route loads the standard interactive Google map and explicitly reports that `VITE_GOOGLE_MAPS_MAP_ID` is absent. The code contains the conditional Maps JavaScript 3D path and will switch to photorealistic 3D only after the user-owned Map ID is associated with a published Google Cloud 3D Hybrid style and added to Vercel. The production package contains no private credentials.
