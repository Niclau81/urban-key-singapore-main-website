import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

import {
  createGoogleMapsScriptLoader,
  GOOGLE_MAPS_SCRIPT_URL,
  type GoogleMapsLoaderOptions,
} from "../client/src/lib/googleMapsLoader";
import { getMapsCredentialOrigins } from "./mapsProjectMetadata";
import { fetchMapsScript } from "./mapsScriptProxy";

type FakeScript = {
  src: string;
  async: boolean;
  crossOrigin: string | null;
  dataset: Record<string, string>;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  addEventListener: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
};

function createScript() {
  return {
    src: "",
    async: false,
    crossOrigin: null,
    dataset: {},
    onload: null,
    onerror: null,
    addEventListener: vi.fn(),
    remove: vi.fn(),
  } satisfies FakeScript;
}

function createDocument(scripts: FakeScript[]) {
  let index = 0;
  const appendChild = vi.fn();
  const documentRef = {
    querySelector: vi.fn(() => null),
    createElement: vi.fn(() => scripts[index++]!),
    head: { appendChild },
  } as unknown as NonNullable<GoogleMapsLoaderOptions["documentRef"]>;

  return { documentRef, appendChild };
}

describe("Google Maps frontend loader", () => {
  it("loads the managed Maps script through the same-origin application relay", async () => {
    const script = createScript();
    const { documentRef, appendChild } = createDocument([script]);
    const windowRef: NonNullable<GoogleMapsLoaderOptions["windowRef"]> = {};
    const load = createGoogleMapsScriptLoader({ documentRef, windowRef });

    const pending = load();

    expect(script.src).toBe(GOOGLE_MAPS_SCRIPT_URL);
    expect(script.crossOrigin).toBeNull();
    expect(script.dataset.urbankeyGoogleMaps).toBe("true");
    expect(appendChild).toHaveBeenCalledWith(script);

    windowRef.google = { maps: {} } as typeof google;
    script.onload?.();

    await expect(pending).resolves.toBeUndefined();
  });

  it("removes a failed script and permits a fresh retry", async () => {
    const firstScript = createScript();
    const retryScript = createScript();
    const { documentRef, appendChild } = createDocument([
      firstScript,
      retryScript,
    ]);
    const windowRef: NonNullable<GoogleMapsLoaderOptions["windowRef"]> = {};
    const load = createGoogleMapsScriptLoader({ documentRef, windowRef });

    const failedLoad = load();
    firstScript.onerror?.();
    await expect(failedLoad).rejects.toThrow(
      "Google Maps script failed to load",
    );
    expect(firstScript.remove).toHaveBeenCalledOnce();

    const recoveredLoad = load();
    expect(appendChild).toHaveBeenCalledTimes(2);
    expect(retryScript.src).toBe(GOOGLE_MAPS_SCRIPT_URL);

    windowRef.google = { maps: {} } as typeof google;
    retryScript.onload?.();
    await expect(recoveredLoad).resolves.toBeUndefined();
  });

  it("keeps a branded fallback with an in-page retry instead of reloading", () => {
    const componentPath = fileURLToPath(
      new URL("../client/src/components/Map.tsx", import.meta.url),
    );
    const source = readFileSync(componentPath, "utf8");

    expect(source).toContain("Google Maps is temporarily unavailable");
    expect(source).toContain("setRetryAttempt((attempt) => attempt + 1)");
    expect(source).not.toContain("window.location.reload()");
  });
});

describe("Google Maps server relay", () => {
  it("uses the request origin when the managed proxy accepts it", async () => {
    const fetchImpl = vi.fn(async (_input, init) => {
      expect((init?.headers as Record<string, string>).Origin).toBe(
        "https://urbankey.example",
      );
      return new Response("window.google = {}; google.maps = {};", {
        status: 200,
        headers: { "content-type": "text/javascript; charset=utf-8" },
      });
    }) as unknown as typeof fetch;

    const result = await fetchMapsScript(
      "https://urbankey.example",
      fetchImpl,
    );

    expect(result.body).toContain("google.maps");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("retries with the registered origin after an ephemeral preview origin is rejected", async () => {
    const attemptedOrigins: string[] = [];
    const fetchImpl = vi.fn(async (_input, init) => {
      const origin = (init?.headers as Record<string, string>).Origin;
      attemptedOrigins.push(origin);
      if (origin === "https://ephemeral-preview.example") {
        return new Response('{"error":"project origin not matched"}', {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response("window.google = {}; google.maps = {};", {
        status: 200,
        headers: { "content-type": "text/javascript; charset=utf-8" },
      });
    }) as unknown as typeof fetch;

    await expect(
      fetchMapsScript("https://ephemeral-preview.example", fetchImpl, [
        "https://registered-project.example",
      ]),
    ).resolves.toMatchObject({
      contentType: "text/javascript; charset=utf-8",
    });
    expect(attemptedOrigins).toHaveLength(2);
    expect(attemptedOrigins[0]).toBe("https://ephemeral-preview.example");
    expect(attemptedOrigins[1]).toBe("https://registered-project.example");
  });
});

describe("Google Maps project metadata", () => {
  it("uses normalized runtime origins when an override is configured", () => {
    expect(
      getMapsCredentialOrigins(
        "https://maps-origin.example/path, https://maps-origin.example,not-a-url",
      ),
    ).toEqual(["https://maps-origin.example"]);
  });

  it("retains provisioned project metadata when no override is supplied", () => {
    const origins = getMapsCredentialOrigins("");

    expect(origins).toHaveLength(1);
    expect(new URL(origins[0]!).protocol).toBe("https:");
  });
});
