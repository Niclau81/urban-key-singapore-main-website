export const singaporeJourneyIds = ["buy", "sell", "rent", "rent_out"] as const;
export type SingaporeJourneyId = (typeof singaporeJourneyIds)[number];

export const propertyAgentCaseStatuses = ["intake", "sourcing", "viewings", "paperwork", "professional_review", "awaiting_authorisation", "coordination", "completed", "on_hold", "closed"] as const;
export type PropertyAgentCaseStatus = (typeof propertyAgentCaseStatuses)[number];

export type PropertyAgentBlueprintItem = {
  title: string;
  category: "sourcing" | "paperwork" | "appointment" | "professional" | "government" | "communication";
  ownerRole: "customer" | "agent" | "lawyer" | "government" | "system";
  requiresAuthorization?: boolean;
};

export type PropertyAgentDocumentBlueprint = {
  label: string;
  category: "identity" | "financial" | "property" | "offer" | "tenancy" | "tax" | "legal" | "other";
  requiresAuthorization?: boolean;
};

export type PropertyAgentHandOffBlueprint = {
  destination: "lawyer" | "licensed_agent" | "hdb" | "iras" | "sla" | "ura" | "bank" | "other";
  title: string;
  purpose: string;
  requiresAuthorization?: boolean;
};

export type PropertyAgentJourneyBlueprint = {
  label: string;
  summary: string;
  tasks: PropertyAgentBlueprintItem[];
  documents: PropertyAgentDocumentBlueprint[];
  handoffs: PropertyAgentHandOffBlueprint[];
};

export const singaporeJourneyBlueprints: Record<SingaporeJourneyId, PropertyAgentJourneyBlueprint> = {
  buy: {
    label: "Buy a property",
    summary: "Source candidates, coordinate viewings, prepare a document checklist, and route authorised matters to the appropriate professionals.",
    tasks: [
      { title: "Confirm requirements, budget range, and property shortlist", category: "sourcing", ownerRole: "customer" },
      { title: "Prepare a viewing-request draft for shortlisted properties", category: "appointment", ownerRole: "system", requiresAuthorization: true },
      { title: "Collect the buyer’s document checklist", category: "paperwork", ownerRole: "customer" },
      { title: "Prepare a non-binding offer and Option-to-Purchase discussion pack", category: "paperwork", ownerRole: "agent", requiresAuthorization: true },
      { title: "Arrange conveyancing and document-review hand-off", category: "professional", ownerRole: "lawyer", requiresAuthorization: true },
      { title: "Track authorised agency and tax hand-off milestones", category: "government", ownerRole: "government", requiresAuthorization: true },
    ],
    documents: [
      { label: "Identity and contact checklist", category: "identity" },
      { label: "Financing or affordability evidence checklist", category: "financial" },
      { label: "Property shortlist and viewing notes", category: "property" },
      { label: "Offer / option discussion pack", category: "offer", requiresAuthorization: true },
    ],
    handoffs: [
      { destination: "lawyer", title: "Conveyancing lawyer review", purpose: "Review transaction documents and advise the customer through an appointed legal professional.", requiresAuthorization: true },
      { destination: "hdb", title: "HDB pathway check", purpose: "Prepare the required hand-off checklist where the selected property and parties use the HDB route.", requiresAuthorization: true },
      { destination: "iras", title: "Stamp duty readiness", purpose: "Prepare a reminder and document pack for the applicable tax and stamping process.", requiresAuthorization: true },
      { destination: "sla", title: "Title and registration hand-off", purpose: "Prepare the professional hand-off checklist for title or registration matters.", requiresAuthorization: true },
    ],
  },
  sell: {
    label: "Sell a property",
    summary: "Organise seller intake, prepare marketing and viewing coordination, and track authorised professional and agency hand-offs.",
    tasks: [
      { title: "Confirm seller objectives, property details, and sale readiness", category: "paperwork", ownerRole: "customer" },
      { title: "Prepare listing and owner-contact drafts", category: "communication", ownerRole: "system", requiresAuthorization: true },
      { title: "Coordinate viewing requests and availability", category: "appointment", ownerRole: "agent", requiresAuthorization: true },
      { title: "Prepare an offer comparison and document checklist", category: "paperwork", ownerRole: "agent", requiresAuthorization: true },
      { title: "Arrange conveyancing and authorised agency hand-offs", category: "professional", ownerRole: "lawyer", requiresAuthorization: true },
    ],
    documents: [
      { label: "Identity and seller contact checklist", category: "identity" },
      { label: "Property and ownership information checklist", category: "property" },
      { label: "Marketing and viewing brief", category: "other" },
      { label: "Offer comparison pack", category: "offer", requiresAuthorization: true },
    ],
    handoffs: [
      { destination: "licensed_agent", title: "Licensed-agent workflow review", purpose: "Route any regulated agency action to the appointed licensed professional.", requiresAuthorization: true },
      { destination: "lawyer", title: "Seller conveyancing review", purpose: "Prepare the seller’s document pack for appointed legal review.", requiresAuthorization: true },
      { destination: "hdb", title: "HDB seller pathway check", purpose: "Prepare the official-process checklist when the seller uses the HDB route.", requiresAuthorization: true },
      { destination: "iras", title: "Tax and stamping readiness", purpose: "Prepare the relevant tax and stamping hand-off checklist.", requiresAuthorization: true },
    ],
  },
  rent: {
    label: "Rent a property",
    summary: "Source suitable properties, coordinate viewings, organise tenant documents, and prepare an authorised tenancy hand-off workflow.",
    tasks: [
      { title: "Confirm rental brief, budget, household, and move-in window", category: "sourcing", ownerRole: "customer" },
      { title: "Prepare viewing-request drafts for shortlisted homes", category: "appointment", ownerRole: "system", requiresAuthorization: true },
      { title: "Collect tenant document checklist", category: "paperwork", ownerRole: "customer" },
      { title: "Prepare a non-binding letter-of-intent discussion pack", category: "paperwork", ownerRole: "agent", requiresAuthorization: true },
      { title: "Track tenancy-document professional review and stamping readiness", category: "professional", ownerRole: "lawyer", requiresAuthorization: true },
    ],
    documents: [
      { label: "Identity and tenant contact checklist", category: "identity" },
      { label: "Affordability and supporting-document checklist", category: "financial" },
      { label: "Rental shortlist and viewing notes", category: "property" },
      { label: "Tenancy discussion pack", category: "tenancy", requiresAuthorization: true },
    ],
    handoffs: [
      { destination: "licensed_agent", title: "Licensed-agent tenancy review", purpose: "Route regulated agency work to the appointed licensed professional.", requiresAuthorization: true },
      { destination: "lawyer", title: "Tenancy legal review", purpose: "Prepare an appointed-lawyer review pack if legal review is requested or required.", requiresAuthorization: true },
      { destination: "iras", title: "Tenancy stamping readiness", purpose: "Prepare the applicable stamping reminder and document checklist.", requiresAuthorization: true },
    ],
  },
  rent_out: {
    label: "Lease out a property",
    summary: "Prepare landlord intake, listing and viewing coordination, tenant comparison, and authorised tenancy workflow hand-offs.",
    tasks: [
      { title: "Confirm landlord objectives, property readiness, and tenant criteria", category: "paperwork", ownerRole: "customer" },
      { title: "Prepare listing and viewing coordination drafts", category: "communication", ownerRole: "system", requiresAuthorization: true },
      { title: "Coordinate proposed viewings with the owner", category: "appointment", ownerRole: "agent", requiresAuthorization: true },
      { title: "Prepare tenant comparison and tenancy discussion checklist", category: "paperwork", ownerRole: "agent", requiresAuthorization: true },
      { title: "Track professional tenancy review and stamping readiness", category: "professional", ownerRole: "lawyer", requiresAuthorization: true },
    ],
    documents: [
      { label: "Landlord identity and contact checklist", category: "identity" },
      { label: "Property and listing readiness checklist", category: "property" },
      { label: "Tenant comparison record", category: "other", requiresAuthorization: true },
      { label: "Tenancy agreement discussion pack", category: "tenancy", requiresAuthorization: true },
    ],
    handoffs: [
      { destination: "licensed_agent", title: "Licensed-agent tenancy review", purpose: "Route regulated agency work to the appointed licensed professional.", requiresAuthorization: true },
      { destination: "lawyer", title: "Landlord tenancy legal review", purpose: "Prepare an appointed-lawyer review pack if legal review is requested or required.", requiresAuthorization: true },
      { destination: "iras", title: "Tenancy stamping readiness", purpose: "Prepare the applicable stamping reminder and document checklist.", requiresAuthorization: true },
    ],
  },
};

export const propertyAgentSafeguardNotice = "UrbanKey prepares and tracks workflow material only. It does not provide legal, tax, financial, eligibility, licensing, or regulatory advice; make binding offers; accept terms; send external communications; transfer funds; or submit documents to a government agency, lawyer, bank, owner, or other party without the customer’s explicit authorisation and the appropriate professional review.";
