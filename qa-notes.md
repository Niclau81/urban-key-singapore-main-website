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
