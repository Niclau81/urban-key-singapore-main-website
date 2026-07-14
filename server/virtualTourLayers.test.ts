import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const componentSource = readFileSync(
  fileURLToPath(new URL("../client/src/components/VirtualTour.tsx", import.meta.url)),
  "utf8",
);

describe("virtual tour photo-backed timing selector", () => {
  it("maps the office example to distinct Morning, Noon, and Midnight photo assets", () => {
    expect(componentSource).toContain('id: "morning"');
    expect(componentSource).toContain('id: "noon"');
    expect(componentSource).toContain('id: "midnight"');
    expect(componentSource).toContain("office-interior-morning_19c37691.png");
    expect(componentSource).toContain("office-interior-noon_a72da44f.jpg");
    expect(componentSource).toContain("office-interior-midnight_8e9070ce.png");
  });

  it("renders the timing selector only when alternate photo files exist", () => {
    expect(componentSource).toContain("timingPhotos.length > 1");
    expect(componentSource).toContain('data-tour-control="photo-timing-select"');
    expect(componentSource).toContain("gallery.findIndex(image => getTimingPhotos(image).length > 1)");
    expect(componentSource).toContain('id: "as-photographed"');
    expect(componentSource).toContain("No alternate timing photos are available for this view");
  });

  it("switches the image source directly instead of compositing a lighting effect", () => {
    expect(componentSource).toContain("src={activeTiming.src}");
    expect(componentSource).toContain('data-tour-layer="timed-photograph"');
    expect(componentSource).toContain('data-tour-photo-source={activeTiming.src}');
    expect(componentSource).not.toContain('data-tour-layer="period-sky-underlay"');
    expect(componentSource).not.toContain('data-tour-layer="photographic-foreground"');
    expect(componentSource).not.toContain("maskImage:");
    expect(componentSource).not.toContain("sceneFilter");
  });

  it("identifies generated timing photos as an example simulation", () => {
    expect(componentSource).toContain('kind: "example-simulation"');
    expect(componentSource).toContain("Example time-specific photo");
    expect(componentSource).toContain('kind: "source"');
  });

  it("retains a text-only caption without a photo-covering gradient", () => {
    expect(componentSource).toContain('data-tour-layer="caption-content"');
    expect(componentSource).not.toContain("bg-gradient-to-t");
    expect(componentSource).not.toContain("from-[#071a17]/72");
    expect(componentSource).toContain('textShadow: "0 2px 7px rgb(3 16 13 / 88%)"');
  });
});
