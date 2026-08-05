import { describe, expect, it } from "vitest";
import { calculateSubscriptionPrice, getSubscriptionPlan, SUBSCRIPTION_PLANS } from "../shared/subscriptionPlans";
import { agentRegistrationSchema, subscriptionCheckoutSchema } from "./routers";

describe("subscription pricing", () => {
  it("defines all requested terms and discounts", () => {
    expect(SUBSCRIPTION_PLANS.map(plan => [plan.months, plan.discountPercent])).toEqual([
      [1, 0], [3, 5], [6, 10], [12, 20], [24, 25], [36, 30], [48, 35], [60, 40], [120, 50],
    ]);
  });

  it("calculates the SGD 120 monthly base, savings, and total server-side", () => {
    const annual = getSubscriptionPlan("1-year");
    expect(annual).toBeDefined();
    expect(calculateSubscriptionPrice(annual!)).toEqual({
      currency: "sgd",
      regularCents: 144_000,
      savingsCents: 28_800,
      payableCents: 115_200,
      effectiveMonthlyCents: 9_600,
    });

    const tenYears = getSubscriptionPlan("10-years");
    expect(calculateSubscriptionPrice(tenYears!).payableCents).toBe(720_000);
    expect(calculateSubscriptionPrice(tenYears!).savingsCents).toBe(720_000);
  });
});

describe("professional registration validation", () => {
  const valid = {
    accountType: "agent" as const,
    firstName: "Aisha",
    lastName: "Tan",
    contactNumber: "+65 9123 4567",
    email: "aisha@example.sg",
    companyName: "Harbour Property Pte Ltd",
    companyAddress: "8 Marina View",
    postalCode: "018960",
    agentLicenseNumber: "R012345A",
    website: "https://example.sg",
    termsAccepted: true as const,
  };

  it("accepts a complete professional profile", () => {
    expect(agentRegistrationSchema.parse(valid).email).toBe(valid.email);
  });

  it("requires explicit terms consent and a valid international postal or ZIP code", () => {
    expect(agentRegistrationSchema.safeParse({ ...valid, termsAccepted: false }).success).toBe(false);
    expect(agentRegistrationSchema.safeParse({ ...valid, postalCode: "!" }).success).toBe(false);
    expect(agentRegistrationSchema.safeParse({ ...valid, postalCode: "SW1A 1AA" }).success).toBe(true);
  });
});

describe("checkout input validation", () => {
  it("accepts card and PayNow but rejects arbitrary protocols", () => {
    expect(subscriptionCheckoutSchema.safeParse({ planId: "1-year", paymentMethod: "card", origin: "https://urbankey.example" }).success).toBe(true);
    expect(subscriptionCheckoutSchema.safeParse({ planId: "1-year", paymentMethod: "paynow", origin: "https://urbankey.example" }).success).toBe(true);
    expect(subscriptionCheckoutSchema.safeParse({ planId: "1-year", paymentMethod: "card", origin: "javascript:alert(1)" }).success).toBe(false);
  });
});
