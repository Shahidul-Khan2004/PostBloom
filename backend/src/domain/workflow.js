import BackendError from "../lib/BackendError.js";

const CAMPAIGN_TRANSITIONS = {
  draft: ["active", "cancelled"],
  active: ["in_review", "cancelled"],
  in_review: ["partially_approved", "active", "cancelled"],
  partially_approved: ["ready_to_publish", "in_review", "cancelled"],
  ready_to_publish: ["completed", "in_review"],
  completed: [],
  cancelled: [],
};

const DELIVERABLE_TRANSITIONS = {
  assigned: ["in_progress"],
  in_progress: ["submitted_for_review"],
  submitted_for_review: ["revision_requested", "approved"],
  revision_requested: ["in_progress"],
  approved: ["ready_to_publish"],
  ready_to_publish: [],
};

export function assertCampaignTransition(fromCode, toCode) {
  const allowed = CAMPAIGN_TRANSITIONS[fromCode] ?? [];
  if (!allowed.includes(toCode)) {
    throw new BackendError(
      422,
      "INVALID_TRANSITION",
      `Cannot transition campaign from ${fromCode} to ${toCode}`
    );
  }
}

export function assertDeliverableTransition(fromCode, toCode) {
  const allowed = DELIVERABLE_TRANSITIONS[fromCode] ?? [];
  if (!allowed.includes(toCode)) {
    throw new BackendError(
      422,
      "INVALID_TRANSITION",
      `Cannot transition deliverable from ${fromCode} to ${toCode}`
    );
  }
}

export function deriveCampaignStatusFromDeliverables(deliverableStatusCodes) {
  if (deliverableStatusCodes.length === 0) return null;
  if (deliverableStatusCodes.every((s) => s === "ready_to_publish")) {
    return "ready_to_publish";
  }
  if (deliverableStatusCodes.some((s) => s === "revision_requested")) {
    return "in_review";
  }
  if (deliverableStatusCodes.some((s) => s === "submitted_for_review")) {
    return "in_review";
  }
  if (deliverableStatusCodes.every((s) => s === "approved" || s === "ready_to_publish")) {
    return "partially_approved";
  }
  return "active";
}
