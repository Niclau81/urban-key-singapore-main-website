import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  createManagedProperty: vi.fn(),
  updateManagedProperty: vi.fn(),
  updateManagedPropertyStatus: vi.fn(),
  isManagedPropertyOwner: vi.fn(),
  listManagedProperties: vi.fn(),
  addManagedPropertyImage: vi.fn(),
  upsertManagedPropertyFloorPlan: vi.fn(),
  removeManagedPropertyFloorPlan: vi.fn(),
  createManagedTourCapture: vi.fn(),
  reviewManagedTourCapture: vi.fn(),
  approveManagedTourCapture: vi.fn(),
  storagePut: vi.fn(),
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return {
    ...actual,
    createManagedProperty: mocks.createManagedProperty,
    updateManagedProperty: mocks.updateManagedProperty,
    updateManagedPropertyStatus: mocks.updateManagedPropertyStatus,
    isManagedPropertyOwner: mocks.isManagedPropertyOwner,
    listManagedProperties: mocks.listManagedProperties,
    addManagedPropertyImage: mocks.addManagedPropertyImage,
    upsertManagedPropertyFloorPlan: mocks.upsertManagedPropertyFloorPlan,
    removeManagedPropertyFloorPlan: mocks.removeManagedPropertyFloorPlan,
    createManagedTourCapture: mocks.createManagedTourCapture,
    reviewManagedTourCapture: mocks.reviewManagedTourCapture,
    approveManagedTourCapture: mocks.approveManagedTourCapture,
  };
});

vi.mock("./storage", () => ({ storagePut: mocks.storagePut }));

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function authenticatedContext(userId = 7, role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `agent-${userId}`,
    email: `agent-${userId}@example.com`,
    name: "Sample Property Agent",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const listingInput = {
  marketId: "singapore" as const,
  title: "Tuas logistics facility",
  description: "A high-clearance logistics asset with direct container access.",
  address: "12 Pioneer Sector Walk",
  mrtName: "Joo Koon",
  mode: "Rent-Out" as const,
  district: "D22 · Jurong",
  propertyType: "Warehouse",
  price: 28_000,
  size: 18_500,
  mrtMinutes: 12,
  tenure: "30-year",
  commercialUsage: "Warehouse",
  floorLoading: 20,
  ceilingHeight: 11.5,
  loadingAccess: "40-ft container access",
  parkingLots: 8,
  availableFrom: "2026-09-01",
};

describe("agent and co-broker listing portal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a private draft for the authenticated agent with complete property details", async () => {
    const created = { id: 42, userId: 7, ...listingInput, status: "draft" as const, createdAt: new Date(), updatedAt: new Date() };
    mocks.createManagedProperty.mockResolvedValue(created);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.listing.create(listingInput)).resolves.toEqual(created);
    expect(mocks.createManagedProperty).toHaveBeenCalledWith(7, listingInput);
  });

  it("persists complete listing updates for the authenticated owner", async () => {
    mocks.updateManagedProperty.mockResolvedValue(true);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.listing.update({ id: 42, ...listingInput })).resolves.toEqual({ id: 42 });
    expect(mocks.updateManagedProperty).toHaveBeenCalledWith(7, 42, listingInput);
  });

  it("does not expose another account's listing through the update endpoint", async () => {
    mocks.updateManagedProperty.mockResolvedValue(false);
    const caller = appRouter.createCaller(authenticatedContext(8));

    await expect(caller.listing.update({ id: 42, ...listingInput })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("changes listing status only for the authenticated owner", async () => {
    mocks.updateManagedPropertyStatus.mockResolvedValue(true);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.listing.updateStatus({ id: 42, status: "active" })).resolves.toEqual({ id: 42, status: "active" });
    expect(mocks.updateManagedPropertyStatus).toHaveBeenCalledWith(7, 42, "active");
  });

  it("does not change another account's listing status", async () => {
    mocks.updateManagedPropertyStatus.mockResolvedValue(false);
    const caller = appRouter.createCaller(authenticatedContext(8));

    await expect(caller.listing.updateStatus({ id: 42, status: "paused" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects unsupported listing status values before persistence", async () => {
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.listing.updateStatus({ id: 42, status: "published" as "active" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.updateManagedPropertyStatus).not.toHaveBeenCalled();
  });

  it("blocks image uploads when the listing is not owned by the signed-in account", async () => {
    mocks.isManagedPropertyOwner.mockResolvedValue(false);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.listing.uploadImage({ id: 42, fileName: "warehouse.webp", mimeType: "image/webp", base64: Buffer.from("image").toString("base64") })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(mocks.storagePut).not.toHaveBeenCalled();
  });

  it("stores uploaded media and persists its deployment-safe metadata", async () => {
    mocks.isManagedPropertyOwner.mockResolvedValue(true);
    mocks.listManagedProperties.mockResolvedValue([{ id: 42, images: [] }]);
    mocks.storagePut.mockResolvedValue({ key: "property-listings/7/42/image.webp", url: "https://storage.example/image.webp" });
    mocks.addManagedPropertyImage.mockImplementation(async (userId, listingId, image) => ({ id: 13, userId, listingId, ...image, createdAt: new Date() }));
    const caller = appRouter.createCaller(authenticatedContext());
    const base64 = Buffer.from("valid-image-bytes").toString("base64");

    const result = await caller.listing.uploadImage({ id: 42, fileName: "warehouse.webp", mimeType: "image/webp", base64 });

    expect(mocks.storagePut).toHaveBeenCalledWith(expect.stringMatching(/^property-listings\/7\/42\/.+\.webp$/), Buffer.from("valid-image-bytes"), "image/webp");
    expect(mocks.addManagedPropertyImage).toHaveBeenCalledWith(7, 42, expect.objectContaining({
      storageKey: "property-listings/7/42/image.webp",
      url: "https://storage.example/image.webp",
      fileName: "warehouse.webp",
      mimeType: "image/webp",
      fileSize: 17,
      sortOrder: 0,
    }));
    expect(result).toMatchObject({ id: 13, listingId: 42, userId: 7, fileName: "warehouse.webp" });
  });

  it("blocks optional floor-plan uploads when the listing is not owned by the signed-in account", async () => {
    mocks.isManagedPropertyOwner.mockResolvedValue(false);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.listing.uploadFloorPlan({ id: 42, fileName: "plan.png", mimeType: "image/png", base64: Buffer.from("plan").toString("base64") })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(mocks.storagePut).not.toHaveBeenCalled();
    expect(mocks.upsertManagedPropertyFloorPlan).not.toHaveBeenCalled();
  });

  it("stores one replaceable optional floor plan with deployment-safe metadata", async () => {
    mocks.isManagedPropertyOwner.mockResolvedValue(true);
    mocks.storagePut.mockResolvedValue({ key: "property-listings/7/42/floor-plans/plan.png", url: "https://storage.example/plan.png" });
    mocks.upsertManagedPropertyFloorPlan.mockImplementation(async (userId, listingId, plan) => ({ id: 8, userId, listingId, ...plan, createdAt: new Date(), updatedAt: new Date() }));
    const caller = appRouter.createCaller(authenticatedContext());
    const result = await caller.listing.uploadFloorPlan({ id: 42, fileName: "plan.png", mimeType: "image/png", base64: Buffer.from("floor-plan-bytes").toString("base64") });

    expect(mocks.storagePut).toHaveBeenCalledWith(expect.stringMatching(/^property-listings\/7\/42\/floor-plans\/.+\.png$/), Buffer.from("floor-plan-bytes"), "image/png");
    expect(mocks.upsertManagedPropertyFloorPlan).toHaveBeenCalledWith(7, 42, expect.objectContaining({ storageKey: "property-listings/7/42/floor-plans/plan.png", url: "https://storage.example/plan.png", fileName: "plan.png", mimeType: "image/png", fileSize: 16 }));
    expect(result).toMatchObject({ id: 8, listingId: 42, userId: 7, fileName: "plan.png" });
  });

  it("removes an optional floor plan only from the authenticated owner’s listing", async () => {
    mocks.removeManagedPropertyFloorPlan.mockResolvedValue(true);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.listing.removeFloorPlan({ id: 42 })).resolves.toEqual({ id: 42 });
    expect(mocks.removeManagedPropertyFloorPlan).toHaveBeenCalledWith(7, 42);
  });

  it("blocks private 360 capture upload when the listing is not owned by the signed-in agent", async () => {
    mocks.isManagedPropertyOwner.mockResolvedValue(false);
    const caller = appRouter.createCaller(authenticatedContext());
    await expect(caller.listing.uploadTourCapture({ id: 42, fileName: "pano.jpg", mimeType: "image/jpeg", base64: Buffer.from("capture").toString("base64"), width: 4000, height: 2000, horizontalCoverage: 360, verticalCoverage: 180, floorLabel: "Main floor", roomLabel: "Living", listingAuthorizationConfirmed: true, captureConsentConfirmed: true })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(mocks.storagePut).not.toHaveBeenCalled();
  });

  it("stores valid equirectangular media privately with review gates instead of publishing it", async () => {
    mocks.isManagedPropertyOwner.mockResolvedValue(true);
    mocks.storagePut.mockResolvedValue({ key: "property-tour-captures/7/42/pano.jpg", url: "https://storage.example/pano.jpg" });
    mocks.createManagedTourCapture.mockImplementation(async (userId, listingId, capture) => ({ id: 77, userId, listingId, ...capture, qualityStatus: "quality_review", privacyReviewStatus: "review_required" }));
    const caller = appRouter.createCaller(authenticatedContext());
    const result = await caller.listing.uploadTourCapture({ id: 42, fileName: "living-pano.jpg", mimeType: "image/jpeg", base64: Buffer.from("valid-360-capture").toString("base64"), width: 4000, height: 2000, horizontalCoverage: 360, verticalCoverage: 180, floorLabel: "Main floor", roomLabel: "Living", listingAuthorizationConfirmed: true, captureConsentConfirmed: true });
    expect(mocks.storagePut).toHaveBeenCalledWith(expect.stringMatching(/^property-tour-captures\/7\/42\/.+\.jpg$/), Buffer.from("valid-360-capture"), "image/jpeg");
    expect(mocks.createManagedTourCapture).toHaveBeenCalledWith(7, 42, expect.objectContaining({ technicalReviewPassed: true, listingAuthorizationConfirmed: true, captureConsentConfirmed: true, aspectRatio: "2.00:1" }));
    expect(result).toMatchObject({ technicalReviewPassed: true, safeguardNotice: expect.stringContaining("does not publish") });
  });

  it("keeps nonconforming captures private and marks their technical baseline as failed", async () => {
    mocks.isManagedPropertyOwner.mockResolvedValue(true);
    mocks.storagePut.mockResolvedValue({ key: "property-tour-captures/7/42/flat.webp", url: "https://storage.example/flat.webp" });
    mocks.createManagedTourCapture.mockImplementation(async (_userId, _listingId, capture) => ({ id: 78, ...capture, qualityStatus: "quality_review", privacyReviewStatus: "review_required" }));
    const caller = appRouter.createCaller(authenticatedContext());
    const result = await caller.listing.uploadTourCapture({ id: 42, fileName: "flat.webp", mimeType: "image/webp", base64: Buffer.from("flat").toString("base64"), width: 1800, height: 1200, horizontalCoverage: 280, verticalCoverage: 120, floorLabel: "Main floor", roomLabel: "Entry", listingAuthorizationConfirmed: true, captureConsentConfirmed: true });
    expect(result.technicalReviewPassed).toBe(false);
    expect(mocks.createManagedTourCapture).toHaveBeenCalledWith(7, 42, expect.objectContaining({ technicalReviewPassed: false }));
  });

  it("records owner quality review and reserves final approval for an independent administrator", async () => {
    mocks.reviewManagedTourCapture.mockResolvedValue({ id: 77, qualityStatus: "approval_required" });
    const caller = appRouter.createCaller(authenticatedContext());
    await expect(caller.listing.reviewTourCapture({ captureId: 77, privacyReviewStatus: "cleared", manualPrivacyReviewed: true, listingAuthorizationConfirmed: true, captureConsentConfirmed: true, qualityNotes: "Personal materials redacted." })).resolves.toMatchObject({ qualityStatus: "approval_required" });
    await expect(caller.listing.approveTourCapture({ captureId: 77 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    mocks.approveManagedTourCapture.mockResolvedValue({ id: 77, qualityStatus: "approved" });
    const admin = appRouter.createCaller(authenticatedContext(9, "admin"));
    await expect(admin.listing.approveTourCapture({ captureId: 77 })).resolves.toMatchObject({ qualityStatus: "approved" });
    expect(mocks.approveManagedTourCapture).toHaveBeenCalledWith(9, 77);
  });
});
