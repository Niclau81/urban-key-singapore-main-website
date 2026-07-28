import { readFileSync } from "node:fs";
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
const headerSource = readFileSync(
  fileURLToPath(new URL("../client/src/components/BrandHeader.tsx", import.meta.url)),
  "utf8",
);
const mapComponentSource = readFileSync(
  fileURLToPath(new URL("../client/src/components/Map.tsx", import.meta.url)),
  "utf8",
);
const stylesSource = readFileSync(
  fileURLToPath(new URL("../client/src/index.css", import.meta.url)),
  "utf8",
);
const htmlSource = readFileSync(
  fileURLToPath(new URL("../client/index.html", import.meta.url)),
  "utf8",
);

describe("mobile viewport safeguards", () => {
  it("starts Map Intelligence panels hidden on phones until the user toggles them", () => {
    expect(mapSource).toContain("function isCompactMapViewport()");
    expect(mapSource).toContain("window.innerWidth < 768 || window.innerHeight < 480");
    expect(mapSource).toContain('mobilePanelsHidden ? "hidden md:block" : ""');
    expect(mapSource).toContain('mobilePanelsHidden ? "Show panels" : "Hide panels"');
    expect(mapSource).toContain('className="absolute right-[max(.75rem,env(safe-area-inset-right))]');
    expect(mapSource).toContain("md:hidden");
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

  it("uses dynamic viewport units and safe-area-aware chrome across the application", () => {
    expect(htmlSource).toContain("viewport-fit=cover");
    expect(stylesSource).toContain("--app-viewport-height: 100dvh");
    expect(stylesSource).toContain("--site-header-height");
    expect(stylesSource).toContain("overflow-x: clip");
    expect(stylesSource).toContain("@media (max-height: 480px) and (orientation: landscape)");
    expect(headerSource).toContain("pt-[env(safe-area-inset-top)]");
    expect(headerSource).toContain("h-[var(--site-header-content-height)]");
  });

  it("lets full-height map canvases and their fallback state honor the available device viewport", () => {
    expect(mapSource).toContain("h-[var(--app-viewport-height)]");
    expect(mapSource).toContain("h-[calc(var(--app-viewport-height)-var(--site-header-height))]");
    expect(mapSource).toContain("max-h-[calc(100%-5.5rem)]");
    expect(mapComponentSource).toContain('className ?? "h-[500px]"');
    expect(mapComponentSource).not.toContain('cn("h-[500px] w-full", className)');
  });
});
