import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { agentProfiles, enquiries, InsertUser, propertyAgentAppointments, propertyAgentAuditLogs, propertyAgentCases, propertyAgentCommunications, propertyAgentDocuments, propertyAgentHandOffs, propertyAgentTasks, propertyListingFloorPlans, propertyListingImages, propertyListings, savedListings, subscriptionOrders, userProfiles, users } from "../drizzle/schema";
import type { MarketId } from "@shared/marketConfig";
import { singaporeJourneyBlueprints, type PropertyAgentCaseStatus, type SingaporeJourneyId } from "@shared/propertyAgent";
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
  if (!db) return null;
  const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function saveProfile(userId: number, input: { persona: "buyer_tenant" | "seller_landlord" | "agent_co_broker"; preferredDistricts?: string; budget?: number }) {
  const db = await getDb();
  if (!db) return { userId, ...input };
  await db.insert(userProfiles).values({ userId, ...input }).onDuplicateKeyUpdate({ set: input });
  return getProfile(userId);
}

export type AgentProfileInput = {
  accountType: "agent" | "co_broker";
  firstName: string;
  middleName?: string;
  lastName: string;
  contactNumber: string;
  email: string;
  companyName: string;
  companyAddress: string;
  postalCode?: string;
  agentLicenseNumber: string;
  jobTitle?: string;
  businessRegistrationNumber?: string;
  website?: string;
  termsAcceptedAt: Date;
};

export async function getAgentProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(agentProfiles).where(eq(agentProfiles.userId, userId)).limit(1);
  return rows[0];
}

export async function upsertAgentProfile(userId: number, input: AgentProfileInput) {
  const db = await getDb();
  if (!db) return { id: 0, userId, ...input, createdAt: new Date(), updatedAt: new Date() };
  await db.insert(agentProfiles).values({ userId, ...input }).onDuplicateKeyUpdate({ set: input });
  return getAgentProfile(userId);
}

export async function updateUserStripeCustomerId(userId: number, stripeCustomerId: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId));
}

export async function createSubscriptionOrder(userId: number, input: {
  planId: string;
  termMonths: number;
  stripeCheckoutSessionId: string;
  receiptEmail: string;
}) {
  const db = await getDb();
  if (!db) return { id: 0, userId, status: "pending" as const, ...input, createdAt: new Date(), updatedAt: new Date() };
  const result = await db.insert(subscriptionOrders).values({ userId, status: "pending", ...input });
  return { id: Number(result[0].insertId), userId, status: "pending" as const, ...input, createdAt: new Date(), updatedAt: new Date() };
}

export async function getSubscriptionOrderBySessionId(stripeCheckoutSessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(subscriptionOrders).where(eq(subscriptionOrders.stripeCheckoutSessionId, stripeCheckoutSessionId)).limit(1);
  return rows[0];
}

export async function activateSubscriptionOrder(stripeCheckoutSessionId: string, input: {
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;
}) {
  const db = await getDb();
  if (!db) return undefined;
  const order = await getSubscriptionOrderBySessionId(stripeCheckoutSessionId);
  if (!order) return undefined;
  if (order.status === "active") return order;

  const startedAt = new Date();
  const expiresAt = new Date(startedAt);
  expiresAt.setUTCMonth(expiresAt.getUTCMonth() + order.termMonths);
  await db.update(subscriptionOrders).set({
    status: "active",
    stripePaymentIntentId: input.stripePaymentIntentId ?? null,
    stripeCustomerId: input.stripeCustomerId ?? null,
    startedAt,
    expiresAt,
  }).where(eq(subscriptionOrders.id, order.id));
  return getSubscriptionOrderBySessionId(stripeCheckoutSessionId);
}

export async function markSubscriptionReceiptEmailed(stripeCheckoutSessionId: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(subscriptionOrders).set({ receiptEmailedAt: new Date() }).where(eq(subscriptionOrders.stripeCheckoutSessionId, stripeCheckoutSessionId));
}

export async function failSubscriptionOrder(stripeCheckoutSessionId: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(subscriptionOrders).set({ status: "failed" }).where(eq(subscriptionOrders.stripeCheckoutSessionId, stripeCheckoutSessionId));
}

export async function listSubscriptionOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptionOrders).where(eq(subscriptionOrders.userId, userId)).orderBy(desc(subscriptionOrders.createdAt));
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

export async function listManagedProperties(userId: number, marketId?: MarketId) {
  const db = await getDb();
  if (!db) return [];
  const listings = await db.select().from(propertyListings).where(marketId ? and(eq(propertyListings.userId, userId), eq(propertyListings.marketId, marketId)) : eq(propertyListings.userId, userId)).orderBy(desc(propertyListings.createdAt));
  const images = await db.select().from(propertyListingImages).where(eq(propertyListingImages.userId, userId)).orderBy(propertyListingImages.sortOrder, propertyListingImages.id);
  const floorPlans = await db.select().from(propertyListingFloorPlans).where(eq(propertyListingFloorPlans.userId, userId));
  return listings.map(listing => ({
    ...listing,
    images: images.filter(image => image.listingId === listing.id),
    floorPlan: floorPlans.find(plan => plan.listingId === listing.id) ?? null,
  }));
}

export async function createManagedProperty(userId: number, input: {
  marketId: MarketId;
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
  marketId: MarketId;
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

export async function upsertManagedPropertyFloorPlan(userId: number, listingId: number, floorPlan: {
  storageKey: string;
  url: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}) {
  const db = await getDb();
  if (!db) return { id: 0, userId, listingId, ...floorPlan, createdAt: new Date(), updatedAt: new Date() };
  await db.insert(propertyListingFloorPlans).values({ userId, listingId, ...floorPlan }).onDuplicateKeyUpdate({ set: floorPlan });
  const rows = await db.select().from(propertyListingFloorPlans).where(and(eq(propertyListingFloorPlans.listingId, listingId), eq(propertyListingFloorPlans.userId, userId))).limit(1);
  return rows[0];
}

export async function removeManagedPropertyFloorPlan(userId: number, listingId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(propertyListingFloorPlans).where(and(eq(propertyListingFloorPlans.listingId, listingId), eq(propertyListingFloorPlans.userId, userId)));
  return Number(result[0].affectedRows) > 0;
}

export async function updateManagedPropertyStatus(userId: number, id: number, status: "draft" | "active" | "paused") {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(propertyListings).set({ status }).where(and(eq(propertyListings.id, id), eq(propertyListings.userId, userId)));
  return Number(result[0].affectedRows) > 0;
}

export type PropertyAgentCaseInput = {
  journey: SingaporeJourneyId;
  title: string;
  propertyId?: string;
  processingConsent: boolean;
};

export async function listPropertyAgentCases(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(propertyAgentCases).where(eq(propertyAgentCases.userId, userId)).orderBy(desc(propertyAgentCases.updatedAt));
}

export async function getPropertyAgentCase(userId: number, caseId: number) {
  const db = await getDb();
  if (!db) return null;
  const cases = await db.select().from(propertyAgentCases).where(and(eq(propertyAgentCases.id, caseId), eq(propertyAgentCases.userId, userId))).limit(1);
  const propertyCase = cases[0];
  if (!propertyCase) return null;
  const [tasks, documents, appointments, communications, handOffs, audit] = await Promise.all([
    db.select().from(propertyAgentTasks).where(eq(propertyAgentTasks.caseId, caseId)).orderBy(propertyAgentTasks.id),
    db.select().from(propertyAgentDocuments).where(and(eq(propertyAgentDocuments.caseId, caseId), eq(propertyAgentDocuments.userId, userId))).orderBy(propertyAgentDocuments.id),
    db.select().from(propertyAgentAppointments).where(eq(propertyAgentAppointments.caseId, caseId)).orderBy(desc(propertyAgentAppointments.createdAt)),
    db.select().from(propertyAgentCommunications).where(eq(propertyAgentCommunications.caseId, caseId)).orderBy(desc(propertyAgentCommunications.createdAt)),
    db.select().from(propertyAgentHandOffs).where(eq(propertyAgentHandOffs.caseId, caseId)).orderBy(propertyAgentHandOffs.id),
    db.select().from(propertyAgentAuditLogs).where(and(eq(propertyAgentAuditLogs.caseId, caseId), eq(propertyAgentAuditLogs.userId, userId))).orderBy(desc(propertyAgentAuditLogs.createdAt)),
  ]);
  return { case: propertyCase, tasks, documents, appointments, communications, handOffs, audit };
}

async function isPropertyAgentCaseOwner(userId: number, caseId: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: propertyAgentCases.id }).from(propertyAgentCases).where(and(eq(propertyAgentCases.id, caseId), eq(propertyAgentCases.userId, userId))).limit(1);
  return rows.length > 0;
}

export async function createPropertyAgentCase(userId: number, input: PropertyAgentCaseInput) {
  const db = await getDb();
  if (!db) return null;
  const now = new Date();
  const result = await db.insert(propertyAgentCases).values({
    userId,
    marketId: "singapore",
    journey: input.journey,
    title: input.title,
    propertyId: input.propertyId || null,
    processingConsent: input.processingConsent,
    processingConsentAt: input.processingConsent ? now : null,
  });
  const caseId = Number(result[0].insertId);
  const blueprint = singaporeJourneyBlueprints[input.journey];
  await Promise.all([
    db.insert(propertyAgentTasks).values(blueprint.tasks.map(task => ({
      caseId,
      title: task.title,
      category: task.category,
      ownerRole: task.ownerRole,
      requiresAuthorization: Boolean(task.requiresAuthorization),
      status: task.ownerRole === "customer" ? ("waiting_customer" as const) : ("pending" as const),
    }))),
    db.insert(propertyAgentDocuments).values(blueprint.documents.map(document => ({
      caseId,
      userId,
      label: document.label,
      category: document.category,
      requiresAuthorization: Boolean(document.requiresAuthorization),
    }))),
    db.insert(propertyAgentHandOffs).values(blueprint.handoffs.map(handOff => ({
      caseId,
      destination: handOff.destination,
      title: handOff.title,
      purpose: handOff.purpose,
      requiresAuthorization: handOff.requiresAuthorization !== false,
      status: handOff.requiresAuthorization === false ? ("pack_ready" as const) : ("approval_required" as const),
    }))),
    db.insert(propertyAgentAuditLogs).values({ caseId, userId, action: "case_created", actorRole: "customer", detail: `Created a Singapore ${input.journey} workflow with consent ${input.processingConsent ? "recorded" : "not yet recorded"}.` }),
  ]);
  return getPropertyAgentCase(userId, caseId);
}

export async function updatePropertyAgentCaseStatus(userId: number, caseId: number, status: PropertyAgentCaseStatus) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(propertyAgentCases).set({ status }).where(and(eq(propertyAgentCases.id, caseId), eq(propertyAgentCases.userId, userId)));
  if (Number(result[0].affectedRows) > 0) await db.insert(propertyAgentAuditLogs).values({ caseId, userId, action: "case_status_updated", actorRole: "customer", detail: `Case status changed to ${status}.` });
  return Number(result[0].affectedRows) > 0;
}

export async function recordPropertyAgentConsent(userId: number, caseId: number) {
  const db = await getDb();
  if (!db) return false;
  const consentAt = new Date();
  const result = await db.update(propertyAgentCases).set({ processingConsent: true, processingConsentAt: consentAt }).where(and(eq(propertyAgentCases.id, caseId), eq(propertyAgentCases.userId, userId)));
  if (Number(result[0].affectedRows) > 0) await db.insert(propertyAgentAuditLogs).values({ caseId, userId, action: "processing_consent_recorded", actorRole: "customer", detail: "Customer recorded consent for workflow preparation and tracking. External actions remain separately approval-gated." });
  return Number(result[0].affectedRows) > 0;
}

export async function updatePropertyAgentTask(userId: number, caseId: number, taskId: number, status: "pending" | "in_progress" | "waiting_customer" | "waiting_professional" | "completed" | "blocked", authorize = false) {
  const db = await getDb();
  if (!db || !await isPropertyAgentCaseOwner(userId, caseId)) return false;
  const taskRows = await db.select().from(propertyAgentTasks).where(and(eq(propertyAgentTasks.id, taskId), eq(propertyAgentTasks.caseId, caseId))).limit(1);
  const task = taskRows[0];
  if (!task || (task.requiresAuthorization && status === "completed" && !authorize && !task.authorizedAt)) return false;
  const now = new Date();
  const result = await db.update(propertyAgentTasks).set({
    status,
    authorizedAt: authorize ? now : task.authorizedAt,
    completedAt: status === "completed" ? now : null,
  }).where(and(eq(propertyAgentTasks.id, taskId), eq(propertyAgentTasks.caseId, caseId)));
  if (Number(result[0].affectedRows) > 0) await db.insert(propertyAgentAuditLogs).values({ caseId, userId, action: "task_updated", actorRole: "customer", detail: `Updated task “${task.title}” to ${status}${authorize ? " with customer authorisation" : ""}.` });
  return Number(result[0].affectedRows) > 0;
}

export async function updatePropertyAgentDocumentStatus(userId: number, caseId: number, documentId: number, status: "requested" | "uploaded" | "prepared" | "review_required" | "ready_for_handoff" | "handed_to_professional") {
  const db = await getDb();
  if (!db || !await isPropertyAgentCaseOwner(userId, caseId)) return false;
  const result = await db.update(propertyAgentDocuments).set({ status }).where(and(eq(propertyAgentDocuments.id, documentId), eq(propertyAgentDocuments.caseId, caseId), eq(propertyAgentDocuments.userId, userId)));
  if (Number(result[0].affectedRows) > 0) await db.insert(propertyAgentAuditLogs).values({ caseId, userId, action: "document_status_updated", actorRole: "customer", detail: `Updated a document checklist item to ${status}.` });
  return Number(result[0].affectedRows) > 0;
}

export async function attachPropertyAgentDocument(userId: number, caseId: number, documentId: number, file: { storageKey: string; url: string; fileName: string; mimeType: string; fileSize: number }) {
  const db = await getDb();
  if (!db || !await isPropertyAgentCaseOwner(userId, caseId)) return false;
  const result = await db.update(propertyAgentDocuments).set({ ...file, status: "uploaded" }).where(and(eq(propertyAgentDocuments.id, documentId), eq(propertyAgentDocuments.caseId, caseId), eq(propertyAgentDocuments.userId, userId)));
  if (Number(result[0].affectedRows) > 0) await db.insert(propertyAgentAuditLogs).values({ caseId, userId, action: "document_attached", actorRole: "customer", detail: `Attached “${file.fileName}” to a checklist item. The document is stored for workflow preparation and remains subject to the case’s approval gates.` });
  return Number(result[0].affectedRows) > 0;
}

export async function createPropertyAgentCommunication(userId: number, caseId: number, input: { channel: "email" | "whatsapp"; recipient: string; subject?: string; message: string }) {
  const db = await getDb();
  if (!db || !await isPropertyAgentCaseOwner(userId, caseId)) return null;
  const result = await db.insert(propertyAgentCommunications).values({ ...input, caseId, status: "approval_required", requiresAuthorization: true });
  const id = Number(result[0].insertId);
  await db.insert(propertyAgentAuditLogs).values({ caseId, userId, action: "communication_draft_created", actorRole: "customer", detail: `Created a ${input.channel} communication draft that requires approval before it can be sent.` });
  return { id, ...input, status: "approval_required" as const };
}

export async function authorizePropertyAgentCommunication(userId: number, caseId: number, communicationId: number) {
  const db = await getDb();
  if (!db || !await isPropertyAgentCaseOwner(userId, caseId)) return false;
  const now = new Date();
  const result = await db.update(propertyAgentCommunications).set({ status: "connection_required", customerAuthorizedAt: now }).where(and(eq(propertyAgentCommunications.id, communicationId), eq(propertyAgentCommunications.caseId, caseId)));
  if (Number(result[0].affectedRows) > 0) await db.insert(propertyAgentAuditLogs).values({ caseId, userId, action: "communication_authorized", actorRole: "customer", detail: "Customer authorised a communication. It remains unsent until an approved channel connection is configured and reviewed." });
  return Number(result[0].affectedRows) > 0;
}

export async function createPropertyAgentAppointment(userId: number, caseId: number, input: { kind: "viewing" | "owner_contact" | "lawyer_review" | "completion" | "other"; counterparty: string; preferredAt?: Date; notes?: string }) {
  const db = await getDb();
  if (!db || !await isPropertyAgentCaseOwner(userId, caseId)) return null;
  const result = await db.insert(propertyAgentAppointments).values({ ...input, caseId, status: "approval_required", requiresAuthorization: true });
  const id = Number(result[0].insertId);
  await db.insert(propertyAgentAuditLogs).values({ caseId, userId, action: "appointment_draft_created", actorRole: "customer", detail: `Created a ${input.kind} appointment request requiring approval before outreach.` });
  return { id, ...input, status: "approval_required" as const };
}

export async function authorizePropertyAgentAppointment(userId: number, caseId: number, appointmentId: number) {
  const db = await getDb();
  if (!db || !await isPropertyAgentCaseOwner(userId, caseId)) return false;
  const now = new Date();
  const result = await db.update(propertyAgentAppointments).set({ status: "requested", authorizedAt: now }).where(and(eq(propertyAgentAppointments.id, appointmentId), eq(propertyAgentAppointments.caseId, caseId)));
  if (Number(result[0].affectedRows) > 0) await db.insert(propertyAgentAuditLogs).values({ caseId, userId, action: "appointment_authorized", actorRole: "customer", detail: "Customer authorised an appointment request. Scheduling remains pending approved outreach and counterparty confirmation." });
  return Number(result[0].affectedRows) > 0;
}

export async function authorizePropertyAgentHandOff(userId: number, caseId: number, handOffId: number) {
  const db = await getDb();
  if (!db || !await isPropertyAgentCaseOwner(userId, caseId)) return false;
  const now = new Date();
  const result = await db.update(propertyAgentHandOffs).set({ status: "authorized_for_handoff", authorizedAt: now }).where(and(eq(propertyAgentHandOffs.id, handOffId), eq(propertyAgentHandOffs.caseId, caseId)));
  if (Number(result[0].affectedRows) > 0) await db.insert(propertyAgentAuditLogs).values({ caseId, userId, action: "handoff_authorized", actorRole: "customer", detail: "Customer authorised a preparation pack for hand-off. Submission requires the relevant professional or official channel." });
  return Number(result[0].affectedRows) > 0;
}
