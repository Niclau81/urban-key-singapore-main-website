import { Loader } from "@googlemaps/js-api-loader";
import { externalConfig, hasGoogleMapsConfig } from "./config";

type MapWindow = Window & typeof globalThis & { google?: { maps?: { Map: new (element: HTMLElement, options: Record<string, unknown>) => unknown; Marker: new (options: Record<string, unknown>) => unknown } } };

export async function renderSingaporeMap(element: HTMLElement) {
  if (!hasGoogleMapsConfig) throw new Error("Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY.");
  const loader = new Loader({ apiKey: externalConfig.googleMapsApiKey!, version: "weekly" });
  await loader.load();
  const maps = (window as MapWindow).google?.maps;
  if (!maps) throw new Error("Google Maps could not be loaded.");
  const center = { lat: 1.29027, lng: 103.851959 };
  const map = new maps.Map(element, { center, zoom: 12, streetViewControl: false, mapTypeControl: false, fullscreenControl: true });
  new maps.Marker({ map, position: center, title: "Singapore" });
}
