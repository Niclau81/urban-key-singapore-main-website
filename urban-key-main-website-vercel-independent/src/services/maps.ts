import { Loader } from "@googlemaps/js-api-loader";
import { externalConfig, hasGoogleMapsConfig } from "./config";
import { getMarketConfig, type MarketId } from "./market";

type Map3DElement = HTMLElement;
type Maps3DLibrary = { Map3DElement: new (options: Record<string, unknown>) => Map3DElement };
type MapWindow = Window & typeof globalThis & { google?: { maps?: { Map: new (element: HTMLElement, options: Record<string, unknown>) => { setTilt?: (tilt: number) => void; setHeading?: (heading: number) => void }; Marker: new (options: Record<string, unknown>) => unknown; importLibrary?: (library: "maps3d") => Promise<Maps3DLibrary> } } };
type MapRender = { mode: "3d" | "standard"; dispose: () => void };
export type MapFocus = { latitude: number; longitude: number; title: string };

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

export async function renderSingaporeMap(element: HTMLElement, on3DFailure?: (error: Error) => void, on3DReady?: () => void, focus?: MapFocus, marketId: MarketId = "singapore"): Promise<MapRender> {
  if (!hasGoogleMapsConfig) throw new Error("Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY.");
  const loader = new Loader({ apiKey: externalConfig.googleMapsApiKey!, version: "beta" });
  await loader.load();
  const maps = (window as MapWindow).google?.maps;
  if (!maps) throw new Error("Google Maps could not be loaded.");
  const market = getMarketConfig(marketId);
  // Central Business District / Marina Bay is legible from the opening 3D camera.
  const center = focus ? { lat: focus.latitude, lng: focus.longitude } : marketId === "singapore" ? { lat: 1.2834, lng: 103.8518 } : market.center;
  // The configured Map ID is a Singapore photorealistic 3D map. Other markets retain a live standard map
  // until a country-specific published Map ID and style are configured.
  if (marketId === "singapore" && externalConfig.googleMapsMapId && maps.importLibrary) {
    const { Map3DElement } = await maps.importLibrary("maps3d");
    const threeDimensionalMap = new Map3DElement({
      center: { ...center, altitude: 0 },
      heading: 350,
      tilt: 50,
      range: focus ? 1800 : 2500,
      mapId: externalConfig.googleMapsMapId,
      mode: "HYBRID",
    });
    threeDimensionalMap.classList.add("live-map-canvas");
    threeDimensionalMap.style.display = "block";
    threeDimensionalMap.style.width = "100%";
    threeDimensionalMap.style.height = "100%";
    const removeMapListeners = observe3DMapEvents(threeDimensionalMap, on3DFailure, on3DReady);
    element.replaceChildren(threeDimensionalMap);
    return { mode: "3d", dispose: () => { removeMapListeners(); element.replaceChildren(); } };
  }
  const map = new maps.Map(element, { center, zoom: focus ? 14 : market.zoom, mapId: marketId === "singapore" ? externalConfig.googleMapsMapId : undefined, streetViewControl: false, mapTypeControl: false, fullscreenControl: true });
  map.setTilt?.(45);
  map.setHeading?.(20);
  new maps.Marker({ map, position: center, title: focus?.title ?? market.name });
  return { mode: "standard", dispose: () => element.replaceChildren() };
}
