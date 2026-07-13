export const BASE_MONTHLY_PRICE_CENTS = 12_000;

export const SUBSCRIPTION_PLANS = [
  { id: "1-month", months: 1, discountPercent: 0, label: "1 month", group: "monthly" },
  { id: "3-months", months: 3, discountPercent: 5, label: "3 months", group: "short_term" },
  { id: "6-months", months: 6, discountPercent: 10, label: "6 months", group: "short_term" },
  { id: "1-year", months: 12, discountPercent: 20, label: "1 year", group: "annual" },
  { id: "2-years", months: 24, discountPercent: 25, label: "2 years", group: "multi_year" },
  { id: "3-years", months: 36, discountPercent: 30, label: "3 years", group: "multi_year" },
  { id: "4-years", months: 48, discountPercent: 35, label: "4 years", group: "multi_year" },
  { id: "5-years", months: 60, discountPercent: 40, label: "5 years", group: "multi_year" },
  { id: "10-years", months: 120, discountPercent: 50, label: "10 years", group: "multi_year" },
] as const;

export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];
export type SubscriptionPlanId = SubscriptionPlan["id"];

export function getSubscriptionPlan(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
}

export function calculateSubscriptionPrice(plan: SubscriptionPlan) {
  const regularCents = BASE_MONTHLY_PRICE_CENTS * plan.months;
  const savingsCents = Math.round(regularCents * (plan.discountPercent / 100));
  const payableCents = regularCents - savingsCents;
  const effectiveMonthlyCents = Math.round(payableCents / plan.months);

  return {
    currency: "sgd" as const,
    regularCents,
    savingsCents,
    payableCents,
    effectiveMonthlyCents,
  };
}

export function formatSgd(cents: number): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export const AUTOMATED_PAYMENT_METHODS = [
  {
    id: "card",
    label: "Credit or debit card",
    description: "Pay securely by Visa, Mastercard, or another supported card through Stripe Checkout.",
  },
  {
    id: "paynow",
    label: "PayNow / bank app",
    description: "Scan a PayNow QR code and approve payment in your participating Singapore bank app.",
  },
] as const;
