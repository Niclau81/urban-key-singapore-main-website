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

## Functional research update

Official public 3D-tour documentation confirms that an immersive tour is built from panorama nodes rather than a single wide gallery image. A usable capture route includes every room and connecting hallway, maintains line of sight between nodes, and places additional nodes across larger spaces. The resulting viewer should enable camera movement inside a room, scene-to-scene transitions through visible jump controls, and an interactive floor context.[1]

The original UrbanKey renderer therefore uses a WebGL photo sphere for approved equirectangular sources, keeps camera drag/swipe and field-of-view zoom inside that sphere, and projects room-jump nodes into the current camera view. Its floor cards remain an original schematic wayfinding layer rather than a copied floor-plan asset. Generated or wide still images can use the same interaction surface only with a persistent **Illustrative panorama preview** label; they are never upgraded to verified capture status.

The capture workflow must require a planned route, at least one panorama per room and connecting hall, a stable centre-room or evenly spaced large-room position, and a human review of blur candidates. Official guidance warns that automatic blur may miss sensitive information and requires human review; it must not be used to hide material defects.[1]

## References

[1]: https://www.zillow.com/3d-home/faq/ "Zillow 3D Home FAQ"
[2]: https://www.zillow.com/3d-home/360-camera-guide/ "Zillow 3D Home 360 Camera Guide"
[3]: https://www.zillow.com/news/how-zillow-made-virtual-tours-feel-even-more-like-being-there-in-person/ "Zillow: How virtual tours feel more like being there" 
