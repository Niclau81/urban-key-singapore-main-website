import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { enquiries, InsertUser, propertyListings, savedListings, userProfiles, users } from "../drizzle/schema";
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
  return db.select().from(propertyListings).where(eq(propertyListings.userId, userId)).orderBy(desc(propertyListings.createdAt));
}

export async function createManagedProperty(userId: number, input: {
  title: string;
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

export async function updateManagedPropertyStatus(userId: number, id: number, status: "draft" | "active" | "paused") {
  const db = await getDb();
  if (!db) return { id, status };
  await db.update(propertyListings).set({ status }).where(and(eq(propertyListings.id, id), eq(propertyListings.userId, userId)));
  return { id, status };
}
