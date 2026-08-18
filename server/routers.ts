import { COOKIE_NAME } from "@shared/const";
import { defaultMarketId, getMarketConfig, marketIds } from "@shared/marketConfig";
import { propertyAgentCaseStatuses, propertyAgentSafeguardNotice, singaporeJourneyIds } from "@shared/propertyAgent";
import { properties, propertyHistoryDisclaimer } from "@shared/propertyData";
import { AUTOMATED_PAYMENT_METHODS, calculateSubscriptionPrice, getSubscriptionPlan, SUBSCRIPTION_PLANS } from "@shared/subscriptionPlans";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";
import { createStripeCheckoutSession } from "./stripe";

const messageSchema = z.object({ role: z.enum(["system", "user", "assistant"]), content: z.string().min(1).max(5000) });
const listingInputSchema = z.object({
  marketId: z.enum(marketIds),
  title: z.string().trim().min(4).max(180),
  description: z.string().trim().max(4000).optional(),
  address: z.string().trim().max(240).optional(),
  mrtName: z.string().trim().max(120).optional(),
  mode: z.enum(["Sell", "Rent-Out"]),
  district: z.string().min(2).max(80),
  propertyType: z.string().min(2).max(80),
  price: z.number().int().positive(),
  size: z.number().int().positive(),
  mrtMinutes: z.number().int().min(0).max(60),
  tenure: z.string().min(2).max(60),
  commercialUsage: z.string().trim().min(2).max(160).optional(),
  floorLoading: z.number().positive().max(100).optional(),
  ceilingHeight: z.number().positive().max(30).optional(),
  loadingAccess: z.string().trim().min(2).max(180).optional(),
  parkingLots: z.number().int().min(0).max(10000).optional(),
  availableFrom: z.string().max(24).optional(),
});

const propertyAgentCaseInputSchema = z.object({
  journey: z.enum(singaporeJourneyIds),
  title: z.string().trim().min(4).max(180),
  propertyId: z.string().trim().max(96).optional(),
  processingConsent: z.boolean(),
});

const propertyAgentCaseIdSchema = z.object({ caseId: z.number().int().positive() });

async function requireConsentedPropertyAgentCase(userId: number, caseId: number) {
  const workflow = await db.getPropertyAgentCase(userId, caseId);
  if (!workflow) throw new TRPCError({ code: "NOT_FOUND", message: "Property Agent case not found" });
  if (!workflow.case.processingConsent) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Record customer consent before preparing, storing, or coordinating this case" });
  return workflow;
}

export const agentRegistrationSchema = z.object({
  accountType: z.enum(["agent", "co_broker"]),
  firstName: z.string().trim().min(1).max(100),
  middleName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().min(1).max(100),
  contactNumber: z.string().trim().min(8).max(32),
  email: z.string().trim().email().max(320),
  companyName: z.string().trim().min(2).max(180),
  companyAddress: z.string().trim().min(5).max(320),
  postalCode: z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9 -]{1,15}$/, "Enter a valid postal or ZIP code").optional(),
  agentLicenseNumber: z.string().trim().min(3).max(80),
  jobTitle: z.string().trim().max(120).optional(),
  businessRegistrationNumber: z.string().trim().max(80).optional(),
  website: z.string().trim().url().max(320).optional().or(z.literal("")),
  termsAccepted: z.literal(true),
});

export const subscriptionCheckoutSchema = z.object({
  planId: z.string().min(1),
  paymentMethod: z.enum(["card", "paynow"]),
  origin: z.string().url().refine(value => ["http:", "https:"].includes(new URL(value).protocol), "Invalid checkout origin"),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  property: router({
    list: publicProcedure.input(z.object({
      marketId: z.enum(marketIds).optional(),
      mode: z.enum(["Buy", "Sell", "Rent", "Rent-Out"]).optional(),
      district: z.string().optional(),
      propertyType: z.string().optional(),
      maxPrice: z.number().optional(),
      minSize: z.number().optional(),
      maxMrtMinutes: z.number().optional(),
      tenure: z.string().optional(),
      commercialUsage: z.string().optional(),
      minFloorLoading: z.number().optional(),
      minCeilingHeight: z.number().optional(),
      search: z.string().optional(),
    }).optional()).query(({ input }) => properties.filter(property => {
      if (!input) return true;
      const price = property.mode === "Rent" || property.mode === "Rent-Out" ? property.monthlyRent ?? property.price : property.price;
      const haystack = `${property.title} ${property.address} ${property.district} ${property.type} ${property.mrt} ${property.commercialUsage ?? ""}`.toLowerCase();
      return (!input.marketId || input.marketId === property.marketId)
        && (!input.mode || input.mode === property.mode)
        && (!input.district || input.district.startsWith("All ") || property.district === input.district)
        && (!input.propertyType || input.propertyType === "All types" || property.type === input.propertyType)
        && (!input.maxPrice || price <= input.maxPrice)
        && (!input.minSize || property.size >= input.minSize)
        && (!input.maxMrtMinutes || property.mrtMinutes <= input.maxMrtMinutes)
        && (!input.tenure || input.tenure === "Any tenure" || property.tenure === input.tenure)
        && (!input.commercialUsage || input.commercialUsage === "Any usage" || property.commercialUsage?.toLowerCase().includes(input.commercialUsage.toLowerCase()))
        && (!input.minFloorLoading || (property.floorLoading ?? 0) >= input.minFloorLoading)
        && (!input.minCeilingHeight || (property.ceilingHeight ?? 0) >= input.minCeilingHeight)
        && (!input.search || haystack.includes(input.search.toLowerCase()));
    })),
    detail: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => {
      const property = properties.find(item => item.id === input.id);
      if (!property) throw new Error("Property not found");
      return { property, disclaimer: propertyHistoryDisclaimer };
    }),
  }),
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => (await db.getProfile(ctx.user.id)) ?? null),
    save: protectedProcedure.input(z.object({
      persona: z.enum(["buyer_tenant", "seller_landlord", "agent_co_broker"]),
      preferredDistricts: z.string().max(500).optional(),
      budget: z.number().int().positive().optional(),
    })).mutation(({ ctx, input }) => db.saveProfile(ctx.user.id, input)),
  }),
  agent: router({
    getProfile: protectedProcedure.query(({ ctx }) => db.getAgentProfile(ctx.user.id)),
    register: protectedProcedure.input(agentRegistrationSchema).mutation(({ ctx, input }) => {
      const { termsAccepted: _termsAccepted, website, ...profile } = input;
      return db.upsertAgentProfile(ctx.user.id, {
        ...profile,
        website: website || undefined,
        termsAcceptedAt: new Date(),
      });
    }),
  }),
  subscription: router({
    getPlans: publicProcedure.query(() => ({
      plans: SUBSCRIPTION_PLANS.map(plan => ({ ...plan, ...calculateSubscriptionPrice(plan) })),
      paymentMethods: AUTOMATED_PAYMENT_METHODS,
    })),
    createCheckout: protectedProcedure.input(subscriptionCheckoutSchema).mutation(async ({ ctx, input }) => {
      const requestOrigin = ctx.req.headers.origin;
      if (requestOrigin && new URL(input.origin).origin !== requestOrigin) throw new TRPCError({ code: "FORBIDDEN", message: "Checkout origin does not match this browser session" });
      const profile = await db.getAgentProfile(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete your professional profile before subscribing" });
      const plan = getSubscriptionPlan(input.planId);
      if (!plan) throw new TRPCError({ code: "BAD_REQUEST", message: "Subscription plan not found" });
      try {
        return await createStripeCheckoutSession({ user: ctx.user, profile, plan, paymentMethod: input.paymentMethod, origin: input.origin });
      } catch (error) {
        console.error("[Stripe] Checkout creation failed", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to start secure checkout. Please try again." });
      }
    }),
    listOrders: protectedProcedure.query(({ ctx }) => db.listSubscriptionOrders(ctx.user.id)),
  }),
  saved: router({
    list: protectedProcedure.query(({ ctx }) => db.listSaved(ctx.user.id)),
    toggle: protectedProcedure.input(z.object({ propertyId: z.string() })).mutation(({ ctx, input }) => db.toggleSaved(ctx.user.id, input.propertyId)),
  }),
  enquiry: router({
    list: protectedProcedure.query(({ ctx }) => db.listEnquiries(ctx.user.id)),
    create: protectedProcedure.input(z.object({ propertyId: z.string(), message: z.string().min(10).max(2000) })).mutation(({ ctx, input }) => db.createEnquiry(ctx.user.id, input.propertyId, input.message)),
  }),
  propertyAgent: router({
    safeguardNotice: publicProcedure.query(() => propertyAgentSafeguardNotice),
    listCases: protectedProcedure.query(({ ctx }) => db.listPropertyAgentCases(ctx.user.id)),
    getCase: protectedProcedure.input(propertyAgentCaseIdSchema).query(async ({ ctx, input }) => {
      const workflow = await db.getPropertyAgentCase(ctx.user.id, input.caseId);
      if (!workflow) throw new TRPCError({ code: "NOT_FOUND", message: "Property Agent case not found" });
      return workflow;
    }),
    createCase: protectedProcedure.input(propertyAgentCaseInputSchema).mutation(async ({ ctx, input }) => {
      const workflow = await db.createPropertyAgentCase(ctx.user.id, input);
      if (!workflow) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to create the Property Agent case" });
      return workflow;
    }),
    recordConsent: protectedProcedure.input(propertyAgentCaseIdSchema).mutation(async ({ ctx, input }) => {
      if (!await db.recordPropertyAgentConsent(ctx.user.id, input.caseId)) throw new TRPCError({ code: "NOT_FOUND", message: "Property Agent case not found" });
      return { caseId: input.caseId, processingConsent: true };
    }),
    updateCaseStatus: protectedProcedure.input(propertyAgentCaseIdSchema.extend({ status: z.enum(propertyAgentCaseStatuses) })).mutation(async ({ ctx, input }) => {
      await requireConsentedPropertyAgentCase(ctx.user.id, input.caseId);
      if (!await db.updatePropertyAgentCaseStatus(ctx.user.id, input.caseId, input.status)) throw new TRPCError({ code: "NOT_FOUND", message: "Property Agent case not found" });
      return input;
    }),
    updateTask: protectedProcedure.input(propertyAgentCaseIdSchema.extend({ taskId: z.number().int().positive(), status: z.enum(["pending", "in_progress", "waiting_customer", "waiting_professional", "completed", "blocked"]), authorize: z.boolean().optional() })).mutation(async ({ ctx, input }) => {
      await requireConsentedPropertyAgentCase(ctx.user.id, input.caseId);
      if (!await db.updatePropertyAgentTask(ctx.user.id, input.caseId, input.taskId, input.status, input.authorize)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This task requires a case record and, where applicable, explicit customer authorisation before completion" });
      return input;
    }),
    updateDocumentStatus: protectedProcedure.input(propertyAgentCaseIdSchema.extend({ documentId: z.number().int().positive(), status: z.enum(["requested", "uploaded", "prepared", "review_required", "ready_for_handoff", "handed_to_professional"]) })).mutation(async ({ ctx, input }) => {
      await requireConsentedPropertyAgentCase(ctx.user.id, input.caseId);
      if (!await db.updatePropertyAgentDocumentStatus(ctx.user.id, input.caseId, input.documentId, input.status)) throw new TRPCError({ code: "NOT_FOUND", message: "Document checklist item not found" });
      return input;
    }),
    uploadDocument: protectedProcedure.input(propertyAgentCaseIdSchema.extend({
      documentId: z.number().int().positive(),
      fileName: z.string().min(1).max(255),
      mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
      base64: z.string().min(1).max(11_500_000),
    })).mutation(async ({ ctx, input }) => {
      await requireConsentedPropertyAgentCase(ctx.user.id, input.caseId);
      const data = Buffer.from(input.base64, "base64");
      if (!data.length || data.length > 8 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "Each workflow document must be smaller than 8 MB" });
      const extension = input.mimeType === "application/pdf" ? "pdf" : input.mimeType === "image/png" ? "png" : "jpg";
      const stored = await storagePut(`property-agent/${ctx.user.id}/${input.caseId}/documents/${input.documentId}/${randomUUID()}.${extension}`, data, input.mimeType);
      if (!await db.attachPropertyAgentDocument(ctx.user.id, input.caseId, input.documentId, { storageKey: stored.key, url: stored.url, fileName: input.fileName, mimeType: input.mimeType, fileSize: data.length })) throw new TRPCError({ code: "NOT_FOUND", message: "Document checklist item not found" });
      return { documentId: input.documentId, fileName: input.fileName };
    }),
    createAppointment: protectedProcedure.input(propertyAgentCaseIdSchema.extend({ kind: z.enum(["viewing", "owner_contact", "lawyer_review", "completion", "other"]), counterparty: z.string().trim().min(2).max(180), preferredAt: z.date().optional(), notes: z.string().trim().max(2000).optional() })).mutation(async ({ ctx, input }) => {
      await requireConsentedPropertyAgentCase(ctx.user.id, input.caseId);
      const appointment = await db.createPropertyAgentAppointment(ctx.user.id, input.caseId, input);
      if (!appointment) throw new TRPCError({ code: "NOT_FOUND", message: "Property Agent case not found" });
      return appointment;
    }),
    authorizeAppointment: protectedProcedure.input(propertyAgentCaseIdSchema.extend({ appointmentId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await requireConsentedPropertyAgentCase(ctx.user.id, input.caseId);
      if (!await db.authorizePropertyAgentAppointment(ctx.user.id, input.caseId, input.appointmentId)) throw new TRPCError({ code: "NOT_FOUND", message: "Appointment request not found" });
      return input;
    }),
    createCommunication: protectedProcedure.input(propertyAgentCaseIdSchema.extend({ channel: z.enum(["email", "whatsapp"]), recipient: z.string().trim().min(3).max(320), subject: z.string().trim().max(240).optional(), message: z.string().trim().min(10).max(5000) })).mutation(async ({ ctx, input }) => {
      await requireConsentedPropertyAgentCase(ctx.user.id, input.caseId);
      const communication = await db.createPropertyAgentCommunication(ctx.user.id, input.caseId, input);
      if (!communication) throw new TRPCError({ code: "NOT_FOUND", message: "Property Agent case not found" });
      return communication;
    }),
    authorizeCommunication: protectedProcedure.input(propertyAgentCaseIdSchema.extend({ communicationId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await requireConsentedPropertyAgentCase(ctx.user.id, input.caseId);
      if (!await db.authorizePropertyAgentCommunication(ctx.user.id, input.caseId, input.communicationId)) throw new TRPCError({ code: "NOT_FOUND", message: "Communication draft not found" });
      return { ...input, status: "connection_required" as const };
    }),
    authorizeHandOff: protectedProcedure.input(propertyAgentCaseIdSchema.extend({ handOffId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await requireConsentedPropertyAgentCase(ctx.user.id, input.caseId);
      if (!await db.authorizePropertyAgentHandOff(ctx.user.id, input.caseId, input.handOffId)) throw new TRPCError({ code: "NOT_FOUND", message: "Professional or agency hand-off not found" });
      return input;
    }),
    draft: protectedProcedure.input(propertyAgentCaseIdSchema.extend({ purpose: z.enum(["property_enquiry", "viewing_request", "document_request", "lawyer_handoff"]), notes: z.string().trim().min(4).max(2500) })).mutation(async ({ ctx, input }) => {
      const workflow = await requireConsentedPropertyAgentCase(ctx.user.id, input.caseId);
      const response = await invokeLLM({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: "You prepare concise editable Singapore property-workflow drafts. Do not give legal, tax, financial, eligibility, licensing, or regulatory advice. Do not make an offer, accept terms, promise an outcome, request payment, claim that a document is complete, or imply an external message has been sent. Label the draft as requiring customer authorisation and, where applicable, professional review. Keep it factual, neutral, and under 250 words." },
          { role: "user", content: `Prepare a ${input.purpose.replaceAll("_", " ")} draft for a ${workflow.case.journey} case titled “${workflow.case.title}”. Customer notes: ${input.notes}` },
        ],
        maxTokens: 600,
      });
      const content = response.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to prepare a workflow draft" });
      return { content, safeguardNotice: propertyAgentSafeguardNotice };
    }),
  }),
  listing: router({
    listMine: protectedProcedure.input(z.object({ marketId: z.enum(marketIds) }).optional()).query(({ ctx, input }) => db.listManagedProperties(ctx.user.id, input?.marketId)),
    create: protectedProcedure.input(listingInputSchema).mutation(({ ctx, input }) => db.createManagedProperty(ctx.user.id, input)),
    update: protectedProcedure.input(listingInputSchema.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const { id, ...listing } = input;
      const updated = await db.updateManagedProperty(ctx.user.id, id, listing);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found or unavailable to this account" });
      return { id };
    }),
    updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["draft", "active", "paused"]) })).mutation(async ({ ctx, input }) => {
      const updated = await db.updateManagedPropertyStatus(ctx.user.id, input.id, input.status);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found or unavailable to this account" });
      return input;
    }),
    uploadImage: protectedProcedure.input(z.object({
      id: z.number().int().positive(),
      fileName: z.string().min(1).max(255),
      mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
      base64: z.string().min(1).max(8_500_000),
    })).mutation(async ({ ctx, input }) => {
      if (!await db.isManagedPropertyOwner(ctx.user.id, input.id)) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found or unavailable to this account" });
      const data = Buffer.from(input.base64, "base64");
      if (!data.length || data.length > 6 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "Each image must be smaller than 6 MB" });
      const existing = await db.listManagedProperties(ctx.user.id);
      const listing = existing.find(item => item.id === input.id);
      if ((listing?.images.length ?? 0) >= 6) throw new TRPCError({ code: "BAD_REQUEST", message: "Each listing supports up to 6 images" });
      const extension = input.mimeType === "image/png" ? "png" : input.mimeType === "image/webp" ? "webp" : "jpg";
      const stored = await storagePut(`property-listings/${ctx.user.id}/${input.id}/${randomUUID()}.${extension}`, data, input.mimeType);
      return db.addManagedPropertyImage(ctx.user.id, input.id, {
        storageKey: stored.key,
        url: stored.url,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: data.length,
        sortOrder: listing?.images.length ?? 0,
      });
    }),
    removeImage: protectedProcedure.input(z.object({ id: z.number().int().positive(), imageId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const removed = await db.removeManagedPropertyImage(ctx.user.id, input.id, input.imageId);
      if (!removed) throw new TRPCError({ code: "NOT_FOUND", message: "Image not found or unavailable to this account" });
      return { imageId: input.imageId };
    }),
    uploadFloorPlan: protectedProcedure.input(z.object({
      id: z.number().int().positive(),
      fileName: z.string().min(1).max(255),
      mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
      base64: z.string().min(1).max(8_500_000),
    })).mutation(async ({ ctx, input }) => {
      if (!await db.isManagedPropertyOwner(ctx.user.id, input.id)) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found or unavailable to this account" });
      const data = Buffer.from(input.base64, "base64");
      if (!data.length || data.length > 6 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "The floor plan must be smaller than 6 MB" });
      const extension = input.mimeType === "image/png" ? "png" : input.mimeType === "image/webp" ? "webp" : "jpg";
      const stored = await storagePut(`property-listings/${ctx.user.id}/${input.id}/floor-plans/${randomUUID()}.${extension}`, data, input.mimeType);
      return db.upsertManagedPropertyFloorPlan(ctx.user.id, input.id, {
        storageKey: stored.key,
        url: stored.url,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: data.length,
      });
    }),
    removeFloorPlan: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const removed = await db.removeManagedPropertyFloorPlan(ctx.user.id, input.id);
      if (!removed) throw new TRPCError({ code: "NOT_FOUND", message: "Floor plan not found or unavailable to this account" });
      return { id: input.id };
    }),
  }),
  ai: router({
    chat: publicProcedure.input(z.object({
      mode: z.enum(["buyer", "agent"]),
      marketId: z.enum(marketIds).optional(),
      messages: z.array(messageSchema).min(1).max(20),
    })).mutation(async ({ input }) => {
      const market = getMarketConfig(input.marketId ?? defaultMarketId);
      const catalog = properties.filter(property => property.marketId === market.id).map(property => ({
        id: property.id,
        title: property.title,
        district: property.district,
        price: property.price,
        monthlyRent: property.monthlyRent,
        type: property.type,
        mode: property.mode,
        beds: property.beds,
        size: property.size,
        tenure: property.tenure,
        mrt: property.mrt,
        mrtMinutes: property.mrtMinutes,
        tags: property.tags,
        commercialUsage: property.commercialUsage,
        floorLoading: property.floorLoading,
        ceilingHeight: property.ceilingHeight,
        loadingAccess: property.loadingAccess,
        parkingLots: property.parkingLots,
        availableFrom: property.availableFrom,
      }));
      const system = input.mode === "buyer"
        ? `You are UrbanKey Concierge, a careful ${market.countryName} residential, commercial, and industrial property discovery assistant. Recommend only from the provided demonstration catalog and explain fit, transaction mode, permitted or intended usage, floor loading, ceiling height, loading access, parking, price, commute, tenure, and next steps when relevant. Never invent a listing or claim a recommendation guarantees suitability, zoning approval, or regulatory compliance. The active market uses ${market.currency}, ${market.terminology.areaUnit}, and ${market.terminology.transit} terminology. Catalog: ${JSON.stringify(catalog)}`
        : `You are UrbanKey Pro, an assistant for ${market.countryName} residential, commercial, and industrial property agents and co-brokers. Use the provided demonstration catalog for comparative market observations, commercial-use matching, operational specification checks, co-broking angles, listing positioning, and principled negotiation suggestions. Do not provide legal or financial advice, do not claim regulatory approval, and never reveal or infer private owner identity. The active market uses ${market.currency}, ${market.terminology.areaUnit}, and ${market.terminology.transit} terminology. Catalog: ${JSON.stringify(catalog)}`;
      const response = await invokeLLM({ messages: [{ role: "system", content: system }, ...input.messages] });
      const content = response.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) throw new Error("The assistant did not return a response");
      return { content };
    }),
  }),
});

export type AppRouter = typeof appRouter;
