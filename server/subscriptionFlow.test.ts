import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  listSubscriptionOrders: vi.fn(),
  activateSubscriptionOrder: vi.fn(),
  markSubscriptionReceiptEmailed: vi.fn(),
  updateUserStripeCustomerId: vi.fn(),
  failSubscriptionOrder: vi.fn(),
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return {
    ...actual,
    listSubscriptionOrders: mocks.listSubscriptionOrders,
    activateSubscriptionOrder: mocks.activateSubscriptionOrder,
    markSubscriptionReceiptEmailed: mocks.markSubscriptionReceiptEmailed,
    updateUserStripeCustomerId: mocks.updateUserStripeCustomerId,
    failSubscriptionOrder: mocks.failSubscriptionOrder,
  };
});

import { appRouter } from "./routers";
import { handleSuccessfulCheckout, processStripeEvent } from "./stripe";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function context(userId: number | null): TrpcContext {
  const user: AuthenticatedUser | null = userId === null ? null : {
    id: userId,
    openId: `agent-${userId}`,
    email: `agent-${userId}@example.sg`,
    name: "Sample Property Agent",
    stripeCustomerId: null,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("subscription ownership and payment lifecycle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("scopes payment history to the authenticated account", async () => {
    const orders = [{ id: 3, userId: 27, status: "active" }];
    mocks.listSubscriptionOrders.mockResolvedValue(orders);

    await expect(appRouter.createCaller(context(27)).subscription.listOrders()).resolves.toEqual(orders);
    expect(mocks.listSubscriptionOrders).toHaveBeenCalledWith(27);
  });

  it("rejects payment-history access without authentication", async () => {
    await expect(appRouter.createCaller(context(null)).subscription.listOrders()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mocks.listSubscriptionOrders).not.toHaveBeenCalled();
  });

  it("activates a paid order, stores provider IDs, and records the Stripe-managed email receipt", async () => {
    mocks.activateSubscriptionOrder.mockResolvedValue({ userId: 27, status: "active" });
    const session = {
      id: "cs_paid_27",
      payment_status: "paid",
      payment_intent: "pi_paid_27",
      customer: "cus_27",
    } as Stripe.Checkout.Session;

    await handleSuccessfulCheckout(session);

    expect(mocks.activateSubscriptionOrder).toHaveBeenCalledWith("cs_paid_27", {
      stripePaymentIntentId: "pi_paid_27",
      stripeCustomerId: "cus_27",
    });
    expect(mocks.markSubscriptionReceiptEmailed).toHaveBeenCalledWith("cs_paid_27");
    expect(mocks.updateUserStripeCustomerId).toHaveBeenCalledWith(27, "cus_27");
  });

  it("does not activate or record a receipt before payment is confirmed", async () => {
    await handleSuccessfulCheckout({ id: "cs_unpaid", payment_status: "unpaid" } as Stripe.Checkout.Session);
    expect(mocks.activateSubscriptionOrder).not.toHaveBeenCalled();
    expect(mocks.markSubscriptionReceiptEmailed).not.toHaveBeenCalled();
  });

  it("moves an asynchronous PayNow checkout to failed when Stripe reports failure", async () => {
    await processStripeEvent({
      type: "checkout.session.async_payment_failed",
      data: { object: { id: "cs_paynow_failed" } },
    } as Stripe.Event);

    expect(mocks.failSubscriptionOrder).toHaveBeenCalledWith("cs_paynow_failed");
  });
});
