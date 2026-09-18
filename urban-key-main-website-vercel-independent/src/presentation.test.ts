import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { properties } from "./data";
import { externalConfig, hasGoogleMaps3DConfig } from "./services/config";

describe("portable visual and map contracts", () => {
  it("keeps each illustrative property card bound to a deployable local image path", () => {
    expect(properties.length).toBeGreaterThan(0);
    for (const property of properties) {
      expect(property.image).toMatch(/^\/assets\/.+\.(jpg|jpeg|png|webp)$/i);
    }
  });

  it("uses the dedicated rectangular hero-media container rather than the legacy circular city-orb", () => {
    const appSource = readFileSync(new URL("./main.tsx", import.meta.url), "utf8");
    expect(appSource).toContain('className="hero-media city-photo"');
    expect(appSource).not.toContain('className="city-orb city-photo"');
  });

  it("keeps the Google Map ID as a separately configurable 3D-mode dependency", () => {
    expect(Object.keys(externalConfig)).toContain("googleMapsMapId");
    expect(typeof hasGoogleMaps3DConfig).toBe("boolean");
  });

  it("requires a dimensioned 3D map element, a visible steady-state preloader, and direct failure fallback", () => {
    const mapSource = readFileSync(new URL("./services/maps.ts", import.meta.url), "utf8");
    const workflowSource = readFileSync(new URL("./components/ExternalWorkflows.tsx", import.meta.url), "utf8");
    expect(mapSource).toContain('version: "beta"');
    expect(mapSource).toContain("const center = { lat: 1.2834, lng: 103.8518 }");
    expect(mapSource).toContain("range: 2500");
    expect(mapSource).toContain('threeDimensionalMap.classList.add("live-map-canvas")');
    expect(mapSource).toContain('threeDimensionalMap.style.width = "100%"');
    expect(mapSource).toContain('map.addEventListener("gmp-steadychange", onSteadyChange)');
    expect(mapSource).not.toContain("setTimeout");
    expect(mapSource).toContain('"gmp-map-id-error"');
    expect(mapSource).toContain('map.removeEventListener("gmp-error", onMapError)');
    expect(mapSource).toContain('dispose: () => { removeMapListeners(); element.replaceChildren(); }');
    expect(workflowSource).toContain('Preparing photorealistic 3D Singapore map');
    expect(workflowSource).toContain('Live photorealistic 3D Singapore map is ready.');
  });
});
