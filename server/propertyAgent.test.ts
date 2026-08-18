import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { TrpcContext } from "./_core/context";
import { singaporeJourneyBlueprints } from "../shared/propertyAgent";

const mocks = vi.hoisted(() => ({
  createPropertyAgentCase: vi.fn(),
  getPropertyAgentCase: vi.fn(),
  recordPropertyAgentConsent: vi.fn(),
  updatePropertyAgentCaseStatus: vi.fn(),
  updatePropertyAgentTask: vi.fn(),
  updatePropertyAgentDocumentStatus: vi.fn(),
  attachPropertyAgentDocument: vi.fn(),
  createPropertyAgentCommunication: vi.fn(),
  authorizePropertyAgentCommunication: vi.fn(),
  createPropertyAgentAppointment: vi.fn(),
  authorizePropertyAgentAppointment: vi.fn(),
  authorizePropertyAgentHandOff: vi.fn(),
  storagePut: vi.fn(),
  invokeLLM: vi.fn(),
}));

vi.mock("./db", async () => ({ ...(await vi.importActual<typeof import("./db")>("./db")), ...mocks }));
vi.mock("./storage", () => ({ storagePut: mocks.storagePut }));
vi.mock("./_core/llm", () => ({ invokeLLM: mocks.invokeLLM }));

import { appRouter } from "./routers";

function authenticatedContext(userId = 21): TrpcContext {
  return {
    user: { id: userId, openId: `property-agent-${userId}`, email: `owner-${userId}@example.com`, name: "Workflow Owner", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const consentedWorkflow = {
  case: { id: 12, userId: 21, marketId: "singapore", journey: "buy" as const, title: "Family home purchase", propertyId: null, status: "intake" as const, processingConsent: true, processingConsentAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
  tasks: [], documents: [], appointments: [], communications: [], handOffs: [], audit: [],
};

describe("Singapore AI Property Agent safeguards", () => {
  beforeEach(() => vi.clearAllMocks());

  it("defines a complete controlled workflow blueprint for all four requested journeys", () => {
    expect(Object.keys(singaporeJourneyBlueprints).sort()).toEqual(["buy", "rent", "rent_out", "sell"]);
    for (const blueprint of Object.values(singaporeJourneyBlueprints)) {
      expect(blueprint.tasks.length).toBeGreaterThan(3);
      expect(blueprint.documents.length).toBeGreaterThan(2);
      expect(blueprint.handoffs.some(item => item.requiresAuthorization)).toBe(true);
    }
  });

  it("keeps the Property Agent discoverable through public desktop/mobile navigation and the homepage", () => {
    const header = readFileSync(resolve(process.cwd(), "client/src/components/BrandHeader.tsx"), "utf8");
    const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(header).toContain('href="/property-agent"');
    expect(header).toContain("AI Property Agent");
    expect(home).toContain('href="/property-agent"');
    expect(home).toContain("From sourcing and viewings to paperwork and professional hand-offs");
  });

  it("creates a consent-recorded Singapore case with its selected journey", async () => {
    mocks.createPropertyAgentCase.mockResolvedValue(consentedWorkflow);
    const caller = appRouter.createCaller(authenticatedContext());
    await expect(caller.propertyAgent.createCase({ journey: "buy", title: "Family home purchase", processingConsent: true })).resolves.toEqual(consentedWorkflow);
    expect(mocks.createPropertyAgentCase).toHaveBeenCalledWith(21, { journey: "buy", title: "Family home purchase", processingConsent: true });
  });

  it("blocks communication preparation until customer processing consent is recorded", async () => {
    mocks.getPropertyAgentCase.mockResolvedValue({ ...consentedWorkflow, case: { ...consentedWorkflow.case, processingConsent: false, processingConsentAt: null } });
    const caller = appRouter.createCaller(authenticatedContext());
    await expect(caller.propertyAgent.createCommunication({ caseId: 12, channel: "email", recipient: "owner@example.com", subject: "Viewing", message: "May we propose a viewing time?" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(mocks.createPropertyAgentCommunication).not.toHaveBeenCalled();
  });

  it("keeps an authorised communication in the connection-required state instead of sending it", async () => {
    mocks.getPropertyAgentCase.mockResolvedValue(consentedWorkflow);
    mocks.authorizePropertyAgentCommunication.mockResolvedValue(true);
    const caller = appRouter.createCaller(authenticatedContext());
    await expect(caller.propertyAgent.authorizeCommunication({ caseId: 12, communicationId: 41 })).resolves.toEqual({ caseId: 12, communicationId: 41, status: "connection_required" });
    expect(mocks.authorizePropertyAgentCommunication).toHaveBeenCalledWith(21, 12, 41);
  });

  it("stores a consented document attachment through the secure workflow storage path", async () => {
    mocks.getPropertyAgentCase.mockResolvedValue(consentedWorkflow);
    mocks.storagePut.mockResolvedValue({ key: "property-agent/21/12/documents/5/file.pdf", url: "https://storage.example/file.pdf" });
    mocks.attachPropertyAgentDocument.mockResolvedValue(true);
    const caller = appRouter.createCaller(authenticatedContext());
    const base64 = Buffer.from("workflow-document").toString("base64");
    await expect(caller.propertyAgent.uploadDocument({ caseId: 12, documentId: 5, fileName: "identity.pdf", mimeType: "application/pdf", base64 })).resolves.toEqual({ documentId: 5, fileName: "identity.pdf" });
    expect(mocks.storagePut).toHaveBeenCalledWith(expect.stringMatching(/^property-agent\/21\/12\/documents\/5\/.+\.pdf$/), Buffer.from("workflow-document"), "application/pdf");
    expect(mocks.attachPropertyAgentDocument).toHaveBeenCalledWith(21, 12, 5, expect.objectContaining({ fileName: "identity.pdf", mimeType: "application/pdf", fileSize: 17 }));
  });

  it("only authorises a government or professional hand-off and never claims submission", async () => {
    mocks.getPropertyAgentCase.mockResolvedValue(consentedWorkflow);
    mocks.authorizePropertyAgentHandOff.mockResolvedValue(true);
    const caller = appRouter.createCaller(authenticatedContext());
    await expect(caller.propertyAgent.authorizeHandOff({ caseId: 12, handOffId: 8 })).resolves.toEqual({ caseId: 12, handOffId: 8 });
    expect(mocks.authorizePropertyAgentHandOff).toHaveBeenCalledWith(21, 12, 8);
  });
});
