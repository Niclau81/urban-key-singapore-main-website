export type VirtualTourRoom = {
  id: string;
  label: string;
  imageIndex: number;
  note: string;
  approvedHighlights: string[];
  floorPlanPosition: { x: number; y: number };
};

export type VirtualPropertyTour = {
  badgeLabel: string;
  disclosure: string;
  rooms: VirtualTourRoom[];
  aiGuide: {
    enabled: boolean;
    intro: string;
  };
  privacyReview: {
    automatedRedactionRequired: true;
    manualReviewRequired: true;
    protectedTargets: string[];
    status: "demo-review-required" | "reviewed";
  };
  analytics: {
    scope: "on-device";
    events: ("tour_opened" | "room_visited" | "appointment_intent")[];
  };
};
