# Production Visual Validation

## 2026-09-14: portable imagery

The Vercel production homepage hydrates successfully after client-side JavaScript loads. The legacy circular hero class was removed: the homepage now shows the bundled `marina-skyline` asset in a rectangular panel with no circular overlay. The curated discovery cards render their bundled local photographs as visible image elements.

## 2026-09-18: Google Maps 3D deployment

The independent Vercel production deployment for commit `3e570ba` completed successfully. Its live `/map` document loads the Maps JavaScript beta 3D library and creates a `gmp-map-3d` element in **HYBRID** mode with Map ID `22b0489832c689e97c3aae6b`, a central Singapore camera, 50-degree tilt, and a 2,500-metre range. Browser network validation confirmed the Google 3D configuration and terrain metadata requests; no API-key, referrer, billing, Map-ID, or Maps JavaScript initialization error was reported.

The prior 3D readiness timeout has been removed. The production bundle keeps a valid renderer in place and falls back only after direct Google map initialization or Map-ID errors. It also removes listeners and DOM on React cleanup. A follow-up readiness refinement now presents an explicit preparation overlay until Google Maps reports its steady state, so the interface does not claim that a blank WebGL canvas has already rendered.

The sandbox browser used for automated capture has no working GPU/WebGL renderer. It proved the configured 3D element and Google 3D service requests are live, but it could not visually draw photorealistic terrain; in a GPU-disabled run Google returned a direct initialization error and the site showed the branded fallback instead of a blank panel. Therefore, **the live 3D integration and safe failure path are verified, while final visual confirmation of terrain/buildings still requires a normal GPU-capable desktop browser**.
