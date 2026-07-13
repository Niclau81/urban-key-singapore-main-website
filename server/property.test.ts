import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function publicContext(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("property intelligence procedures", () => {
  it("returns filtered Singapore listings", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.property.list({ district: "D01 · Marina Bay", propertyType: "Condominium", maxMrtMinutes: 5 });
    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe("Marina Cove Residence");
  });

  it("applies size, tenure, and MRT walk-time filters together", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.property.list({ propertyType: "Apartment", minSize: 2000, maxMrtMinutes: 3, tenure: "Freehold" });
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

  it("includes every requested commercial and industrial property category", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.property.list();
    const commercialTypes = new Set(result.filter(property => property.isCommercial).map(property => property.type));
    expect(commercialTypes).toEqual(new Set(["Office", "Shophouse", "Warehouse", "Office Building", "Factory Building"]));
  });

  it.each(["Buy", "Sell", "Rent", "Rent-Out"] as const)("filters %s listings as an exact transaction mode", async mode => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.property.list({ mode });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(property => property.mode === mode)).toBe(true);
    expect(result.some(property => property.isCommercial)).toBe(true);
  });

  it("filters industrial assets by category and operational capability", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.property.list({ propertyType: "Warehouse", minFloorLoading: 20, minCeilingHeight: 10 });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "changi-airfreight-warehouse", floorLoading: 20, ceilingHeight: 10.5 });
  });

  it("matches commercial usage text without including residential listings", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.property.list({ commercialUsage: "Factory" });
    expect(result).toHaveLength(2);
    expect(result.every(property => property.type === "Factory Building")).toBe(true);
  });
});
