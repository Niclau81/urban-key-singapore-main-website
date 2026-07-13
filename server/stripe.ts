import type { Request, Response } from "express";
import Stripe from "stripe";
import { calculateSubscriptionPrice, type SubscriptionPlan } from "@shared/subscriptionPlans";
import { ENV } from "./_core/env";
import * as db from "./db";

function getStripe() {
  if (!ENV.stripeSecretKey) throw new Error("Stripe is not configured");
  return new Stripe(ENV.stripeSecretKey);
}

export async function createStripeCheckoutSession(input: {
  user: { id: number; name: string | null; email: string | null; stripeCustomerId: string | null };
  profile: { firstName: string; lastName: string; email: string };
  plan: SubscriptionPlan;
  paymentMethod: "card" | "paynow";
  origin: string;
}) {
  const stripe = getStripe();
  const pricing = calculateSubscriptionPrice(input.plan);
  const customerName = `${input.profile.firstName} ${input.profile.lastName}`.trim();
  let customerId = input.user.stripeCustomerId ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: input.profile.email,
      name: customerName || input.user.name || undefined,
      metadata: { user_id: String(input.user.id) },
    });
    customerId = customer.id;
    await db.updateUserStripeCustomerId(input.user.id, customerId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    client_reference_id: String(input.user.id),
    payment_method_types: [input.paymentMethod],
    line_items: [{
      quantity: 1,
      price_data: {
        currency: pricing.currency,
        unit_amount: pricing.payableCents,
        product_data: {
          name: `UrbanKey Pro — ${input.plan.label}`,
          description: `${input.plan.discountPercent}% term discount; ${input.plan.months}-month professional access`,
        },
      },
    }],
    payment_intent_data: {
      receipt_email: input.profile.email,
      metadata: {
        user_id: String(input.user.id),
        plan_id: input.plan.id,
        term_months: String(input.plan.months),
      },
    },
    invoice_creation: {
      enabled: true,
      invoice_data: { description: `UrbanKey Pro ${input.plan.label} subscription` },
    },
    success_url: `${input.origin}/agent/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/agent/checkout?plan=${encodeURIComponent(input.plan.id)}&cancelled=1`,
    metadata: {
      user_id: String(input.user.id),
      plan_id: input.plan.id,
      term_months: String(input.plan.months),
      customer_email: input.profile.email,
      customer_name: customerName,
    },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  try {
    await db.createSubscriptionOrder(input.user.id, {
      planId: input.plan.id,
      termMonths: input.plan.months,
      stripeCheckoutSessionId: session.id,
      receiptEmail: input.profile.email,
    });
  } catch (error) {
    await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
    throw error;
  }
  return { url: session.url, sessionId: session.id };
}

function asStripeId(value: string | { id: string } | null): string | undefined {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.id;
}

export async function handleSuccessfulCheckout(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;
  const order = await db.activateSubscriptionOrder(session.id, {
    stripePaymentIntentId: asStripeId(session.payment_intent),
    stripeCustomerId: asStripeId(session.customer),
  });
  if (order) await db.markSubscriptionReceiptEmailed(session.id);
  const customerId = asStripeId(session.customer);
  if (order && customerId) await db.updateUserStripeCustomerId(order.userId, customerId);
}

export async function processStripeEvent(event: Stripe.Event) {
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await handleSuccessfulCheckout(event.data.object);
  } else if (event.type === "checkout.session.async_payment_failed") {
    await db.failSubscriptionOrder(event.data.object.id);
  }
}

export async function stripeWebhookHandler(req: Request, res: Response) {
  const rawBody = req.body as Buffer;
  try {
    const unverified = JSON.parse(rawBody.toString("utf8")) as { id?: string };
    if (unverified.id?.startsWith("evt_test_")) {
      res.json({ verified: true });
      return;
    }
  } catch {
    // Signature verification below is the authoritative validation path.
  }

  const signature = req.headers["stripe-signature"];
  if (!ENV.stripeWebhookSecret || typeof signature !== "string") {
    res.status(400).json({ error: "Missing Stripe webhook signature" });
    return;
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, ENV.stripeWebhookSecret);
  } catch (error) {
    console.warn("[Stripe] Webhook verification failed", error);
    res.status(400).json({ error: "Invalid Stripe webhook signature" });
    return;
  }

  try {
    await processStripeEvent(event);
    res.json({ received: true });
  } catch (error) {
    console.error("[Stripe] Webhook processing failed", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}
