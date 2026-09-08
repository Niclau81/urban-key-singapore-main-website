import { externalConfig, hasGoogleMapsConfig } from "./config";

type MapWindow = Window & typeof globalThis & {
  google?: {
    maps?: {
      Map: new (element: HTMLElement, options: Record<string, unknown>) => unknown;
      Marker: new (options: Record<string, unknown>) => unknown;
    };
  };
};

const CALLBACK_NAME = "__ukGoogleMapsLoaded";
let loaderPromise: Promise<void> | undefined;

function loadGoogleMaps(apiKey: string): Promise<void> {
  if ((window as MapWindow).google?.maps) return Promise.resolve();
  if (loaderPromise) return loaderPromise;

  const mapWindow = window as MapWindow & { [CALLBACK_NAME]?: () => void };
  loaderPromise = new Promise<void>((resolve, reject) => {
    const previousCallback = mapWindow[CALLBACK_NAME];
    mapWindow[CALLBACK_NAME] = () => {
      resolve();
      mapWindow[CALLBACK_NAME] = previousCallback;
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&callback=${CALLBACK_NAME}`;
    script.async = true;
    script.onerror = () => {
      loaderPromise = undefined;
      reject(new Error("Google Maps could not be loaded."));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}

export async function renderSingaporeMap(element: HTMLElement) {
  if (!hasGoogleMapsConfig) {
    throw new Error("Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY.");
  }
  await loadGoogleMaps(externalConfig.googleMapsApiKey!);
  const maps = (window as MapWindow).google?.maps;
  if (!maps) throw new Error("Google Maps could not be loaded.");
  const center = { lat: 1.29027, lng: 103.851959 };
  const map = new maps.Map(element, {
    center,
    zoom: 12,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
  });
  new maps.Marker({ map, position: center, title: "Singapore" });
}
