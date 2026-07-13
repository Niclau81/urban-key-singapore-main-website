# Virtual View and Immersive Model QA

## Interlace Garden Home

Preview: `https://3000-i2hswu7glyn6x16dgsxak-18a117d6.sg1.manus.computer/property/interlace-garden-06-12`

- **Building mode:** visually verified at desktop width. All three towers and the podium are centered within the 3D viewport, with balanced clearance on all sides. The geometry no longer clips against the left or bottom edge.
- **Floor plate mode:** visually verified after switching modes. The flattened massing remains centered horizontally and vertically, with the complete footprint visible and no lower-left clipping.
- **Inactive controls:** the model initially displays “Click model to enable rotate and zoom,” confirming that ordinary page scrolling remains the default before activation.

- **Click activation:** clicking the canvas changes the instruction to “Drag to rotate · Scroll to zoom · Esc to release,” confirming explicit activation.
- **Active wheel isolation:** a cancelable wheel event dispatched inside the active model was prevented, and the page stayed at `scrollY = 1649`; the immersive camera received the input without moving the document.
- **Release behavior:** after Escape, the next wheel event was not prevented, confirming that normal page-wheel behavior is restored outside the active model interaction.

- **Visible release state:** after Escape and a render tick, the instruction returns to “Click model to enable rotate and zoom,” confirming that the model is no longer capturing wheel input.
- **Current Interlace virtual scene:** the currently assigned first gallery image is an interior-only office view and correctly shows no exterior overlay; the reported central-opening image must be checked on the property/gallery entry where that source image is assigned.

Pending in this QA pass: corrected Night rendering on the central exterior-opening image.

### Central exterior-opening setup

- Marina Cove gallery **View image 2** was selected because it matches the reported room composition with a central bay opening.
- **Night** was activated for the selected scene; the next visual inspection checks the feathered opening shape and confirms that no rectangular panel covers the sofa or adjacent interior surfaces.

### Central exterior-opening result

- The selected Night scene now darkens only the distant central bay/open-view area with feathered edges.
- The former hard rectangular panel is absent: the sofa, chairs, shelving, ceiling, side walls, kitchen surfaces, and foreground floor remain unobstructed.
- The active state and caption both confirm **Night perspective**, so the verified rendering is the requested nocturnal mode rather than a daytime fallback.

## Current timed-sky defect reference

The affected `/manus-storage/office-interior_791afa97.jpg` source image is 1499×1064. Its exterior sky is visible only through the narrow glazed band on the right side of the room, approximately from 72%–94% of image width and 43%–67% of image height, with sloping top and bottom boundaries created by the ceiling line and stair structure. The current scene-mask map returns `null` for this image, so selecting Evening, Night, or Midnight cannot alter that visible sky.
