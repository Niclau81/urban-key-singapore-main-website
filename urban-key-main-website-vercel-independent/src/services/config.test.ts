import { describe, expect, it } from "vitest";
import { externalConfig, integrationStatus } from "./config";

describe("independent external service configuration", () => {
  it("never embeds a server-side service role credential in the browser configuration", () => {
    expect(Object.keys(externalConfig)).not.toContain("supabaseServiceRoleKey");
  });

  it("exposes explicit configuration states for each external service", () => {
    expect(["ready", "configuration required"]).toContain(integrationStatus.auth);
    expect(["3d ready", "standard map ready", "configuration required"]).toContain(integrationStatus.maps);
  });
});
