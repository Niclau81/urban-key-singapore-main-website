import { describe, expect, it } from "vitest";
import { properties } from "./data";
import { externalConfig, hasGoogleMaps3DConfig } from "./services/config";

describe("portable visual and map contracts", () => {
  it("keeps each illustrative property card bound to a deployable local image path", () => {
    expect(properties.length).toBeGreaterThan(0);
    for (const property of properties) {
      expect(property.image).toMatch(/^\/assets\/.+\.(jpg|jpeg|png|webp)$/i);
    }
  });

  it("keeps the Google Map ID as a separately configurable 3D-mode dependency", () => {
    expect(Object.keys(externalConfig)).toContain("googleMapsMapId");
    expect(typeof hasGoogleMaps3DConfig).toBe("boolean");
  });
});
