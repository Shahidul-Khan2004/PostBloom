import BackendError from "../lib/BackendError.js";
import { PERMISSIONS, permissionsForAccountRole } from "../domain/permissions.js";
import {
  assertCampaignTransition,
  assertDeliverableTransition,
  deriveCampaignStatusFromDeliverables,
} from "../domain/workflow.js";
import {
  validateDesignerSubmission,
  validateWriterPayload,
  validateWriterSubmission,
} from "../domain/deliverablePayload.js";
import * as campaignRepo from "../repositories/campaignRepository.js";
import * as analyticsRepo from "../repositories/analyticsRepository.js";
import * as userRepo from "../repositories/userRepository.js";
import * as auditRepo from "../repositories/auditRepository.js";
import * as notificationRepo from "../repositories/notificationRepository.js";

export async function createCampaign(workspaceId, actorUserId, data) {
  const hasImport = await analyticsRepo.hasCompletedImport(workspaceId);
  if (!hasImport) {
    throw new BackendError(
      422,
      "WORKSPACE_NOT_READY",
      "Import LinkedIn analytics before creating a campaign"
    );
  }

  const sourcePostId = await campaignRepo.findSourcePostIdByPublicUuid(
    data.opportunityUuid,
    workspaceId
  );

  const activeStatusId = await campaignRepo.getStatusId("active");
  const assignedStatusId = await campaignRepo.getStatusId("assigned", "deliverable_statuses");

  const campaign = await campaignRepo.createCampaign({
    workspaceId,
    sourcePostId,
    name: data.name,
    statusId: activeStatusId,
    createdBy: actorUserId,
  });

  await campaignRepo.insertCampaignStatusHistory(
    campaign.id,
    null,
    activeStatusId,
    actorUserId,
    "Campaign created"
  );

  const deliverables = [];
  for (const platformCode of data.platformCodes) {
    const platform = await campaignRepo.findPlatformByCode(platformCode);
    if (!platform) throw new BackendError(422, "INVALID_PLATFORM", `Unknown platform: ${platformCode}`);

    const d = await campaignRepo.createDeliverable({
      campaignId: campaign.id,
      platformTypeId: platform.id,
      title: `${platform.name} — ${data.name}`,
      assigneeId: null,
      reviewerId: null,
      designerId: null,
      statusId: assignedStatusId,
      dueDate: data.dueDate ?? null,
    });
    deliverables.push(d);
  }

  await auditRepo.record({
    workspaceId,
    actorId: actorUserId,
    entityType: "campaign",
    entityId: campaign.id,
    entityPublicUuid: campaign.public_uuid,
    action: "created",
    metadata: { platformCodes: data.platformCodes },
  });

  return { campaign, deliverables };
}

export async function getCampaign(workspaceId, publicUuid) {
  const c = await campaignRepo.findCampaignByPublicUuid(publicUuid, workspaceId);
  if (!c) throw new BackendError(404, "NOT_FOUND", "Campaign not found");
  const deliverables = await campaignRepo.listDeliverables(c.id);
  return {
    publicUuid: c.public_uuid,
    name: c.name,
    statusCode: c.status_code,
    statusName: c.status_name,
    opportunityUuid: c.source_post_public_uuid,
    enrichmentTitle: c.enrichment_title,
    createdAt: c.created_at,
    deliverables: deliverables.map(mapDeliverable),
  };
}

export async function listCampaigns(workspaceId) {
  const rows = await campaignRepo.listCampaigns(workspaceId);
  return rows.map((r) => ({
    publicUuid: r.public_uuid,
    name: r.name,
    statusCode: r.status_code,
    statusName: r.status_name,
    enrichmentTitle: r.enrichment_title,
    createdAt: r.created_at,
  }));
}

export async function transitionCampaign(workspaceId, publicUuid, actorUserId, toCode, notes) {
  const c = await campaignRepo.findCampaignByPublicUuid(publicUuid, workspaceId);
  if (!c) throw new BackendError(404, "NOT_FOUND", "Campaign not found");

  assertCampaignTransition(c.status_code, toCode);
  const toId = await campaignRepo.getStatusId(toCode);
  const fromId = c.current_status_id;

  await campaignRepo.insertCampaignStatusHistory(c.id, fromId, toId, actorUserId, notes);
  await campaignRepo.updateCampaignStatus(c.id, toId);

  await auditRepo.record({
    workspaceId,
    actorId: actorUserId,
    entityType: "campaign",
    entityPublicUuid: publicUuid,
    action: "status_changed",
    metadata: { from: c.status_code, to: toCode },
  });

  return getCampaign(workspaceId, publicUuid);
}

export async function addDeliverable(workspaceId, campaignPublicUuid, actorUserId, data) {
  const campaign = await campaignRepo.findCampaignByPublicUuid(campaignPublicUuid, workspaceId);
  if (!campaign) throw new BackendError(404, "NOT_FOUND", "Campaign not found");
  if (campaign.status_code !== "active") {
    throw new BackendError(422, "INVALID_STATE", "Deliverables can only be added to active campaigns");
  }

  const platform = await campaignRepo.findPlatformByCode(data.platformCode);
  if (!platform) {
    throw new BackendError(422, "INVALID_PLATFORM", `Unknown platform: ${data.platformCode}`);
  }

  const assignedStatusId = await campaignRepo.getStatusId("assigned", "deliverable_statuses");
  const title = data.title ?? `${platform.name} — ${campaign.name}`;

  const deliverable = await campaignRepo.createDeliverable({
    campaignId: campaign.id,
    platformTypeId: platform.id,
    title,
    assigneeId: null,
    reviewerId: null,
    designerId: null,
    statusId: assignedStatusId,
    dueDate: data.dueDate ?? null,
  });

  await auditRepo.record({
    workspaceId,
    actorId: actorUserId,
    entityType: "deliverable",
    entityId: deliverable.id,
    entityPublicUuid: deliverable.public_uuid,
    action: "created",
    metadata: { platformCode: data.platformCode, campaignPublicUuid },
  });

  const rows = await campaignRepo.listDeliverables(campaign.id);
  const row = rows.find((r) => r.public_uuid === deliverable.public_uuid);
  if (!row) throw new BackendError(500, "INTERNAL", "Deliverable created but not found");
  return mapDeliverable(row);
}

async function transitionDeliverableToSubmitted(d, actorUserId) {
  const path =
    d.status_code === "assigned" || d.status_code === "revision_requested"
      ? ["in_progress", "submitted_for_review"]
      : d.status_code === "in_progress"
        ? ["submitted_for_review"]
        : [];

  let fromId = d.current_status_id;
  let statusCode = d.status_code;
  for (const toCode of path) {
    const toId = await campaignRepo.getStatusId(toCode, "deliverable_statuses");
    assertDeliverableTransition(statusCode, toCode);
    await campaignRepo.insertDeliverableStatusHistory(d.id, fromId, toId, actorUserId, null);
    await campaignRepo.updateDeliverableStatus(d.id, toId);
    fromId = toId;
    statusCode = toCode;
  }
}

export async function submitVersion(
  workspaceId,
  publicUuid,
  actorUserId,
  accountRole,
  { payload, externalUrl }
) {
  const d = await campaignRepo.findDeliverableByPublicUuid(publicUuid, workspaceId);
  if (!d) throw new BackendError(404, "NOT_FOUND", "Deliverable not found");

  const canSubmit =
    accountRole === "admin" ||
    (accountRole === "writer" && d.assignee_id === actorUserId) ||
    (accountRole === "designer" &&
      (d.designer_id === actorUserId ||
        (d.assignee_id === actorUserId && !d.designer_id)));
  if (!canSubmit) {
    throw new BackendError(403, "FORBIDDEN", "You are not assigned to submit this deliverable");
  }

  let versionPayload = payload ?? {};
  if (accountRole === "designer") {
    validateDesignerSubmission({ externalUrl, payload });
    versionPayload = { externalUrl };
  } else if (accountRole === "writer") {
    validateWriterSubmission({ externalUrl, payload });
    validateWriterPayload(d.field_schema, versionPayload);
  } else if (accountRole === "admin") {
    if (externalUrl) {
      versionPayload = { externalUrl, ...versionPayload };
    }
  } else {
    throw new BackendError(403, "FORBIDDEN", "Your account role cannot submit deliverables");
  }

  const versionNo = await campaignRepo.getNextVersionNo(d.id);
  const version = await campaignRepo.createVersion({
    deliverableId: d.id,
    versionNo,
    payload: versionPayload,
    submittedBy: actorUserId,
  });

  if (accountRole === "designer" && externalUrl) {
    await campaignRepo.createAsset({
      versionId: version.id,
      filePath: null,
      externalUrl,
      mimeType: "text/uri-list",
      uploadedBy: actorUserId,
    });
  }

  await transitionDeliverableToSubmitted(d, actorUserId);

  if (d.reviewer_id) {
    await notificationRepo.create({
      userId: d.reviewer_id,
      type: "deliverable_submitted",
      payload: { deliverablePublicUuid: publicUuid, versionNo },
    });
  }

  await syncCampaignStatus(d.campaign_id, workspaceId, actorUserId);

  return {
    publicUuid: version.public_uuid,
    versionNo,
    payload: version.payload,
    externalUrl: externalUrl ?? null,
  };
}

async function canReviewDeliverable(d, actorUserId, accountRole) {
  if (accountRole === "admin") return true;

  if (d.reviewer_id) {
    return d.reviewer_id === actorUserId;
  }

  if (accountRole === "reviewer") {
    return false;
  }

  return permissionsForAccountRole(accountRole).includes(PERMISSIONS.CAMPAIGN_CREATE);
}

export async function reviewDeliverable(
  workspaceId,
  publicUuid,
  actorUserId,
  accountRole,
  { action, notes }
) {
  const d = await campaignRepo.findDeliverableWithCampaign(publicUuid, workspaceId);
  if (!d) throw new BackendError(404, "NOT_FOUND", "Deliverable not found");

  const allowed = await canReviewDeliverable(d, actorUserId, accountRole);
  if (!allowed) {
    throw new BackendError(
      403,
      "FORBIDDEN",
      "Only the assigned reviewer or campaign owner (when no reviewer is assigned) can review"
    );
  }

  const toCode = action === "approve" ? "approved" : "revision_requested";
  assertDeliverableTransition(d.status_code, toCode);

  await campaignRepo.createReviewAction({
    deliverableId: d.id,
    actorId: actorUserId,
    action,
    notes,
  });

  const toId = await campaignRepo.getStatusId(toCode, "deliverable_statuses");
  await campaignRepo.insertDeliverableStatusHistory(d.id, d.current_status_id, toId, actorUserId, notes);
  await campaignRepo.updateDeliverableStatus(d.id, toId);

  if (action === "approve") {
    const readyId = await campaignRepo.getStatusId("ready_to_publish", "deliverable_statuses");
    await campaignRepo.insertDeliverableStatusHistory(d.id, toId, readyId, actorUserId, "Approved for publishing");
    await campaignRepo.updateDeliverableStatus(d.id, readyId);
  }

  if (d.assignee_id) {
    await notificationRepo.create({
      userId: d.assignee_id,
      type: action === "approve" ? "deliverable_approved" : "revision_requested",
      payload: { deliverablePublicUuid: publicUuid, notes },
    });
  }

  await syncCampaignStatus(d.campaign_id, workspaceId, actorUserId);

  return { statusCode: action === "approve" ? "ready_to_publish" : toCode };
}

async function syncCampaignStatus(campaignId, workspaceId, actorUserId) {
  const codes = await campaignRepo.getDeliverableStatusCodesForCampaign(campaignId);
  const derived = deriveCampaignStatusFromDeliverables(codes);
  if (!derived) return;

  const { query } = await import("../config/db.js");
  const { rows } = await query(
    `SELECT c.current_status_id, cs.code AS status_code FROM campaigns c
     JOIN campaign_statuses cs ON cs.id = c.current_status_id WHERE c.id = $1`,
    [campaignId]
  );
  const c = rows[0];
  if (!c || c.status_code === derived) return;

  try {
    assertCampaignTransition(c.status_code, derived);
    const toId = await campaignRepo.getStatusId(derived);
    await campaignRepo.insertCampaignStatusHistory(
      campaignId,
      c.current_status_id,
      toId,
      actorUserId,
      "Auto-synced from deliverables"
    );
    await campaignRepo.updateCampaignStatus(campaignId, toId);
  } catch {
    // ignore invalid auto transitions
  }
}

export async function listMyWork(actorUserId, workspaceId) {
  return campaignRepo.listDeliverablesForAssignee(actorUserId, workspaceId);
}

export async function listReviewQueue(workspaceId, actorUserId, accountRole) {
  const reviewerUserId = accountRole === "reviewer" ? actorUserId : null;
  return campaignRepo.listReviewQueue(workspaceId, reviewerUserId);
}

export async function listDeliverablesForCampaign(workspaceId, campaignPublicUuid) {
  const c = await campaignRepo.findCampaignByPublicUuid(campaignPublicUuid, workspaceId);
  if (!c) throw new BackendError(404, "NOT_FOUND", "Campaign not found");
  const rows = await campaignRepo.listDeliverables(c.id);
  return rows.map(mapDeliverable);
}

export async function getExportReady(workspaceId, campaignPublicUuid) {
  const c = await campaignRepo.findCampaignByPublicUuid(campaignPublicUuid, workspaceId);
  if (!c) throw new BackendError(404, "NOT_FOUND", "Campaign not found");
  const rows = await campaignRepo.getExportReadyDeliverables(c.id);
  return rows.map((r) => ({
    publicUuid: r.public_uuid,
    title: r.title,
    platformCode: r.platform_code,
    fieldSchema: r.field_schema,
    latestVersion: r.version_no,
    payload: r.payload,
  }));
}

export async function addComment(workspaceId, publicUuid, actorUserId, body) {
  const d = await campaignRepo.findDeliverableByPublicUuid(publicUuid, workspaceId);
  if (!d) throw new BackendError(404, "NOT_FOUND", "Deliverable not found");
  const comment = await campaignRepo.createComment(d.id, actorUserId, body);
  const author = await userRepo.findById(actorUserId);
  return {
    publicUuid: comment.public_uuid,
    body,
    authorName: author?.displayName,
    authorRole: author?.accountRole,
    createdAt: comment.created_at,
  };
}

export async function listComments(workspaceId, publicUuid) {
  const d = await campaignRepo.findDeliverableByPublicUuid(publicUuid, workspaceId);
  if (!d) throw new BackendError(404, "NOT_FOUND", "Deliverable not found");
  const rows = await campaignRepo.listComments(d.id);
  return rows.map((r) => ({
    publicUuid: r.public_uuid,
    body: r.body,
    authorName: r.author_name,
    authorRole: r.author_role,
    createdAt: r.created_at,
  }));
}

export async function listPlatformTypes() {
  const rows = await campaignRepo.listPlatformTypes();
  return rows.map((r) => ({
    code: r.code,
    name: r.name,
    fieldSchema: r.field_schema,
  }));
}

function mapDeliverable(r) {
  return {
    publicUuid: r.public_uuid,
    title: r.title,
    statusCode: r.status_code,
    platformCode: r.platform_code,
    platformName: r.platform_name,
    assigneeName: r.assignee_name,
    reviewerName: r.reviewer_name,
    designerName: r.designer_name,
    dueDate: r.due_date,
  };
}
