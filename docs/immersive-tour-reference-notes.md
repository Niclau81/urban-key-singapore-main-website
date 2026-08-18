# Immersive Tour Reference Notes

The supplied public example uses a dedicated dark immersive viewer rather than a gallery card. Its interaction model separates the experience into a large primary viewing canvas and a persistent right-side navigation rail.

The original UrbanKey implementation will adopt the following general interaction patterns without copying proprietary code, layout assets, capture content, or branding:

| Observed public interaction pattern | Original UrbanKey interpretation |
|---|---|
| A primary room/panorama canvas with the current room name | Full-bleed tour canvas with a clear room label and media-type label. |
| On-canvas movement markers | Original accessible jump markers that switch only between approved tour stops. |
| A right rail with several floors and blue jump dots | Original vertically stacked floor cards with labelled room-stop dots and a visible active state. |
| Full-screen control | A keyboard-accessible focus-contained full-screen viewer with an exit button. |
| A notice that tours/floor plans may be approximate | Clear distinction between verified 360° assets, guided photo fallback, and illustrative floor-plan context. |

The viewer model must preserve UrbanKey’s existing photo-timing selector when the listing does not provide a verified 360° panorama. Ordinary photographs must not be rendered or labelled as a true panorama.
