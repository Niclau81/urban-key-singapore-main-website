import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const mapSource = readFileSync(
  fileURLToPath(new URL("../client/src/pages/MapIntelligence.tsx", import.meta.url)),
  "utf8",
);

describe("3D map asset preview", () => {
  it("binds selection directly to each interactive marker element", () => {
    expect(mapSource).toContain("const selectAsset = () => {");
    expect(mapSource).toContain("setSelected(property);");
    expect(mapSource).toContain("markerEl.type = \"button\";");
    expect(mapSource).toContain('markerEl.addEventListener("click", selectAsset);');
    expect(mapSource).toContain('marker.addListener("click", selectAsset);');
  });

  it("keeps a selected asset preview visible independently of the mobile controls panel", () => {
    const previewMarkup = mapSource.slice(mapSource.indexOf('{selected && <aside id="map-property-preview"'));

    expect(previewMarkup).toContain('aria-live="polite"');
    expect(previewMarkup).toContain("selected.title");
    expect(previewMarkup).toContain("Close property preview");
    expect(previewMarkup).not.toContain('mobilePanelsHidden ? "hidden sm:block" : ""');
  });
});
