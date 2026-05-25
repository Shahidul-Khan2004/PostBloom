import { getPool } from "../config/db.js";
import BackendError from "../lib/BackendError.js";
import { isSpecialist } from "../domain/permissions.js";
import {
  specialistRoleForPlatform,
  isStaffRequestRole,
} from "../domain/deliverableRoles.js";
import * as campaignRepo from "../repositories/campaignRepository.js";
import * as memberRepo from "../repositories/workspaceMemberRepository.js";
import * as staffingRepo from "../repositories/staffingRepository.js";
import * as notificationRepo from "../repositories/notificationRepository.js";
import * as auditRepo from "../repositories/auditRepository.js";

async function broadcastStaffRequestOpen(specialists, payload) {
  for (const specialist of specialists) {
    await notificationRepo.create({
      userId: specialist.id,
      type: "staff_request_open",
      payload,
    });
  }
}

function resolveStaffRole(deliverable, roleCodeInput) {
  if (roleCodeInput) return roleCodeInput;
  return specialistRoleForPlatform(deliverable.platform_code);
}

function assertRoleAllowed(roleCode) {
  if (!isStaffRequestRole(roleCode)) {
    throw new BackendError(
      422,
      "INVALID_ROLE",
      "roleCode must be writer, designer, or reviewer (writer/designer default from platform template)"
    );
  }
}

function assertSlotAvailable(deliverable, roleCode) {
  const filled =
    (roleCode === "writer" && deliverable.assignee_id) ||
    (roleCode === "designer" && deliverable.designer_id) ||
    (roleCode === "reviewer" && deliverable.reviewer_id);
  if (filled) {
    throw new BackendError(409, "ROLE_FILLED", `${roleCode} is already assigned on this deliverable`);
  }
}

export async function createDeliverableStaffRequest(
  workspaceId,
  deliverablePublicUuid,
  actorUserId,
  { roleCode: roleCodeInput }
) {
  const deliverable = await campaignRepo.findDeliverableByPublicUuid(
    deliverablePublicUuid,
    workspaceId
  );
  if (!deliverable) throw new BackendError(404, "NOT_FOUND", "Deliverable not found");

  const campaign = await campaignRepo.findCampaignByPublicUuid(
    deliverable.campaign_public_uuid,
    workspaceId
  );
  if (!campaign) throw new BackendError(404, "NOT_FOUND", "Campaign not found");
  if (campaign.status_code !== "active") {
    throw new BackendError(422, "INVALID_STATE", "Staff requests require an active campaign");
  }

  const roleCode = resolveStaffRole(deliverable, roleCodeInput);
  assertRoleAllowed(roleCode);
  if (!roleCodeInput && roleCode === null) {
    throw new BackendError(
      422,
      "INVALID_ROLE",
      "Could not determine specialist role for this platform; pass roleCode writer, designer, or reviewer"
    );
  }
  assertSlotAvailable(deliverable, roleCode);

  const existing = await staffingRepo.findDeliverableStaffRequestByDeliverableAndRole(
    deliverable.id,
    roleCode
  );
  if (existing) {
    if (existing.status === "pending") {
      throw new BackendError(409, "REQUEST_EXISTS", `A pending ${roleCode} request already exists`);
    }
    if (existing.status === "accepted") {
      throw new BackendError(409, "ROLE_FILLED", `${roleCode} slot is already filled`);
    }
  }

  const specialists = await staffingRepo.listSpecialistsByRoleGlobally(roleCode);
  if (specialists.length === 0) {
    throw new BackendError(422, "NO_SPECIALISTS", `No ${roleCode} specialists on the platform to notify`);
  }

  const request = existing?.status === "cancelled"
    ? await staffingRepo.reopenDeliverableStaffRequest(existing.id, actorUserId)
    : await staffingRepo.createDeliverableStaffRequest({
        deliverableId: deliverable.id,
        roleCode,
        requestedBy: actorUserId,
      });

  await broadcastStaffRequestOpen(specialists, {
    requestPublicUuid: request.public_uuid,
    campaignPublicUuid: campaign.public_uuid,
    campaignName: campaign.name,
    deliverablePublicUuid: deliverable.public_uuid,
    deliverableTitle: deliverable.title,
    roleCode,
    requestScope: "deliverable",
  });

  await auditRepo.record({
    workspaceId,
    actorId: actorUserId,
    entityType: "deliverable_staff_request",
    entityPublicUuid: request.public_uuid,
    action: "created",
    metadata: {
      roleCode,
      deliverablePublicUuid: deliverable.public_uuid,
      campaignPublicUuid: campaign.public_uuid,
    },
  });

  const full = await staffingRepo.findDeliverableStaffRequestByPublicUuid(request.public_uuid);
  return staffingRepo.mapStaffRequest(full);
}

/** All deliverable-level staff requests for a campaign (platform-wide broadcast; accept-only assignment). */
export async function listStaffRequests(workspaceId, campaignPublicUuid) {
  const campaign = await campaignRepo.findCampaignByPublicUuid(campaignPublicUuid, workspaceId);
  if (!campaign) throw new BackendError(404, "NOT_FOUND", "Campaign not found");
  const rows = await staffingRepo.listDeliverableStaffRequestsForCampaign(campaign.id);
  return rows.map(staffingRepo.mapStaffRequest);
}

export async function listDeliverableStaffRequests(workspaceId, deliverablePublicUuid) {
  const deliverable = await campaignRepo.findDeliverableByPublicUuid(
    deliverablePublicUuid,
    workspaceId
  );
  if (!deliverable) throw new BackendError(404, "NOT_FOUND", "Deliverable not found");
  const rows = await staffingRepo.listDeliverableStaffRequests(deliverable.id);
  return rows.map(staffingRepo.mapStaffRequest);
}

export async function cancelDeliverableStaffRequest(
  workspaceId,
  deliverablePublicUuid,
  roleCode
) {
  if (!isStaffRequestRole(roleCode)) {
    throw new BackendError(422, "INVALID_ROLE", "roleCode must be writer, designer, or reviewer");
  }
  const deliverable = await campaignRepo.findDeliverableByPublicUuid(
    deliverablePublicUuid,
    workspaceId
  );
  if (!deliverable) throw new BackendError(404, "NOT_FOUND", "Deliverable not found");

  const cancelled = await staffingRepo.cancelDeliverableStaffRequest(deliverable.id, roleCode);
  if (!cancelled) {
    throw new BackendError(404, "NOT_FOUND", "No pending request for this role");
  }
  return staffingRepo.mapStaffRequest(
    await staffingRepo.findDeliverableStaffRequestByPublicUuid(cancelled.public_uuid)
  );
}

export async function listSpecialistInbox(actorUserId, accountRole, { status = "pending" } = {}) {
  if (!isSpecialist(accountRole)) {
    throw new BackendError(403, "FORBIDDEN", "Specialist account required");
  }
  if (status !== "pending") {
    throw new BackendError(422, "INVALID_STATUS", "Only status=pending is supported");
  }
  const rows = await staffingRepo.listPendingInboxForSpecialist(accountRole);
  return rows.map(staffingRepo.mapStaffRequest);
}

export async function acceptStaffRequest(requestPublicUuid, actorUserId, accountRole) {
  if (!isSpecialist(accountRole)) {
    throw new BackendError(403, "FORBIDDEN", "Specialist account required");
  }

  const deliverableRequest =
    await staffingRepo.findDeliverableStaffRequestByPublicUuid(requestPublicUuid);
  if (!deliverableRequest) {
    throw new BackendError(404, "NOT_FOUND", "Staff request not found");
  }

  return acceptDeliverableStaffRequest(
    deliverableRequest,
    requestPublicUuid,
    actorUserId,
    accountRole
  );
}

async function acceptDeliverableStaffRequest(
  request,
  requestPublicUuid,
  actorUserId,
  accountRole
) {
  if (request.role_code !== accountRole) {
    throw new BackendError(403, "FORBIDDEN", `Only ${request.role_code} specialists can accept this request`);
  }
  if (request.status !== "pending") {
    throw new BackendError(409, "CONFLICT", "This request is no longer open");
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const locked = await staffingRepo.findDeliverableStaffRequestForUpdate(
      client,
      requestPublicUuid
    );
    if (!locked || locked.status !== "pending") {
      throw new BackendError(409, "CONFLICT", "Request was already accepted");
    }

    const accepted = await staffingRepo.acceptDeliverableStaffRequestInTransaction(
      client,
      locked.id,
      actorUserId
    );
    if (!accepted) {
      throw new BackendError(409, "CONFLICT", "Request was already accepted");
    }

    await memberRepo.ensureActiveMember(actorUserId, locked.workspace_id);

    await staffingRepo.insertParticipantInTransaction(client, {
      campaignId: locked.campaign_id,
      userId: actorUserId,
      roleCode: locked.role_code,
      requestId: null,
    });

    await campaignRepo.assignDeliverableRole(
      locked.deliverable_id,
      locked.role_code,
      actorUserId,
      client
    );
    if (locked.role_code === "writer" || locked.role_code === "designer") {
      await campaignRepo.startDeliverableIfAssigned(locked.deliverable_id, actorUserId, client);
    }

    await client.query("COMMIT");

    await notificationRepo.create({
      userId: actorUserId,
      type: "deliverable_assigned",
      payload: {
        deliverablePublicUuid: locked.deliverable_public_uuid,
        campaignPublicUuid: locked.campaign_public_uuid,
        roleCode: locked.role_code,
      },
    });

    if (locked.created_by) {
      await notificationRepo.create({
        userId: locked.created_by,
        type: "staff_request_accepted",
        payload: {
          requestPublicUuid,
          campaignPublicUuid: locked.campaign_public_uuid,
          deliverablePublicUuid: locked.deliverable_public_uuid,
          roleCode: locked.role_code,
          requestScope: "deliverable",
        },
      });
    }

    await auditRepo.record({
      workspaceId: locked.workspace_id,
      actorId: actorUserId,
      entityType: "deliverable_staff_request",
      entityPublicUuid: requestPublicUuid,
      action: "accepted",
      metadata: {
        roleCode: locked.role_code,
        deliverablePublicUuid: locked.deliverable_public_uuid,
        campaignPublicUuid: locked.campaign_public_uuid,
      },
    });

    const full = await staffingRepo.findDeliverableStaffRequestByPublicUuid(requestPublicUuid);
    return staffingRepo.mapStaffRequest(full);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
