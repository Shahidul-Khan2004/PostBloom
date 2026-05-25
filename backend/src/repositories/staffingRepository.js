import { query } from "../config/db.js";

const STAFF_REQUEST_ROLES = ["writer", "designer", "reviewer"];

export function mapStaffRequest(row) {
  if (!row) return null;
  return {
    publicUuid: row.public_uuid,
    requestScope: row.request_scope ?? (row.deliverable_id ? "deliverable" : "campaign"),
    campaignPublicUuid: row.campaign_public_uuid,
    campaignName: row.campaign_name,
    deliverablePublicUuid: row.deliverable_public_uuid ?? null,
    deliverableTitle: row.deliverable_title ?? null,
    workspacePublicUuid: row.workspace_public_uuid,
    roleCode: row.role_code,
    status: row.status,
    requestedByName: row.requested_by_name,
    acceptedByName: row.accepted_by_name,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  };
}

export async function createStaffRequest({ campaignId, roleCode, requestedBy }) {
  const { rows } = await query(
    `INSERT INTO campaign_staff_requests (campaign_id, role_code, requested_by)
     VALUES ($1, $2, $3) RETURNING *`,
    [campaignId, roleCode, requestedBy]
  );
  return rows[0];
}

export async function createDeliverableStaffRequest({ deliverableId, roleCode, requestedBy }) {
  const { rows } = await query(
    `INSERT INTO deliverable_staff_requests (deliverable_id, role_code, requested_by)
     VALUES ($1, $2, $3) RETURNING *`,
    [deliverableId, roleCode, requestedBy]
  );
  return rows[0];
}

export async function findStaffRequestByPublicUuid(publicUuid) {
  const { rows } = await query(
    `SELECT csr.*, c.public_uuid AS campaign_public_uuid, c.name AS campaign_name,
            c.workspace_id, w.public_uuid AS workspace_public_uuid,
            u1.display_name AS requested_by_name, u2.display_name AS accepted_by_name,
            'campaign' AS request_scope
     FROM campaign_staff_requests csr
     JOIN campaigns c ON c.id = csr.campaign_id
     JOIN workspaces w ON w.id = c.workspace_id
     LEFT JOIN users u1 ON u1.id = csr.requested_by
     LEFT JOIN users u2 ON u2.id = csr.accepted_by
     WHERE csr.public_uuid = $1`,
    [publicUuid]
  );
  return rows[0];
}

export async function findDeliverableStaffRequestByPublicUuid(publicUuid) {
  const { rows } = await query(
    `SELECT dsr.*, d.public_uuid AS deliverable_public_uuid, d.title AS deliverable_title,
            d.campaign_id, c.public_uuid AS campaign_public_uuid, c.name AS campaign_name,
            c.workspace_id, c.created_by, w.public_uuid AS workspace_public_uuid,
            u1.display_name AS requested_by_name, u2.display_name AS accepted_by_name,
            'deliverable' AS request_scope
     FROM deliverable_staff_requests dsr
     JOIN deliverables d ON d.id = dsr.deliverable_id
     JOIN campaigns c ON c.id = d.campaign_id
     JOIN workspaces w ON w.id = c.workspace_id
     LEFT JOIN users u1 ON u1.id = dsr.requested_by
     LEFT JOIN users u2 ON u2.id = dsr.accepted_by
     WHERE dsr.public_uuid = $1`,
    [publicUuid]
  );
  return rows[0];
}

export async function findStaffRequestForUpdate(client, publicUuid) {
  const { rows } = await client.query(
    `SELECT csr.*, c.public_uuid AS campaign_public_uuid, c.workspace_id, c.created_by,
            'campaign' AS request_scope
     FROM campaign_staff_requests csr
     JOIN campaigns c ON c.id = csr.campaign_id
     WHERE csr.public_uuid = $1
     FOR UPDATE OF csr`,
    [publicUuid]
  );
  return rows[0];
}

export async function findDeliverableStaffRequestForUpdate(client, publicUuid) {
  const { rows } = await client.query(
    `SELECT dsr.*, d.public_uuid AS deliverable_public_uuid, d.title AS deliverable_title,
            d.campaign_id, c.public_uuid AS campaign_public_uuid, c.workspace_id, c.created_by,
            'deliverable' AS request_scope
     FROM deliverable_staff_requests dsr
     JOIN deliverables d ON d.id = dsr.deliverable_id
     JOIN campaigns c ON c.id = d.campaign_id
     WHERE dsr.public_uuid = $1
     FOR UPDATE OF dsr`,
    [publicUuid]
  );
  return rows[0];
}

export async function listStaffRequestsForCampaign(campaignId) {
  const { rows } = await query(
    `SELECT csr.*, c.public_uuid AS campaign_public_uuid, c.name AS campaign_name,
            w.public_uuid AS workspace_public_uuid,
            u1.display_name AS requested_by_name, u2.display_name AS accepted_by_name,
            'campaign' AS request_scope
     FROM campaign_staff_requests csr
     JOIN campaigns c ON c.id = csr.campaign_id
     JOIN workspaces w ON w.id = c.workspace_id
     LEFT JOIN users u1 ON u1.id = csr.requested_by
     LEFT JOIN users u2 ON u2.id = csr.accepted_by
     WHERE csr.campaign_id = $1
     ORDER BY csr.role_code`,
    [campaignId]
  );
  return rows;
}

export async function listDeliverableStaffRequestsForCampaign(campaignId) {
  const { rows } = await query(
    `SELECT dsr.*, d.public_uuid AS deliverable_public_uuid, d.title AS deliverable_title,
            c.public_uuid AS campaign_public_uuid, c.name AS campaign_name,
            w.public_uuid AS workspace_public_uuid,
            u1.display_name AS requested_by_name, u2.display_name AS accepted_by_name,
            'deliverable' AS request_scope
     FROM deliverable_staff_requests dsr
     JOIN deliverables d ON d.id = dsr.deliverable_id
     JOIN campaigns c ON c.id = d.campaign_id
     JOIN workspaces w ON w.id = c.workspace_id
     LEFT JOIN users u1 ON u1.id = dsr.requested_by
     LEFT JOIN users u2 ON u2.id = dsr.accepted_by
     WHERE d.campaign_id = $1
     ORDER BY d.id, dsr.role_code`,
    [campaignId]
  );
  return rows;
}

export async function listDeliverableStaffRequests(deliverableId) {
  const { rows } = await query(
    `SELECT dsr.*, d.public_uuid AS deliverable_public_uuid, d.title AS deliverable_title,
            c.public_uuid AS campaign_public_uuid, c.name AS campaign_name,
            w.public_uuid AS workspace_public_uuid,
            u1.display_name AS requested_by_name, u2.display_name AS accepted_by_name,
            'deliverable' AS request_scope
     FROM deliverable_staff_requests dsr
     JOIN deliverables d ON d.id = dsr.deliverable_id
     JOIN campaigns c ON c.id = d.campaign_id
     JOIN workspaces w ON w.id = c.workspace_id
     LEFT JOIN users u1 ON u1.id = dsr.requested_by
     LEFT JOIN users u2 ON u2.id = dsr.accepted_by
     WHERE dsr.deliverable_id = $1
     ORDER BY dsr.role_code`,
    [deliverableId]
  );
  return rows;
}

export async function findStaffRequestByCampaignAndRole(campaignId, roleCode) {
  const { rows } = await query(
    `SELECT * FROM campaign_staff_requests WHERE campaign_id = $1 AND role_code = $2`,
    [campaignId, roleCode]
  );
  return rows[0];
}

export async function findDeliverableStaffRequestByDeliverableAndRole(deliverableId, roleCode) {
  const { rows } = await query(
    `SELECT * FROM deliverable_staff_requests WHERE deliverable_id = $1 AND role_code = $2`,
    [deliverableId, roleCode]
  );
  return rows[0];
}

export async function listPendingInboxForSpecialist(accountRole) {
  if (!STAFF_REQUEST_ROLES.includes(accountRole)) return [];

  const { rows } = await query(
    `SELECT dsr.*, d.public_uuid AS deliverable_public_uuid, d.title AS deliverable_title,
            c.public_uuid AS campaign_public_uuid, c.name AS campaign_name,
            w.public_uuid AS workspace_public_uuid, w.name AS workspace_name,
            u1.display_name AS requested_by_name, 'deliverable' AS request_scope
     FROM deliverable_staff_requests dsr
     JOIN deliverables d ON d.id = dsr.deliverable_id
     JOIN campaigns c ON c.id = d.campaign_id
     JOIN workspaces w ON w.id = c.workspace_id
     LEFT JOIN users u1 ON u1.id = dsr.requested_by
     WHERE dsr.status = 'pending' AND dsr.role_code = $1
     ORDER BY dsr.created_at DESC`,
    [accountRole]
  );
  return rows;
}

export async function listSpecialistsByRoleGlobally(roleCode) {
  const { rows } = await query(
    `SELECT id, public_uuid, email, display_name
     FROM users
     WHERE account_role = $1
     ORDER BY display_name`,
    [roleCode]
  );
  return rows;
}

export async function hasAcceptedCampaignReviewer(campaignId) {
  const { rows } = await query(
    `SELECT 1 FROM campaign_staff_requests
     WHERE campaign_id = $1 AND role_code = 'reviewer' AND status = 'accepted'
     LIMIT 1`,
    [campaignId]
  );
  return Boolean(rows[0]);
}

export async function acceptStaffRequestInTransaction(client, requestId, userId) {
  const { rows } = await client.query(
    `UPDATE campaign_staff_requests
     SET status = 'accepted', accepted_by = $2, accepted_at = NOW()
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [requestId, userId]
  );
  return rows[0];
}

export async function acceptDeliverableStaffRequestInTransaction(client, requestId, userId) {
  const { rows } = await client.query(
    `UPDATE deliverable_staff_requests
     SET status = 'accepted', accepted_by = $2, accepted_at = NOW()
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [requestId, userId]
  );
  return rows[0];
}

export async function insertParticipantInTransaction(client, { campaignId, userId, roleCode, requestId }) {
  const { rows } = await client.query(
    `INSERT INTO campaign_participants (campaign_id, user_id, role_code, request_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (campaign_id, user_id, role_code) DO NOTHING
     RETURNING *`,
    [campaignId, userId, roleCode, requestId]
  );
  return rows[0];
}

export async function reopenStaffRequest(requestId, requestedBy) {
  const { rows } = await query(
    `UPDATE campaign_staff_requests
     SET status = 'pending', requested_by = $2, accepted_by = NULL, accepted_at = NULL
     WHERE id = $1 AND status = 'cancelled'
     RETURNING *`,
    [requestId, requestedBy]
  );
  return rows[0];
}

export async function reopenDeliverableStaffRequest(requestId, requestedBy) {
  const { rows } = await query(
    `UPDATE deliverable_staff_requests
     SET status = 'pending', requested_by = $2, accepted_by = NULL, accepted_at = NULL
     WHERE id = $1 AND status = 'cancelled'
     RETURNING *`,
    [requestId, requestedBy]
  );
  return rows[0];
}

export async function cancelStaffRequest(campaignId, roleCode) {
  const { rows } = await query(
    `UPDATE campaign_staff_requests
     SET status = 'cancelled'
     WHERE campaign_id = $1 AND role_code = $2 AND status = 'pending'
     RETURNING *`,
    [campaignId, roleCode]
  );
  return rows[0];
}

export async function cancelDeliverableStaffRequest(deliverableId, roleCode) {
  const { rows } = await query(
    `UPDATE deliverable_staff_requests
     SET status = 'cancelled'
     WHERE deliverable_id = $1 AND role_code = $2 AND status = 'pending'
     RETURNING *`,
    [deliverableId, roleCode]
  );
  return rows[0];
}
