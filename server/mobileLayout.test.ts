import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const mapSource = readFileSync(
  fileURLToPath(new URL("../client/src/pages/MapIntelligence.tsx", import.meta.url)),
  "utf8",
);
const propertyDetailSource = readFileSync(
  fileURLToPath(new URL("../client/src/pages/PropertyDetail.tsx", import.meta.url)),
  "utf8",
);
const buildingViewerSource = readFileSync(
  fileURLToPath(new URL("../client/src/components/BuildingViewer.tsx", import.meta.url)),
  "utf8",
);
const virtualTourSource = readFileSync(
  fileURLToPath(new URL("../client/src/components/VirtualTour.tsx", import.meta.url)),
  "utf8",
);

describe("mobile viewport safeguards", () => {
  it("starts Map Intelligence panels hidden on phones until the user toggles them", () => {
    expect(mapSource).toContain('useState(() => typeof window !== "undefined" && window.innerWidth < 640)');
    expect(mapSource).toContain('mobilePanelsHidden ? "hidden sm:block" : ""');
    expect(mapSource).toContain('mobilePanelsHidden ? "Show panels" : "Hide panels"');
  });

  it("constrains major property media to phone-safe viewport heights", () => {
    expect(propertyDetailSource).toContain("h-[clamp(240px,54svh,360px)]");
    expect(propertyDetailSource).toContain("sm:min-h-[440px]");
    expect(buildingViewerSource).toContain("h-[clamp(260px,50svh,340px)]");
    expect(buildingViewerSource).toContain("sm:h-[460px]");
    expect(virtualTourSource).toContain("h-[clamp(260px,54svh,360px)]");
    expect(virtualTourSource).toContain("sm:h-[520px]");
  });

  it("preserves phone-sized touch targets and concise model guidance", () => {
    expect(buildingViewerSource).toContain("min-h-11");
    expect(buildingViewerSource).toContain("Tap to enable 3D controls");
    expect(virtualTourSource).toContain("size-11");
  });
});
