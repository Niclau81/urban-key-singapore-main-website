/// <reference types="@types/google.maps" />

export const GOOGLE_MAPS_SCRIPT_SELECTOR =
  "script[data-urbankey-google-maps]";
export const GOOGLE_MAPS_SCRIPT_URL = "/api/maps/script";

type MapsWindow = {
  google?: typeof google;
};

type MapsDocument = Pick<Document, "querySelector" | "createElement"> & {
  head: Pick<HTMLHeadElement, "appendChild">;
};

export interface GoogleMapsLoaderOptions {
  windowRef?: MapsWindow;
  documentRef?: MapsDocument;
  scriptUrl?: string;
}

export function createGoogleMapsScriptLoader(
  defaults: GoogleMapsLoaderOptions = {},
) {
  let scriptPromise: Promise<void> | null = null;

  return function loadGoogleMapsScript(
    overrides: GoogleMapsLoaderOptions = {},
  ) {
    const windowRef =
      overrides.windowRef ?? defaults.windowRef ?? window;
    const documentRef =
      overrides.documentRef ?? defaults.documentRef ?? document;
    const scriptUrl =
      overrides.scriptUrl ?? defaults.scriptUrl ?? GOOGLE_MAPS_SCRIPT_URL;

    if (windowRef.google?.maps) return Promise.resolve();
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise<void>((resolve, reject) => {
      const rejectLoad = (script: HTMLScriptElement) => {
        scriptPromise = null;
        script.remove();
        reject(new Error("Google Maps script failed to load"));
      };

      const existing =
        documentRef.querySelector<HTMLScriptElement>(
          GOOGLE_MAPS_SCRIPT_SELECTOR,
        );
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => rejectLoad(existing), {
          once: true,
        });
        return;
      }

      const script = documentRef.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.dataset.urbankeyGoogleMaps = "true";
      script.onload = () => {
        if (windowRef.google?.maps) {
          resolve();
          return;
        }
        rejectLoad(script);
      };
      script.onerror = () => rejectLoad(script);
      documentRef.head.appendChild(script);
    });

    return scriptPromise;
  };
}

export const loadGoogleMapsScript = createGoogleMapsScriptLoader();
