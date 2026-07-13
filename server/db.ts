import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { enquiries, InsertUser, propertyListingImages, propertyListings, savedListings, userProfiles, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: user.lastSignedIn ?? new Date() };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) {
    values.role = user.role ?? "admin";
    updateSet.role = values.role;
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return rows[0];
}

export async function saveProfile(userId: number, input: { persona: "buyer_tenant" | "seller_landlord" | "agent_co_broker"; preferredDistricts?: string; budget?: number }) {
  const db = await getDb();
  if (!db) return { userId, ...input };
  await db.insert(userProfiles).values({ userId, ...input }).onDuplicateKeyUpdate({ set: input });
  return getProfile(userId);
}

export async function listSaved(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(savedListings).where(eq(savedListings.userId, userId)).orderBy(desc(savedListings.createdAt));
}

export async function toggleSaved(userId: number, propertyId: string) {
  const db = await getDb();
  if (!db) return { saved: true };
  const existing = await db.select().from(savedListings).where(and(eq(savedListings.userId, userId), eq(savedListings.propertyId, propertyId))).limit(1);
  if (existing.length) {
    await db.delete(savedListings).where(and(eq(savedListings.userId, userId), eq(savedListings.propertyId, propertyId)));
    return { saved: false };
  }
  await db.insert(savedListings).values({ userId, propertyId });
  return { saved: true };
}

export async function listEnquiries(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(enquiries).where(eq(enquiries.userId, userId)).orderBy(desc(enquiries.createdAt));
}

export async function createEnquiry(userId: number, propertyId: string, message: string) {
  const db = await getDb();
  if (!db) return { id: 0, userId, propertyId, message, status: "new" as const, createdAt: new Date() };
  const result = await db.insert(enquiries).values({ userId, propertyId, message });
  return { id: Number(result[0].insertId), userId, propertyId, message, status: "new" as const, createdAt: new Date() };
}

export async function listManagedProperties(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const listings = await db.select().from(propertyListings).where(eq(propertyListings.userId, userId)).orderBy(desc(propertyListings.createdAt));
  const images = await db.select().from(propertyListingImages).where(eq(propertyListingImages.userId, userId)).orderBy(propertyListingImages.sortOrder, propertyListingImages.id);
  return listings.map(listing => ({ ...listing, images: images.filter(image => image.listingId === listing.id) }));
}

export async function createManagedProperty(userId: number, input: {
  title: string;
  description?: string;
  address?: string;
  mrtName?: string;
  mode: "Sell" | "Rent-Out";
  district: string;
  propertyType: string;
  price: number;
  size: number;
  mrtMinutes: number;
  tenure: string;
  commercialUsage?: string;
  floorLoading?: number;
  ceilingHeight?: number;
  loadingAccess?: string;
  parkingLots?: number;
  availableFrom?: string;
}) {
  const db = await getDb();
  if (!db) return { id: 0, userId, ...input, status: "draft" as const, createdAt: new Date(), updatedAt: new Date() };
  const result = await db.insert(propertyListings).values({
    userId,
    ...input,
    floorLoading: input.floorLoading?.toString(),
    ceilingHeight: input.ceilingHeight?.toString(),
  });
  return { id: Number(result[0].insertId), userId, ...input, status: "draft" as const, createdAt: new Date(), updatedAt: new Date() };
}

export async function isManagedPropertyOwner(userId: number, id: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: propertyListings.id }).from(propertyListings).where(and(eq(propertyListings.id, id), eq(propertyListings.userId, userId))).limit(1);
  return rows.length > 0;
}

export async function updateManagedProperty(userId: number, id: number, input: {
  title: string;
  description?: string;
  address?: string;
  mrtName?: string;
  mode: "Sell" | "Rent-Out";
  district: string;
  propertyType: string;
  price: number;
  size: number;
  mrtMinutes: number;
  tenure: string;
  commercialUsage?: string;
  floorLoading?: number;
  ceilingHeight?: number;
  loadingAccess?: string;
  parkingLots?: number;
  availableFrom?: string;
}) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(propertyListings).set({
    ...input,
    description: input.description || null,
    address: input.address || null,
    mrtName: input.mrtName || null,
    commercialUsage: input.commercialUsage || null,
    floorLoading: input.floorLoading?.toString() ?? null,
    ceilingHeight: input.ceilingHeight?.toString() ?? null,
    loadingAccess: input.loadingAccess || null,
    parkingLots: input.parkingLots ?? null,
    availableFrom: input.availableFrom || null,
  }).where(and(eq(propertyListings.id, id), eq(propertyListings.userId, userId)));
  return Number(result[0].affectedRows) > 0;
}

export async function addManagedPropertyImage(userId: number, listingId: number, image: {
  storageKey: string;
  url: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
}) {
  const db = await getDb();
  if (!db) return { id: 0, userId, listingId, ...image, createdAt: new Date() };
  const result = await db.insert(propertyListingImages).values({ userId, listingId, ...image });
  return { id: Number(result[0].insertId), userId, listingId, ...image, createdAt: new Date() };
}

export async function removeManagedPropertyImage(userId: number, listingId: number, imageId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(propertyListingImages).where(and(eq(propertyListingImages.id, imageId), eq(propertyListingImages.listingId, listingId), eq(propertyListingImages.userId, userId)));
  return Number(result[0].affectedRows) > 0;
}

export async function updateManagedPropertyStatus(userId: number, id: number, status: "draft" | "active" | "paused") {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(propertyListings).set({ status }).where(and(eq(propertyListings.id, id), eq(propertyListings.userId, userId)));
  return Number(result[0].affectedRows) > 0;
}
