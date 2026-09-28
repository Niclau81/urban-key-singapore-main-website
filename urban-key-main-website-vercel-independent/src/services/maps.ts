import { Loader } from "@googlemaps/js-api-loader";
import { externalConfig, hasGoogleMapsConfig } from "./config";
import { getMarketConfig, type MarketId } from "./market";

type Map3DElement = HTMLElement;
type Marker3DInteractiveElement = HTMLElement;
type Maps3DLibrary = {
  Map3DElement: new (options: Record<string, unknown>) => Map3DElement;
  Marker3DInteractiveElement: new (options: Record<string, unknown>) => Marker3DInteractiveElement;
};
type StandardMarker = { setMap?: (map: unknown) => void; addListener?: (event: string, handler: () => void) => void };
type MapWindow = Window & typeof globalThis & {
  google?: {
    maps?: {
      Map: new (element: HTMLElement, options: Record<string, unknown>) => { setTilt?: (tilt: number) => void; setHeading?: (heading: number) => void };
      Marker: new (options: Record<string, unknown>) => StandardMarker;
      importLibrary?: (library: "maps3d") => Promise<Maps3DLibrary>;
    };
  };
};
type MapRender = { mode: "3d" | "standard"; dispose: () => void };

export type MapFocus = { latitude: number; longitude: number; title: string };
export type MapListing = MapFocus & { id: string; label: string; commercial?: boolean };

type ListingMarkerOptions = {
  position: { lat: number; lng: number; altitude: number };
  altitudeMode: "RELATIVE_TO_MESH";
  extruded: true;
  label: string;
  title: string;
};

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
  return listing.label.length > 22 ? `${listing.label.slice(0, 21)}…` : listing.label;
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

export async function renderSingaporeMap(
  element: HTMLElement,
  on3DFailure?: (error: Error) => void,
  on3DReady?: () => void,
  focus?: MapFocus,
  marketId: MarketId = "singapore",
  listings: MapListing[] = [],
  onListingSelect?: (listingId: string) => void,
): Promise<MapRender> {
  if (!hasGoogleMapsConfig) throw new Error("Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY.");
  const loader = new Loader({ apiKey: externalConfig.googleMapsApiKey!, version: "beta" });
  await loader.load();
  const maps = (window as MapWindow).google?.maps;
  if (!maps) throw new Error("Google Maps could not be loaded.");
  const market = getMarketConfig(marketId);
  // Central Business District / Marina Bay remains legible while the wider opening range exposes the catalog markers.
  const center = focus ? { lat: focus.latitude, lng: focus.longitude } : marketId === "singapore" ? { lat: 1.2931, lng: 103.8364 } : market.center;
  // The Singapore Map ID is published for Photorealistic 3D Maps. Other markets retain a standard live map until a local Map ID is published.
  if (marketId === "singapore" && externalConfig.googleMapsMapId && maps.importLibrary) {
    const { Map3DElement, Marker3DInteractiveElement } = await maps.importLibrary("maps3d");
    const threeDimensionalMap = new Map3DElement({
      center: { ...center, altitude: 0 },
      heading: focus ? 344 : 336,
      tilt: focus ? 60 : 58,
      range: focus ? 1800 : 4400,
      mapId: externalConfig.googleMapsMapId,
      mode: "HYBRID",
    });
    threeDimensionalMap.classList.add("live-map-canvas");
    threeDimensionalMap.style.display = "block";
    threeDimensionalMap.style.width = "100%";
    threeDimensionalMap.style.height = "100%";
    const removeMapListeners = observe3DMapEvents(threeDimensionalMap, on3DFailure, on3DReady);
    createListingMarkers(threeDimensionalMap, Marker3DInteractiveElement, listings, onListingSelect);
    element.replaceChildren(threeDimensionalMap);
    return { mode: "3d", dispose: () => { removeMapListeners(); element.replaceChildren(); } };
  }

  const map = new maps.Map(element, {
    center,
    zoom: focus ? 14 : market.zoom,
    mapId: marketId === "singapore" ? externalConfig.googleMapsMapId : undefined,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
  });
  map.setTilt?.(45);
  map.setHeading?.(20);
  const markers = listings.map(listing => {
    const marker = new maps.Marker({ map, position: { lat: listing.latitude, lng: listing.longitude }, title: listing.title, label: listing.label.slice(0, 1) });
    marker.addListener?.("click", () => onListingSelect?.(listing.id));
    return marker;
  });
  if (!markers.length) new maps.Marker({ map, position: center, title: focus?.title ?? market.name });
  return { mode: "standard", dispose: () => { markers.forEach(marker => marker.setMap?.(null)); element.replaceChildren(); } };
}
