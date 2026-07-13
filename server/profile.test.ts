import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return {
    ...actual,
    getProfile: mocks.getProfile,
  };
});

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function authenticatedContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "dashboard-user",
    email: "dashboard@example.com",
    name: "Dashboard User",
    loginMethod: "google",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("dashboard profile query", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null instead of undefined when the authenticated user has no profile row", async () => {
    mocks.getProfile.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.profile.get()).resolves.toBeNull();
    expect(mocks.getProfile).toHaveBeenCalledWith(1);
  });
});
