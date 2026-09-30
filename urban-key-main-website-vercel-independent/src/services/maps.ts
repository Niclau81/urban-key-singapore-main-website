import { Loader } from "@googlemaps/js-api-loader";
import { externalConfig, hasGoogleMapsConfig } from "./config";
import { getMarketConfig, type MarketId } from "./market";
import { SINGAPORE_ISLAND_POLYGONS, type IslandCoordinate } from "../singaporeIslands";

type CameraBounds = { north: number; south: number; east: number; west: number };
type MapCenter = { lat: number; lng: number; altitude?: number };
type Map3DElement = HTMLElement & {
  bounds?: CameraBounds;
  maxAltitude?: number;
  center?: MapCenter;
  range?: number;
  tilt?: number;
  heading?: number;
};
type Marker3DInteractiveElement = HTMLElement;
type Polygon3DElement = HTMLElement & { path?: IslandCoordinate[] };
type Maps3DLibrary = {
  Map3DElement: new (options: Record<string, unknown>) => Map3DElement;
  Marker3DInteractiveElement: new (options: Record<string, unknown>) => Marker3DInteractiveElement;
  Polygon3DElement?: new (options: Record<string, unknown>) => Polygon3DElement;
};
type StandardMap = {
  setCenter?: (center: { lat: number; lng: number }) => void;
  setZoom?: (zoom: number) => void;
  setTilt?: (tilt: number) => void;
  setHeading?: (heading: number) => void;
};
type StandardMarker = { setMap?: (map: unknown) => void; addListener?: (event: string, handler: () => void) => void };
type MapWindow = Window & typeof globalThis & {
  google?: {
    maps?: {
      Map: new (element: HTMLElement, options: Record<string, unknown>) => StandardMap;
      Marker: new (options: Record<string, unknown>) => StandardMarker;
      importLibrary?: (library: "maps3d") => Promise<Maps3DLibrary>;
    };
  };
};

type MapRender = { mode: "3d" | "standard"; dispose: () => void; updateCamera: (focus?: MapFocus) => void };

export type MapPresentation = "hero" | "listings" | "regions";
export type MapFocus = {
  latitude: number;
  longitude: number;
  title: string;
  range?: number;
  tilt?: number;
  heading?: number;
};
export type MapListing = MapFocus & { id: string; label: string; commercial?: boolean };

// Country boundary including offshore islands, intentionally excluding Johor, Batam and other neighbouring territories.
const SINGAPORE_BOUNDS: CameraBounds = { north: 1.48, south: 1.13, west: 103.58, east: 104.12 };
const SINGAPORE_OVERVIEW = { lat: 1.3521, lng: 103.8198 };
// Includes Jurong Island in the west and Pulau Tekong / Ubin in the east.
const SINGAPORE_OUTER_ISLANDS_OVERVIEW = { lat: 1.346, lng: 103.872 };
const SINGAPORE_OVERVIEW_RANGE = 36_000;
// The hero starts with water around the complete island group so the geographic outline,
// outer islands and full listing distribution remain visible at every overview zoom.
const SINGAPORE_HERO_RANGE = 58_000;
const SINGAPORE_LISTINGS_RANGE = 32_000;

type ListingMarkerOptions = {
  position: { lat: number; lng: number; altitude: number };
  altitudeMode: "RELATIVE_TO_MESH";
  extruded: true;
  label: string;
  title: string;
};

type Camera = { center: MapCenter; range: number; tilt: number; heading: number };

function mapCamera(focus: MapFocus | undefined, marketId: MarketId, presentation: MapPresentation): Camera {
  const market = getMarketConfig(marketId);
  if (focus) {
    return {
      center: { lat: focus.latitude, lng: focus.longitude, altitude: 0 },
      range: focus.range ?? 2_400,
      tilt: focus.tilt ?? 58,
      heading: focus.heading ?? 340,
    };
  }
  if (marketId === "singapore") {
    if (presentation === "hero") {
      return { center: { ...SINGAPORE_OUTER_ISLANDS_OVERVIEW, altitude: 0 }, range: SINGAPORE_HERO_RANGE, tilt: 0, heading: 0 };
    }
    return presentation === "regions"
      ? { center: { ...SINGAPORE_OVERVIEW, altitude: 0 }, range: SINGAPORE_OVERVIEW_RANGE, tilt: 12, heading: 0 }
      : { center: { ...SINGAPORE_OVERVIEW, altitude: 0 }, range: SINGAPORE_LISTINGS_RANGE, tilt: 24, heading: 0 };
  }
  return { center: { ...market.center, altitude: 0 }, range: 4_400, tilt: 45, heading: 20 };
}

function observe3DMapEvents(map: Map3DElement, onFailure?: (error: Error) => void, onReady?: () => void) {
  let reported = false;
  const report = (message: string) => {
    if (reported) return;
    reported = true;
    onFailure?.(new Error(message));
  };
  const onMapError = () => report("Google Maps 3D could not initialise. The bundled Singapore map is shown instead.");
  const onMapIdError = () => report("The configured Google Maps Map ID is not valid for 3D map rendering. The bundled Singapore map is shown instead.");
  const onSteadyChange = (event: Event) => {
    const steady = (event as Event & { isSteady?: boolean; detail?: { isSteady?: boolean } }).isSteady
      ?? (event as Event & { detail?: { isSteady?: boolean } }).detail?.isSteady;
    if (steady) onReady?.();
  };
  map.addEventListener("gmp-error", onMapError);
  map.addEventListener("gmp-map-id-error", onMapIdError);
  map.addEventListener("gmp-steadychange", onSteadyChange);
  return () => {
    map.removeEventListener("gmp-error", onMapError);
    map.removeEventListener("gmp-map-id-error", onMapIdError);
    map.removeEventListener("gmp-steadychange", onSteadyChange);
  };
}

function markerLabel(listing: MapListing) {
  // Compact labels retain the original live-listings view without covering the island at overview scale.
  return listing.commercial ? "C" : "H";
}

function createListingMarkers(
  map: Map3DElement,
  Marker3DInteractiveElement: Maps3DLibrary["Marker3DInteractiveElement"],
  listings: MapListing[],
  onListingSelect?: (listingId: string) => void,
) {
  return listings.map(listing => {
    const marker = new Marker3DInteractiveElement({
      position: { lat: listing.latitude, lng: listing.longitude, altitude: 24 },
      altitudeMode: "RELATIVE_TO_MESH",
      extruded: true,
      label: markerLabel(listing),
      title: listing.title,
    } satisfies ListingMarkerOptions);
    marker.dataset.urbankeyListingId = listing.id;
    marker.dataset.urbankeyListingKind = listing.commercial ? "commercial" : "home";
    marker.setAttribute("aria-label", `View ${listing.title} on the map`);
    marker.addEventListener("gmp-click", () => onListingSelect?.(listing.id));
    map.append(marker);
    return marker;
  });
}

function createGeographicIslandOverlays(
  map: Map3DElement,
  Polygon3DElement: Maps3DLibrary["Polygon3DElement"],
  presentation: MapPresentation,
) {
  if (presentation !== "hero" || !Polygon3DElement) return [];
  return SINGAPORE_ISLAND_POLYGONS.map((path, index) => {
    const polygon = new Polygon3DElement({
      strokeColor: "#67fff0e6",
      strokeWidth: index === 0 ? 5 : 4,
      fillColor: "#00e8d614",
      drawsOccludedSegments: false,
    });
    polygon.path = path;
    polygon.dataset.urbankeyMapLayer = "singapore-island-boundary";
    map.append(polygon);
    return polygon;
  });
}

export async function renderSingaporeMap(
  element: HTMLElement,
  on3DFailure?: (error: Error) => void,
  on3DReady?: () => void,
  focus?: MapFocus,
  marketId: MarketId = "singapore",
  listings: MapListing[] = [],
  onListingSelect?: (listingId: string) => void,
  presentation: MapPresentation = "listings",
  preferStandardMap = false,
): Promise<MapRender> {
  if (!hasGoogleMapsConfig) throw new Error("Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY.");
  const loader = new Loader({ apiKey: externalConfig.googleMapsApiKey!, version: "beta" });
  await loader.load();
  const maps = (window as MapWindow).google?.maps;
  if (!maps) throw new Error("Google Maps could not be loaded.");
  const initialCamera = mapCamera(focus, marketId, presentation);
  const market = getMarketConfig(marketId);

  // MOBILE PARITY: Singapore has a configured 3D Map ID on desktop, while compact touch views
  // intentionally use the responsive standard Google Maps surface used by the Manus mobile app.
  if (marketId === "singapore" && externalConfig.googleMapsMapId && maps.importLibrary && !preferStandardMap) {
    const { Map3DElement, Marker3DInteractiveElement, Polygon3DElement } = await maps.importLibrary("maps3d");
    const threeDimensionalMap = new Map3DElement({
      center: initialCamera.center,
      heading: initialCamera.heading,
      tilt: initialCamera.tilt,
      range: initialCamera.range,
      mapId: externalConfig.googleMapsMapId,
      // The home and regional lenses suppress road-label clutter; the expanded listing map retains HYBRID detail.
      mode: presentation === "listings" ? "HYBRID" : "SATELLITE",
    });
    const updateCamera = (nextFocus?: MapFocus) => {
      const next = mapCamera(nextFocus, marketId, presentation);
      // These properties update the existing custom element, avoiding a blank remount during a regional selection.
      threeDimensionalMap.center = next.center;
      threeDimensionalMap.range = next.range;
      threeDimensionalMap.tilt = next.tilt;
      threeDimensionalMap.heading = next.heading;
    };
    threeDimensionalMap.classList.add("live-map-canvas");
    threeDimensionalMap.style.display = "block";
    threeDimensionalMap.style.width = "100%";
    threeDimensionalMap.style.height = "100%";
    threeDimensionalMap.bounds = SINGAPORE_BOUNDS;
    threeDimensionalMap.maxAltitude = 52_000;
    const removeMapListeners = observe3DMapEvents(threeDimensionalMap, on3DFailure, on3DReady);
    createGeographicIslandOverlays(threeDimensionalMap, Polygon3DElement, presentation);
    createListingMarkers(threeDimensionalMap, Marker3DInteractiveElement, listings, onListingSelect);
    element.replaceChildren(threeDimensionalMap);
    return { mode: "3d", updateCamera, dispose: () => { removeMapListeners(); element.replaceChildren(); } };
  }

  const map = new maps.Map(element, {
    center: initialCamera.center,
    zoom: focus ? 14 : marketId === "singapore" ? presentation === "hero" ? 10 : presentation === "regions" ? 11 : 11 : market.zoom,
    mapId: marketId === "singapore" ? externalConfig.googleMapsMapId : undefined,
    restriction: marketId === "singapore" ? { latLngBounds: SINGAPORE_BOUNDS, strictBounds: true } : undefined,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    styles: marketId === "singapore" && presentation === "regions" ? [
      { featureType: "road", elementType: "all", stylers: [{ visibility: "off" }] },
      { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
      { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
      { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "off" }] },
    ] : undefined,
  });
  const updateCamera = (nextFocus?: MapFocus) => {
    const next = mapCamera(nextFocus, marketId, presentation);
    map.setCenter?.(next.center);
    map.setZoom?.(nextFocus ? 14 : marketId === "singapore" ? presentation === "hero" ? 10 : presentation === "regions" ? 11 : 11 : 12);
    map.setTilt?.(next.tilt);
    map.setHeading?.(next.heading);
  };
  updateCamera(focus);
  const markers = listings.map(listing => {
    const marker = new maps.Marker({ map, position: { lat: listing.latitude, lng: listing.longitude }, title: listing.title, label: markerLabel(listing) });
    marker.addListener?.("click", () => onListingSelect?.(listing.id));
    return marker;
  });
  if (!markers.length) new maps.Marker({ map, position: initialCamera.center, title: focus?.title ?? market.name });
  return { mode: "standard", updateCamera, dispose: () => { markers.forEach(marker => marker.setMap?.(null)); element.replaceChildren(); } };
}
