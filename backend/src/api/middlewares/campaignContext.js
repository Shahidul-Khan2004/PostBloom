import { query } from "../../config/db.js";
import BackendError from "../../lib/BackendError.js";
import * as memberRepo from "../../repositories/workspaceMemberRepository.js";

export async function loadCampaignWorkspace(req, res, next) {
  const campaignUuid = req.params.campaignId;
  const { rows } = await query(
    `SELECT w.public_uuid, w.id AS workspace_id FROM campaigns c
     JOIN workspaces w ON w.id = c.workspace_id
     WHERE c.public_uuid = $1`,
    [campaignUuid]
  );
  if (!rows[0]) {
    return next(new BackendError(404, "NOT_FOUND", "Campaign not found"));
  }
  req.params.workspaceId = rows[0].public_uuid;
  req.workspaceId = rows[0].workspace_id;
  next();
}

export async function loadDeliverableWorkspace(req, res, next) {
  const deliverableUuid = req.params.deliverableId;
  const { rows } = await query(
    `SELECT w.public_uuid, w.id AS workspace_id FROM deliverables d
     JOIN campaigns c ON c.id = d.campaign_id
     JOIN workspaces w ON w.id = c.workspace_id
     WHERE d.public_uuid = $1`,
    [deliverableUuid]
  );
  if (!rows[0]) {
    return next(new BackendError(404, "NOT_FOUND", "Deliverable not found"));
  }
  req.params.workspaceId = rows[0].public_uuid;
  req.workspaceId = rows[0].workspace_id;
  next();
}

function attachCampaignAuthz(req, membership) {
  req.workspace = membership.workspace;
  req.authz = {
    role: membership.roleCode,
    accountRole: membership.accountRole,
    permissions: membership.permissions,
  };
}

export function requireCampaignPermission(...codes) {
  return async (req, res, next) => {
    const membership = await memberRepo.findMembershipWithPermissions(
      req.actorUserId,
      req.params.workspaceId
    );
    if (!membership) {
      return next(new BackendError(403, "FORBIDDEN", "Not a workspace member"));
    }
    const hasAll = codes.every((c) => membership.permissions.includes(c));
    if (!hasAll) {
      return next(new BackendError(403, "FORBIDDEN", "Insufficient permissions"));
    }
    attachCampaignAuthz(req, membership);
    next();
  };
}

/** Requires at least one of the given permission codes. */
export function requireCampaignPermissionAny(...codes) {
  return async (req, res, next) => {
    const membership = await memberRepo.findMembershipWithPermissions(
      req.actorUserId,
      req.params.workspaceId
    );
    if (!membership) {
      return next(new BackendError(403, "FORBIDDEN", "Not a workspace member"));
    }
    const hasAny = codes.some((c) => membership.permissions.includes(c));
    if (!hasAny) {
      return next(new BackendError(403, "FORBIDDEN", "Insufficient permissions"));
    }
    attachCampaignAuthz(req, membership);
    next();
  };
}
