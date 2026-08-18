import { boolean, decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
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

export const agentProfiles = mysqlTable("agentProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accountType: mysqlEnum("accountType", ["agent", "co_broker"]).notNull(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  middleName: varchar("middleName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  contactNumber: varchar("contactNumber", { length: 32 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  companyName: varchar("companyName", { length: 180 }).notNull(),
  companyAddress: varchar("companyAddress", { length: 320 }).notNull(),
  postalCode: varchar("postalCode", { length: 12 }),
  agentLicenseNumber: varchar("agentLicenseNumber", { length: 80 }).notNull(),
  jobTitle: varchar("jobTitle", { length: 120 }),
  businessRegistrationNumber: varchar("businessRegistrationNumber", { length: 80 }),
  website: varchar("website", { length: 320 }),
  termsAcceptedAt: timestamp("termsAcceptedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  userIdUnique: uniqueIndex("agentProfiles_userId_unique").on(table.userId),
  licenseUnique: uniqueIndex("agentProfiles_license_unique").on(table.agentLicenseNumber),
}));

export const subscriptionOrders = mysqlTable("subscriptionOrders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: varchar("planId", { length: 40 }).notNull(),
  termMonths: int("termMonths").notNull(),
  status: mysqlEnum("status", ["pending", "active", "failed", "cancelled", "expired"]).default("pending").notNull(),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }).notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  receiptEmail: varchar("receiptEmail", { length: 320 }).notNull(),
  receiptEmailedAt: timestamp("receiptEmailedAt"),
  startedAt: timestamp("startedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  checkoutSessionUnique: uniqueIndex("subscriptionOrders_checkoutSession_unique").on(table.stripeCheckoutSessionId),
}));

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
  marketId: varchar("marketId", { length: 40 }).default("singapore").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  address: varchar("address", { length: 240 }),
  mrtName: varchar("mrtName", { length: 120 }),
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

export const propertyListingImages = mysqlTable("propertyListingImages", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  userId: int("userId").notNull(),
  storageKey: varchar("storageKey", { length: 768 }).notNull(),
  url: text("url").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 80 }).notNull(),
  fileSize: int("fileSize").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const propertyListingFloorPlans = mysqlTable("propertyListingFloorPlans", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  userId: int("userId").notNull(),
  storageKey: varchar("storageKey", { length: 768 }).notNull(),
  url: text("url").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 80 }).notNull(),
  fileSize: int("fileSize").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ listingUnique: uniqueIndex("propertyListingFloorPlans_listing_unique").on(table.listingId) }));

export const propertyTourCaptures = mysqlTable("propertyTourCaptures", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  userId: int("userId").notNull(),
  storageKey: varchar("storageKey", { length: 768 }).notNull(),
  url: text("url").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 80 }).notNull(),
  fileSize: int("fileSize").notNull(),
  width: int("width").notNull(),
  height: int("height").notNull(),
  aspectRatio: varchar("aspectRatio", { length: 24 }).notNull(),
  horizontalCoverage: int("horizontalCoverage").notNull(),
  verticalCoverage: int("verticalCoverage").notNull(),
  floorLabel: varchar("floorLabel", { length: 120 }).notNull(),
  roomLabel: varchar("roomLabel", { length: 120 }).notNull(),
  qualityStatus: mysqlEnum("qualityStatus", ["uploaded", "quality_review", "privacy_review", "approval_required", "approved", "rejected", "published"]).default("uploaded").notNull(),
  technicalReviewPassed: boolean("technicalReviewPassed").default(false).notNull(),
  privacyReviewStatus: mysqlEnum("privacyReviewStatus", ["not_run", "review_required", "cleared", "blocked"]).default("not_run").notNull(),
  manualPrivacyReviewed: boolean("manualPrivacyReviewed").default(false).notNull(),
  listingAuthorizationConfirmed: boolean("listingAuthorizationConfirmed").default(false).notNull(),
  captureConsentConfirmed: boolean("captureConsentConfirmed").default(false).notNull(),
  qualityNotes: text("qualityNotes"),
  approvedAt: timestamp("approvedAt"),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  listingUserIndex: index("propertyTourCaptures_listing_user_index").on(table.listingId, table.userId),
}));

export const propertyTourCaptureAudits = mysqlTable("propertyTourCaptureAudits", {
  id: int("id").autoincrement().primaryKey(),
  captureId: int("captureId").notNull(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 160 }).notNull(),
  detail: text("detail").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const propertyAgentCases = mysqlTable("propertyAgentCases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  marketId: varchar("marketId", { length: 40 }).default("singapore").notNull(),
  journey: mysqlEnum("journey", ["buy", "sell", "rent", "rent_out"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  propertyId: varchar("propertyId", { length: 96 }),
  status: mysqlEnum("status", ["intake", "sourcing", "viewings", "paperwork", "professional_review", "awaiting_authorisation", "coordination", "completed", "on_hold", "closed"]).default("intake").notNull(),
  processingConsent: boolean("processingConsent").default(false).notNull(),
  processingConsentAt: timestamp("processingConsentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const propertyAgentTasks = mysqlTable("propertyAgentTasks", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  category: mysqlEnum("category", ["sourcing", "paperwork", "appointment", "professional", "government", "communication"]).notNull(),
  ownerRole: mysqlEnum("ownerRole", ["customer", "agent", "lawyer", "government", "system"]).notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "waiting_customer", "waiting_professional", "completed", "blocked"]).default("pending").notNull(),
  requiresAuthorization: boolean("requiresAuthorization").default(false).notNull(),
  authorizedAt: timestamp("authorizedAt"),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const propertyAgentDocuments = mysqlTable("propertyAgentDocuments", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  label: varchar("label", { length: 240 }).notNull(),
  category: mysqlEnum("category", ["identity", "financial", "property", "offer", "tenancy", "tax", "legal", "other"]).notNull(),
  status: mysqlEnum("status", ["requested", "uploaded", "prepared", "review_required", "ready_for_handoff", "handed_to_professional"]).default("requested").notNull(),
  storageKey: varchar("storageKey", { length: 768 }),
  url: text("url"),
  fileName: varchar("fileName", { length: 255 }),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"),
  requiresAuthorization: boolean("requiresAuthorization").default(false).notNull(),
  authorizedAt: timestamp("authorizedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const propertyAgentAppointments = mysqlTable("propertyAgentAppointments", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  kind: mysqlEnum("kind", ["viewing", "owner_contact", "lawyer_review", "completion", "other"]).notNull(),
  counterparty: varchar("counterparty", { length: 180 }).notNull(),
  preferredAt: timestamp("preferredAt"),
  status: mysqlEnum("status", ["draft", "approval_required", "requested", "confirmed", "completed", "cancelled"]).default("draft").notNull(),
  requiresAuthorization: boolean("requiresAuthorization").default(true).notNull(),
  authorizedAt: timestamp("authorizedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const propertyAgentCommunications = mysqlTable("propertyAgentCommunications", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  channel: mysqlEnum("channel", ["email", "whatsapp"]).notNull(),
  recipient: varchar("recipient", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 240 }),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["draft", "approval_required", "authorized_to_send", "connection_required", "sent", "failed", "cancelled"]).default("draft").notNull(),
  requiresAuthorization: boolean("requiresAuthorization").default(true).notNull(),
  customerAuthorizedAt: timestamp("customerAuthorizedAt"),
  providerMessageId: varchar("providerMessageId", { length: 255 }),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const propertyAgentHandOffs = mysqlTable("propertyAgentHandOffs", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  destination: mysqlEnum("destination", ["lawyer", "licensed_agent", "hdb", "iras", "sla", "ura", "bank", "other"]).notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  purpose: text("purpose").notNull(),
  status: mysqlEnum("status", ["not_ready", "pack_ready", "approval_required", "authorized_for_handoff", "professionally_submitted", "completed", "blocked"]).default("not_ready").notNull(),
  requiresAuthorization: boolean("requiresAuthorization").default(true).notNull(),
  authorizedAt: timestamp("authorizedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const propertyAgentAuditLogs = mysqlTable("propertyAgentAuditLogs", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 160 }).notNull(),
  actorRole: mysqlEnum("actorRole", ["customer", "system", "agent", "professional"]).notNull(),
  detail: text("detail").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type AgentProfile = typeof agentProfiles.$inferSelect;
export type SubscriptionOrder = typeof subscriptionOrders.$inferSelect;
export type SavedListing = typeof savedListings.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type PropertyListing = typeof propertyListings.$inferSelect;
export type PropertyListingImage = typeof propertyListingImages.$inferSelect;
export type PropertyListingFloorPlan = typeof propertyListingFloorPlans.$inferSelect;
export type PropertyTourCapture = typeof propertyTourCaptures.$inferSelect;
export type PropertyTourCaptureAudit = typeof propertyTourCaptureAudits.$inferSelect;
export type PropertyAgentCase = typeof propertyAgentCases.$inferSelect;
export type PropertyAgentTask = typeof propertyAgentTasks.$inferSelect;
export type PropertyAgentDocument = typeof propertyAgentDocuments.$inferSelect;
export type PropertyAgentAppointment = typeof propertyAgentAppointments.$inferSelect;
export type PropertyAgentCommunication = typeof propertyAgentCommunications.$inferSelect;
export type PropertyAgentHandOff = typeof propertyAgentHandOffs.$inferSelect;
export type PropertyAgentAuditLog = typeof propertyAgentAuditLogs.$inferSelect;
