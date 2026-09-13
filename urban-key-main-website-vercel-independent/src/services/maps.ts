import { Loader } from "@googlemaps/js-api-loader";
import { externalConfig, hasGoogleMapsConfig } from "./config";

type Map3DElement = HTMLElement;
type Maps3DLibrary = { Map3DElement: new (options: Record<string, unknown>) => Map3DElement };
type MapWindow = Window & typeof globalThis & { google?: { maps?: { Map: new (element: HTMLElement, options: Record<string, unknown>) => { setTilt?: (tilt: number) => void; setHeading?: (heading: number) => void }; Marker: new (options: Record<string, unknown>) => unknown; importLibrary?: (library: "maps3d") => Promise<Maps3DLibrary> } } };

export async function renderSingaporeMap(element: HTMLElement): Promise<"3d" | "standard"> {
  if (!hasGoogleMapsConfig) throw new Error("Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY.");
  const loader = new Loader({ apiKey: externalConfig.googleMapsApiKey!, version: "weekly" });
  await loader.load();
  const maps = (window as MapWindow).google?.maps;
  if (!maps) throw new Error("Google Maps could not be loaded.");
  const center = { lat: 1.29027, lng: 103.851959 };
  if (externalConfig.googleMapsMapId && maps.importLibrary) {
    const { Map3DElement } = await maps.importLibrary("maps3d");
    const threeDimensionalMap = new Map3DElement({
      center: { ...center, altitude: 180 },
      heading: 22,
      tilt: 67.5,
      range: 3600,
      mapId: externalConfig.googleMapsMapId,
      mode: "HYBRID",
    });
    element.replaceChildren(threeDimensionalMap);
    return "3d";
  }
  const map = new maps.Map(element, { center, zoom: 12, mapId: externalConfig.googleMapsMapId, streetViewControl: false, mapTypeControl: false, fullscreenControl: true });
  map.setTilt?.(45);
  map.setHeading?.(20);
  new maps.Marker({ map, position: center, title: "Singapore" });
  return "standard";
}
