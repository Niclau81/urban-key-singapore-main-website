import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  persona: mysqlEnum("persona", ["buyer_tenant", "seller_landlord", "agent_co_broker"]).default("buyer_tenant").notNull(),
  preferredDistricts: text("preferredDistricts"),
  budget: int("budget"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ userIdUnique: uniqueIndex("userProfiles_userId_unique").on(table.userId) }));

export const savedListings = mysqlTable("savedListings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  propertyId: varchar("propertyId", { length: 96 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ savedUnique: uniqueIndex("savedListings_user_property_unique").on(table.userId, table.propertyId) }));

export const enquiries = mysqlTable("enquiries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  propertyId: varchar("propertyId", { length: 96 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "contacted", "closed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const propertyListings = mysqlTable("propertyListings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  mode: mysqlEnum("mode", ["Sell", "Rent-Out"]).notNull(),
  district: varchar("district", { length: 80 }).notNull(),
  propertyType: varchar("propertyType", { length: 80 }).notNull(),
  price: int("price").notNull(),
  size: int("size").notNull(),
  mrtMinutes: int("mrtMinutes").notNull(),
  tenure: varchar("tenure", { length: 60 }).notNull(),
  commercialUsage: varchar("commercialUsage", { length: 160 }),
  floorLoading: decimal("floorLoading", { precision: 7, scale: 2 }),
  ceilingHeight: decimal("ceilingHeight", { precision: 6, scale: 2 }),
  loadingAccess: varchar("loadingAccess", { length: 180 }),
  parkingLots: int("parkingLots"),
  availableFrom: varchar("availableFrom", { length: 24 }),
  status: mysqlEnum("status", ["draft", "active", "paused"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type SavedListing = typeof savedListings.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type PropertyListing = typeof propertyListings.$inferSelect;
