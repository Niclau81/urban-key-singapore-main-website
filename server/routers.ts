import { COOKIE_NAME } from "@shared/const";
import { properties, propertyHistoryDisclaimer } from "@shared/propertyData";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";

const messageSchema = z.object({ role: z.enum(["system", "user", "assistant"]), content: z.string().min(1).max(5000) });
const listingInputSchema = z.object({
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
      return (!input.mode || input.mode === property.mode)
        && (!input.district || input.district === "All districts" || property.district === input.district)
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
    get: protectedProcedure.query(({ ctx }) => db.getProfile(ctx.user.id)),
    save: protectedProcedure.input(z.object({
      persona: z.enum(["buyer_tenant", "seller_landlord", "agent_co_broker"]),
      preferredDistricts: z.string().max(500).optional(),
      budget: z.number().int().positive().optional(),
    })).mutation(({ ctx, input }) => db.saveProfile(ctx.user.id, input)),
  }),
  saved: router({
    list: protectedProcedure.query(({ ctx }) => db.listSaved(ctx.user.id)),
    toggle: protectedProcedure.input(z.object({ propertyId: z.string() })).mutation(({ ctx, input }) => db.toggleSaved(ctx.user.id, input.propertyId)),
  }),
  enquiry: router({
    list: protectedProcedure.query(({ ctx }) => db.listEnquiries(ctx.user.id)),
    create: protectedProcedure.input(z.object({ propertyId: z.string(), message: z.string().min(10).max(2000) })).mutation(({ ctx, input }) => db.createEnquiry(ctx.user.id, input.propertyId, input.message)),
  }),
  listing: router({
    listMine: protectedProcedure.query(({ ctx }) => db.listManagedProperties(ctx.user.id)),
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
  }),
  ai: router({
    chat: publicProcedure.input(z.object({
      mode: z.enum(["buyer", "agent"]),
      messages: z.array(messageSchema).min(1).max(20),
    })).mutation(async ({ input }) => {
      const catalog = properties.map(property => ({
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
        ? `You are UrbanKey Concierge, a careful Singapore residential, commercial, and industrial property discovery assistant. Recommend only from the provided demonstration catalog and explain fit, transaction mode, permitted or intended usage, floor loading, ceiling height, loading access, parking, price, commute, tenure, and next steps when relevant. Never invent a listing or claim a recommendation guarantees suitability, zoning approval, or regulatory compliance. Catalog: ${JSON.stringify(catalog)}`
        : `You are UrbanKey Pro, an assistant for Singapore residential, commercial, and industrial property agents and co-brokers. Use the provided demonstration catalog for comparative market observations, commercial-use matching, operational specification checks, co-broking angles, listing positioning, and principled negotiation suggestions. Do not provide legal or financial advice, do not claim regulatory approval, and never reveal or infer private owner identity. Catalog: ${JSON.stringify(catalog)}`;
      const response = await invokeLLM({ messages: [{ role: "system", content: system }, ...input.messages] });
      const content = response.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) throw new Error("The assistant did not return a response");
      return { content };
    }),
  }),
});

export type AppRouter = typeof appRouter;
