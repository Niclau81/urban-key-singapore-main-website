import { COOKIE_NAME } from "@shared/const";
import { properties, propertyHistoryDisclaimer } from "@shared/propertyData";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

const messageSchema = z.object({ role: z.enum(["system", "user", "assistant"]), content: z.string().min(1).max(5000) });

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
      search: z.string().optional(),
    }).optional()).query(({ input }) => properties.filter(property => {
      if (!input) return true;
      const price = property.mode === "Rent" ? property.monthlyRent ?? property.price : property.price;
      const haystack = `${property.title} ${property.address} ${property.district} ${property.mrt}`.toLowerCase();
      return (!input.mode || input.mode === property.mode || input.mode === "Sell" || input.mode === "Rent-Out")
        && (!input.district || input.district === "All districts" || property.district === input.district)
        && (!input.propertyType || input.propertyType === "All types" || property.type === input.propertyType)
        && (!input.maxPrice || price <= input.maxPrice)
        && (!input.minSize || property.size >= input.minSize)
        && (!input.maxMrtMinutes || property.mrtMinutes <= input.maxMrtMinutes)
        && (!input.tenure || input.tenure === "Any tenure" || property.tenure === input.tenure)
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
    create: protectedProcedure.input(z.object({
      title: z.string().min(4).max(180),
      mode: z.enum(["Sell", "Rent-Out"]),
      district: z.string().min(2).max(80),
      propertyType: z.string().min(2).max(80),
      price: z.number().int().positive(),
      size: z.number().int().positive(),
      mrtMinutes: z.number().int().min(0).max(60),
      tenure: z.string().min(2).max(60),
    })).mutation(({ ctx, input }) => db.createManagedProperty(ctx.user.id, input)),
    updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["draft", "active", "paused"]) })).mutation(({ ctx, input }) => db.updateManagedPropertyStatus(ctx.user.id, input.id, input.status)),
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
        beds: property.beds,
        size: property.size,
        tenure: property.tenure,
        mrt: property.mrt,
        mrtMinutes: property.mrtMinutes,
        tags: property.tags,
      }));
      const system = input.mode === "buyer"
        ? `You are UrbanKey Concierge, a careful Singapore property discovery assistant. Recommend only from the provided demonstration catalog and explain fit, trade-offs, price, commute, tenure, and next steps. Never invent a listing or claim a recommendation guarantees suitability. Catalog: ${JSON.stringify(catalog)}`
        : `You are UrbanKey Pro, an assistant for Singapore property agents and co-brokers. Use the provided demonstration catalog for comparative market observations, co-broking angles, listing positioning, and principled negotiation suggestions. Do not provide legal or financial advice and never reveal or infer private owner identity. Catalog: ${JSON.stringify(catalog)}`;
      const response = await invokeLLM({ messages: [{ role: "system", content: system }, ...input.messages] });
      const content = response.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) throw new Error("The assistant did not return a response");
      return { content };
    }),
  }),
});

export type AppRouter = typeof appRouter;
