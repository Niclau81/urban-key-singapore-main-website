import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function publicContext(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("property intelligence procedures", () => {
  it("returns filtered Singapore listings", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.property.list({ district: "D01 · Marina Bay", maxMrtMinutes: 5 });
    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe("Marina Cove Residence");
  });

  it("applies size, tenure, and MRT walk-time filters together", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.property.list({ minSize: 2000, maxMrtMinutes: 3, tenure: "Freehold" });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "orchard-boulevard-19-02", tenure: "Freehold" });
  });

  it("never exposes a full owner identity", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.property.detail({ id: "marina-cove-28-08" });
    expect(Object.keys(result.property.owner).sort()).toEqual(["initials", "ownershipYears", "propertyCount"].sort());
    expect(result.disclaimer).toContain("independently verify");
  });

  it("keeps owner contact and identity fields out of serialized responses", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.property.detail({ id: "interlace-garden-06-12" });
    const serialized = JSON.stringify(result.property.owner).toLowerCase();
    expect(serialized).not.toContain("email");
    expect(serialized).not.toContain("phone");
    expect(serialized).not.toContain("name");
    expect(result.property.owner.initials).toMatch(/^[A-Z]\.[A-Z]\.$/);
  });

  it("protects user-managed property listing procedures", async () => {
    const caller = appRouter.createCaller(publicContext());
    await expect(caller.listing.listMine()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
