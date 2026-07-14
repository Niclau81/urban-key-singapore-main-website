import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const componentSource = readFileSync(
  fileURLToPath(new URL("../client/src/components/VirtualTour.tsx", import.meta.url)),
  "utf8",
);

describe("virtual tour photographic layer order", () => {
  it("renders the period sky before the transparent foreground photograph", () => {
    const skyIndex = componentSource.indexOf('data-tour-layer="period-sky-underlay"');
    const foregroundIndex = componentSource.indexOf('data-tour-layer="photographic-foreground"');

    expect(skyIndex).toBeGreaterThan(-1);
    expect(foregroundIndex).toBeGreaterThan(skyIndex);
    expect(componentSource).toContain("maskImage: exteriorMask.foregroundMaskImage");
  });

  it("contains no filtered-photo or atmospheric-tint layer above the photograph", () => {
    expect(componentSource).not.toContain('data-tour-layer="photographic-exterior-pass"');
    expect(componentSource).not.toContain('data-tour-layer="exterior-atmosphere-tint"');
    expect(componentSource).not.toContain("period.exteriorFilter");
    expect(componentSource).not.toContain("period.exteriorTintOpacity");
    expect(componentSource).not.toContain("period.exteriorBlendMode");
  });

  it("contains no full-frame caption gradient above the foreground photograph", () => {
    expect(componentSource).not.toContain("absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t");
    expect(componentSource).not.toContain("from-[#071a17]/72");
    expect(componentSource).toContain('data-tour-layer="caption-content"');
    expect(componentSource).toContain('textShadow: "0 2px 7px rgb(3 16 13 / 88%)"');
  });
});
