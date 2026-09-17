import { Loader } from "@googlemaps/js-api-loader";
import { externalConfig, hasGoogleMapsConfig } from "./config";

type Map3DElement = HTMLElement;
type Maps3DLibrary = { Map3DElement: new (options: Record<string, unknown>) => Map3DElement };
type MapWindow = Window & typeof globalThis & { google?: { maps?: { Map: new (element: HTMLElement, options: Record<string, unknown>) => { setTilt?: (tilt: number) => void; setHeading?: (heading: number) => void }; Marker: new (options: Record<string, unknown>) => unknown; importLibrary?: (library: "maps3d") => Promise<Maps3DLibrary> } } };

function waitFor3DMapReady(map: Map3DElement): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      map.removeEventListener("gmp-steadychange", onSteady);
      map.removeEventListener("gmp-error", onError);
      map.removeEventListener("gmp-map-id-error", onMapIdError);
      window.clearTimeout(timeout);
    };
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const onSteady = (event: Event) => {
      const steady = (event as Event & { isSteady?: boolean; detail?: { isSteady?: boolean } }).isSteady
        ?? (event as Event & { detail?: { isSteady?: boolean } }).detail?.isSteady;
      if (steady) finish();
    };
    const onError = () => finish(new Error("Google Maps 3D could not initialise. The bundled Singapore map is shown instead."));
    const onMapIdError = () => finish(new Error("The configured Google Maps Map ID is not valid for 3D map rendering. The bundled Singapore map is shown instead."));
    const timeout = window.setTimeout(() => finish(new Error("Google Maps 3D did not become ready. Check the Map ID, API restrictions, and 3D Maps access.")), 15000);
    map.addEventListener("gmp-steadychange", onSteady);
    map.addEventListener("gmp-error", onError);
    map.addEventListener("gmp-map-id-error", onMapIdError);
  });
}

export async function renderSingaporeMap(element: HTMLElement): Promise<"3d" | "standard"> {
  if (!hasGoogleMapsConfig) throw new Error("Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY.");
  const loader = new Loader({ apiKey: externalConfig.googleMapsApiKey!, version: "beta" });
  await loader.load();
  const maps = (window as MapWindow).google?.maps;
  if (!maps) throw new Error("Google Maps could not be loaded.");
  // Central Business District / Marina Bay: a compact, built-up Singapore context
  // that is legible from the initial 3D camera instead of opening over open water.
  const center = { lat: 1.2834, lng: 103.8518 };
  if (externalConfig.googleMapsMapId && maps.importLibrary) {
    const { Map3DElement } = await maps.importLibrary("maps3d");
    const threeDimensionalMap = new Map3DElement({
      center: { ...center, altitude: 0 },
      heading: 350,
      tilt: 50,
      range: 2500,
      mapId: externalConfig.googleMapsMapId,
      mode: "HYBRID",
    });
    threeDimensionalMap.classList.add("live-map-canvas");
    threeDimensionalMap.style.display = "block";
    threeDimensionalMap.style.width = "100%";
    threeDimensionalMap.style.height = "100%";
    element.replaceChildren(threeDimensionalMap);
    await waitFor3DMapReady(threeDimensionalMap);
    return "3d";
  }
  const map = new maps.Map(element, { center, zoom: 12, mapId: externalConfig.googleMapsMapId, streetViewControl: false, mapTypeControl: false, fullscreenControl: true });
  map.setTilt?.(45);
  map.setHeading?.(20);
  new maps.Marker({ map, position: center, title: "Singapore" });
  return "standard";
}
