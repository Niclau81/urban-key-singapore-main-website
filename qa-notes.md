# QA Notes

## 2026-07-13 — Virtual sky and immersive controls

- Verified `/property/orchard-boulevard-19-02` in the live preview because its first tour image is `office-building_b7b74f98.jpg`, the scene with a genuine exterior bay-view opening.
- The noon virtual-view state renders in the central opening while the surrounding cabinetry, ceiling, shelving, and foreground remain outside the exterior mask.
- Verified `/property/interlace-garden-06-12` and Orchard’s second tour image use `office-interior_791afa97.jpg`. Direct inspection of the 1499×1064 source confirms a narrow exterior sky band through the diagonal right-side window wall; the final mask is confined to that band and stops above the balcony rail and stair void.
- The immersive model displays the activation affordance: “Click model to enable pan, rotate and zoom.”
- Automated regressions cover inactive motion, horizontal pan, vertical pan, diagonal pan, and the corrected scene-mask mappings.

### Source-asset correction

The live tour and direct storage asset confirm that `office-interior_791afa97.jpg` is a 1499×1064 office scene with a diagonal glazed wall on the right. The visible sky occupies the upper portions of several panes, approximately within the rightmost 78–94% of the image and 38–57% vertically. The earlier polygon extended too far down the glazing, while its strongest color fell below the visible sky. The corrected polygon follows the diagonal sky band and ends before the railing. Source checked through the project storage route: `/manus-storage/office-interior_791afa97.jpg`.

### Final clean-server verification

After a clean development-server restart, the **Building** WebGL canvas was activated and exercised with horizontal, vertical, and diagonal primary-pointer drags. Each gesture produced a distinct rendered-frame hash. The model was then switched to **Floor plate**, refitted, activated, and exercised with the same three drag directions; each again produced a distinct frame hash. This confirms visible two-axis and diagonal panning in both representations rather than merely confirming the instruction label.

Accumulated panning is radially clamped to a mode-specific safe bound. Every Building/Floor plate switch recomputes the geometry bounds, centered target, camera distance, zoom limits, and pan limit. Shift-drag and secondary drag remain rotation gestures; wheel zoom remains activation-gated and bounded.

The complete Vitest suite, TypeScript no-emit check, and production build completed successfully. The build emitted only its existing large-chunk advisory and no compilation failure.

## Window-layer recomposition findings

- The office interior source contains four distinct upper sky panes on the right wall. The opaque black mullions, lower balcony rails, ceiling, stair glass and room surfaces must remain in the original foreground photo.
- The bay-view source exposes exterior sky only through the central opening above the balcony/furniture line. The full original room image must be the top layer, with only that conservative aperture cut out to reveal a period sky placed beneath it.
- The corrected composition therefore uses: timed sky underlay, source-photo foreground with transparent exterior apertures, then non-destructive interior illumination and controls.

### Live model checkpoint after recomposition

The refreshed Orchard page derives **#19-02 · Level 19** from the listing data and displays the gold-level highlight explanation in the immersive model. Both model tabs remain available, and the activation affordance now states that orbit, pan and zoom are supported. This checkpoint was recorded before exercising actual pointer gestures and switching model modes.

After activation, the Building canvas switches to the explicit live instruction **“Drag to orbit · Shift/right-drag to pan · Scroll to zoom · Esc to release.”** The Level 19 badge and gold geometry remain visible in this active state, confirming that enabling model controls does not hide the listed-floor context.

Scripted horizontal, vertical, and diagonal primary-pointer drags changed the rendered Building orientation in the subsequent browser screenshot, confirming that the active canvas now orbits from multiple axes. The canvas `toDataURL()` hash remained static because the WebGL buffer is not preserved; visual screenshots—not buffer hashes—are therefore the valid live comparison for this renderer.

Switching to **Floor plate** refits the model to the isolated gold Level 19 geometry while retaining the **#19-02 · Level 19** badge. Activating this mode exposes the same all-angle orbit, modifier-pan, wheel-zoom and Escape-release instructions as Building mode.

Horizontal, vertical, and diagonal primary-pointer drags were then dispatched in active Floor plate mode. The follow-up screenshot shows the isolated gold Level 19 slab and podium from a visibly different camera angle, confirming that unrestricted orbit works after the mode refit as well as in Building mode.

The initial broad scroll for virtual-view verification overshot the component into Property intelligence. Subsequent layer checks should use exact DOM element positioning rather than additional viewport scrolling; the page remains on the same verified Orchard listing.

Exact DOM positioning then exposed the full **Noon** virtual view. The source photograph remains visually intact as the upper foreground: ceiling, walls, dark mullions, shelves, plants, furniture and the horizontal bay frame are opaque. Only the measured exterior aperture presents the period sky underlay.

After selecting **Night**, the period control and caption updated, but live inspection still showed the original bright daytime exterior in the central aperture. The first alpha-mask correction was therefore necessary but not sufficient; computed mask application and replaced-element masking must be diagnosed before sign-off.

Computed-style inspection confirmed the first inverse SVG remained fully opaque because transparent child polygons did not subtract from an already opaque parent rectangle. Replacing it with a true SVG luminance cut-out fixed the stack. Live **Night** verification now shows a dark sky through the measured upper exterior aperture, while the original photograph remains above it: ceiling, mullions, horizontal bay frame, walls, cabinetry, plants, chairs, table and shelves are unchanged and opaque.

The second office-interior scene was also inspected at **Night**. Its computed foreground mask uses four source-measured diagonal pane polygons as subtractive cut-outs. The unchanged source photo remains fully opaque outside those panes, and a separate 20%-opacity original-glass reflection layer is clipped only to the same panes above the timed underlay.

A direct **Noon → Night** comparison on that office-interior scene confirmed the intended three-layer behavior: the exterior color beneath the four panes changes from pale daylight to a deep blue night atmosphere; the original window mullions and subtle source-glass reflection stay above it; and the ceiling, walls, stair void, desk, shelving, plant and floor remain visually unchanged.
