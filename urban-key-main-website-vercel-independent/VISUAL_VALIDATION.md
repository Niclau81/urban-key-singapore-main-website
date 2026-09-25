# Production Visual Validation

## 2026-09-14: portable imagery

The Vercel production homepage hydrates successfully after client-side JavaScript loads. The legacy circular hero class was removed: the homepage now shows the bundled `marina-skyline` asset in a rectangular panel with no circular overlay. The curated discovery cards render their bundled local photographs as visible image elements.

## 2026-09-18: Google Maps 3D deployment

The independent Vercel production deployment for commit `3e570ba` completed successfully. Its live `/map` document loads the Maps JavaScript beta 3D library and creates a `gmp-map-3d` element in **HYBRID** mode with Map ID `22b0489832c689e97c3aae6b`, a central Singapore camera, 50-degree tilt, and a 2,500-metre range. Browser network validation confirmed the Google 3D configuration and terrain metadata requests; no API-key, referrer, billing, Map-ID, or Maps JavaScript initialization error was reported.

The prior 3D readiness timeout has been removed. The production bundle keeps a valid renderer in place and falls back only after direct Google map initialization or Map-ID errors. It also removes listeners and DOM on React cleanup. A follow-up readiness refinement now presents an explicit preparation overlay until Google Maps reports its steady state, so the interface does not claim that a blank WebGL canvas has already rendered.

The sandbox browser used for automated capture has no working GPU/WebGL renderer. It proved the configured 3D element and Google 3D service requests are live, but it could not visually draw photorealistic terrain; in a GPU-disabled run Google returned a direct initialization error and the site showed the branded fallback instead of a blank panel. Therefore, **the live 3D integration and safe failure path are verified, while final visual confirmation of terrain/buildings still requires a normal GPU-capable desktop browser**.

## 2026-09-23: Independent main-site parity release candidate

The production Vite build was validated locally with TypeScript checks, 13 regression tests, and a browser capture of all public and private-route shells: `/`, filtered `/explore`, a valid and invalid direct property profile, `/map`, `/assistants`, `/property-agent`, `/agent/signup`, `/agent/portal`, `/agent/tours`, and `/dashboard`. No application JavaScript exception, failed resource, or route-render error appeared in Chromium logs. The environment’s normal D-Bus warnings were browser-host noise only.

The captured desktop homepage shows the rectangular skyline hero and rendered local images. The detail route shows the gallery, price, specification, save, enquiry, and map hand-off controls. The public discovery flow has the complete 23-record Singapore catalogue, commercial filters, and six labelled planning-demo markets. The selected-market and language controls render in the header and persist browser choices. Local capture confirmed the Malaysia selector route shows its planning-demo records and country-labelled map controls; without local Google environment variables it correctly uses the explicit branded fallback rather than a blank map.

The Vercel environment remains the required final visual reference for the configured Singapore 3D renderer because the local test deliberately has no Google browser configuration and no GPU. The release must therefore retain the existing browser-restricted Maps key and `VITE_GOOGLE_MAPS_MAP_ID` when deployed.

## 2026-09-24: Independent Virtual Property Tour parity

The independent property pages now include the optional **Virtual Property Tour** experience for tour-enabled listings. Marina Cove, The Interlace, and Queenstown use packaged local WebP media under `public/assets/tours/`; no viewer source points to a managed `/manus-storage` asset. The responsive viewer presents the three retained time choices—Morning, Noon, and Night—alongside drag-to-look, full screen, room-to-room hotspots, previous/next controls, clickable floor-layout regions, a room navigator, disclosure, and a request-viewing hand-off.

The local production page capture showed the entire Marina Cove profile through the tour component, with the viewer, room map, time strip, and enquiry action aligned in the desktop layout. Browser interaction validation then selected **Night**, confirmed `/assets/tours/marina-living-night.webp` became the active source, selected **Room 2**, and confirmed `/assets/tours/marina-room2-night.webp` remained active. Direct browser fetches returned HTTP 200 and `image/webp` for the Marina day/night and Queenstown room assets. TypeScript, 14 regression tests, and the Vite production build passed.
