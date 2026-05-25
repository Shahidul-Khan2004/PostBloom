import { query } from "../config/db.js";
import BackendError from "../lib/BackendError.js";

export async function getStatusId(code, table = "campaign_statuses") {
  const { rows } = await query(`SELECT id FROM ${table} WHERE code = $1`, [code]);
  return rows[0]?.id;
}

export async function createCampaign(data) {
  const { rows } = await query(
    `INSERT INTO campaigns (workspace_id, source_post_id, name, current_status_id, created_by)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [data.workspaceId, data.sourcePostId, data.name, data.statusId, data.createdBy]
  );
  return rows[0];
}

export async function insertCampaignStatusHistory(campaignId, fromId, toId, changedBy, notes) {
  await query(
    `INSERT INTO campaign_status_history (campaign_id, from_status_id, to_status_id, changed_by, notes)
     VALUES ($1,$2,$3,$4,$5)`,
    [campaignId, fromId, toId, changedBy, notes]
  );
}

export async function updateCampaignStatus(campaignId, statusId) {
  await query(`UPDATE campaigns SET current_status_id = $2, updated_at = NOW() WHERE id = $1`, [
    campaignId,
    statusId,
  ]);
}

export async function findCampaignByPublicUuid(publicUuid, workspaceId) {
  const { rows } = await query(
    `SELECT c.*, cs.code AS status_code, cs.name AS status_name,
            sp.public_uuid AS source_post_public_uuid, sp.enrichment_title
     FROM campaigns c
     JOIN campaign_statuses cs ON cs.id = c.current_status_id
     JOIN source_posts sp ON sp.id = c.source_post_id
     WHERE c.public_uuid = $1 AND c.workspace_id = $2`,
    [publicUuid, workspaceId]
  );
  return rows[0];
}

export async function listCampaigns(workspaceId) {
  const { rows } = await query(
    `SELECT c.public_uuid, c.name, cs.code AS status_code, cs.name AS status_name,
            sp.enrichment_title, c.created_at
     FROM campaigns c
     JOIN campaign_statuses cs ON cs.id = c.current_status_id
     JOIN source_posts sp ON sp.id = c.source_post_id
     WHERE c.workspace_id = $1 ORDER BY c.created_at DESC`,
    [workspaceId]
  );
  return rows;
}

export async function findSourcePostIdByPublicUuid(publicUuid, workspaceId) {
  const { rows } = await query(
    `SELECT sp.id FROM source_posts sp
     JOIN creator_accounts ca ON ca.id = sp.creator_account_id
     WHERE sp.public_uuid = $1 AND ca.workspace_id = $2`,
    [publicUuid, workspaceId]
  );
  if (!rows[0]) throw new BackendError(404, "NOT_FOUND", "Source post not found");
  return rows[0].id;
}

export async function listPlatformTypes() {
  const { rows } = await query("SELECT * FROM platform_types ORDER BY id");
  return rows;
}

export async function findPlatformByCode(code) {
  const { rows } = await query("SELECT * FROM platform_types WHERE code = $1", [code]);
  return rows[0];
}

export async function createDeliverable(data) {
  const { rows } = await query(
    `INSERT INTO deliverables (campaign_id, platform_type_id, title, assignee_id, reviewer_id, designer_id, current_status_id, due_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      data.campaignId,
      data.platformTypeId,
      data.title,
      data.assigneeId ?? null,
      data.reviewerId ?? null,
      data.designerId ?? null,
      data.statusId,
      data.dueDate,
    ]
  );
  return rows[0];
}

export async function findCampaignByPublicUuidAnyWorkspace(publicUuid) {
  const { rows } = await query(
    `SELECT c.*, cs.code AS status_code, cs.name AS status_name
     FROM campaigns c
     JOIN campaign_statuses cs ON cs.id = c.current_status_id
     WHERE c.public_uuid = $1`,
    [publicUuid]
  );
  return rows[0];
}

export async function listDeliverables(campaignId) {
  const { rows } = await query(
    `SELECT d.*, ds.code AS status_code, pt.code AS platform_code, pt.name AS platform_name,
            u1.display_name AS assignee_name, u2.display_name AS reviewer_name,
            u3.display_name AS designer_name
     FROM deliverables d
     JOIN deliverable_statuses ds ON ds.id = d.current_status_id
     JOIN platform_types pt ON pt.id = d.platform_type_id
     LEFT JOIN users u1 ON u1.id = d.assignee_id
     LEFT JOIN users u2 ON u2.id = d.reviewer_id
     LEFT JOIN users u3 ON u3.id = d.designer_id
     WHERE d.campaign_id = $1 ORDER BY d.id`,
    [campaignId]
  );
  return rows;
}

export async function assignCampaignReviewer(campaignId, userId, client = null) {
  const q = client ? client.query.bind(client) : query;
  await q(
    `UPDATE deliverables SET reviewer_id = $2, updated_at = NOW()
     WHERE campaign_id = $1 AND reviewer_id IS NULL`,
    [campaignId, userId]
  );
}

export async function assignDeliverableRole(deliverableId, roleCode, userId, client = null) {
  const q = client ? client.query.bind(client) : query;
  if (roleCode === "writer") {
    await q(
      `UPDATE deliverables SET assignee_id = $2, updated_at = NOW() WHERE id = $1`,
      [deliverableId, userId]
    );
  } else if (roleCode === "designer") {
    await q(
      `UPDATE deliverables SET designer_id = $2, updated_at = NOW() WHERE id = $1`,
      [deliverableId, userId]
    );
  } else if (roleCode === "reviewer") {
    await q(
      `UPDATE deliverables SET reviewer_id = $2, updated_at = NOW() WHERE id = $1`,
      [deliverableId, userId]
    );
  }
}

export async function startDeliverableIfAssigned(deliverableId, actorUserId, client = null) {
  const q = client ? client.query.bind(client) : query;
  const assignedId = await getStatusId("assigned", "deliverable_statuses");
  const inProgressId = await getStatusId("in_progress", "deliverable_statuses");
  const { rows } = await q(
    `UPDATE deliverables SET current_status_id = $2, updated_at = NOW()
     WHERE id = $1 AND current_status_id = $3
     RETURNING id, current_status_id`,
    [deliverableId, inProgressId, assignedId]
  );
  if (rows[0]) {
    await q(
      `INSERT INTO deliverable_status_history (deliverable_id, from_status_id, to_status_id, changed_by, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [deliverableId, assignedId, inProgressId, actorUserId, "Specialist accepted staffing request"]
    );
  }
}

export async function findDeliverableByPublicUuid(publicUuid, workspaceId) {
  const { rows } = await query(
    `SELECT d.*, ds.code AS status_code, c.workspace_id, c.public_uuid AS campaign_public_uuid,
            pt.code AS platform_code, pt.field_schema
     FROM deliverables d
     JOIN campaigns c ON c.id = d.campaign_id
     JOIN deliverable_statuses ds ON ds.id = d.current_status_id
     JOIN platform_types pt ON pt.id = d.platform_type_id
     WHERE d.public_uuid = $1 AND c.workspace_id = $2`,
    [publicUuid, workspaceId]
  );
  return rows[0];
}

export async function findDeliverableWithCampaign(publicUuid, workspaceId) {
  const { rows } = await query(
    `SELECT d.*, ds.code AS status_code, c.workspace_id, c.public_uuid AS campaign_public_uuid,
            c.created_by AS campaign_created_by, pt.code AS platform_code, pt.field_schema
     FROM deliverables d
     JOIN campaigns c ON c.id = d.campaign_id
     JOIN deliverable_statuses ds ON ds.id = d.current_status_id
     JOIN platform_types pt ON pt.id = d.platform_type_id
     WHERE d.public_uuid = $1 AND c.workspace_id = $2`,
    [publicUuid, workspaceId]
  );
  return rows[0];
}

export async function updateDeliverableStatus(deliverableId, statusId) {
  await query(`UPDATE deliverables SET current_status_id = $2, updated_at = NOW() WHERE id = $1`, [
    deliverableId,
    statusId,
  ]);
}

export async function insertDeliverableStatusHistory(deliverableId, fromId, toId, changedBy, notes) {
  await query(
    `INSERT INTO deliverable_status_history (deliverable_id, from_status_id, to_status_id, changed_by, notes)
     VALUES ($1,$2,$3,$4,$5)`,
    [deliverableId, fromId, toId, changedBy, notes]
  );
}

export async function getNextVersionNo(deliverableId) {
  const { rows } = await query(
    `SELECT COALESCE(MAX(version_no), 0) + 1 AS next FROM deliverable_versions WHERE deliverable_id = $1`,
    [deliverableId]
  );
  return rows[0].next;
}

export async function createVersion(data) {
  const { rows } = await query(
    `INSERT INTO deliverable_versions (deliverable_id, version_no, payload, submitted_by)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [data.deliverableId, data.versionNo, JSON.stringify(data.payload), data.submittedBy]
  );
  return rows[0];
}

export async function listVersions(deliverableId) {
  const { rows } = await query(
    `SELECT dv.*, u.display_name AS submitted_by_name
     FROM deliverable_versions dv
     JOIN users u ON u.id = dv.submitted_by
     WHERE dv.deliverable_id = $1 ORDER BY dv.version_no DESC`,
    [deliverableId]
  );
  return rows;
}

export async function createReviewAction(data) {
  const { rows } = await query(
    `INSERT INTO review_actions (deliverable_id, actor_id, action, notes)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [data.deliverableId, data.actorId, data.action, data.notes]
  );
  return rows[0];
}

export async function listComments(deliverableId) {
  const { rows } = await query(
    `SELECT c.*, u.display_name AS author_name, u.account_role AS author_role
     FROM comments c
     JOIN users u ON u.id = c.author_id
     WHERE c.deliverable_id = $1 ORDER BY c.created_at`,
    [deliverableId]
  );
  return rows;
}

export async function createComment(deliverableId, authorId, body) {
  const { rows } = await query(
    `INSERT INTO comments (deliverable_id, author_id, body) VALUES ($1,$2,$3) RETURNING *`,
    [deliverableId, authorId, body]
  );
  return rows[0];
}

export async function createAsset(data) {
  const { rows } = await query(
    `INSERT INTO assets (deliverable_version_id, file_path, external_url, mime_type, uploaded_by)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [data.versionId, data.filePath, data.externalUrl, data.mimeType, data.uploadedBy]
  );
  return rows[0];
}

export async function findAssetByPublicUuid(publicUuid) {
  const { rows } = await query("SELECT * FROM assets WHERE public_uuid = $1", [publicUuid]);
  return rows[0];
}

export async function listDeliverablesForAssignee(userId, workspaceId) {
  const { rows } = await query(
    `SELECT d.public_uuid, d.title, ds.code AS status_code, pt.name AS platform_name,
            c.public_uuid AS campaign_public_uuid, c.name AS campaign_name
     FROM deliverables d
     JOIN campaigns c ON c.id = d.campaign_id
     JOIN deliverable_statuses ds ON ds.id = d.current_status_id
     JOIN platform_types pt ON pt.id = d.platform_type_id
     WHERE c.workspace_id = $2
       AND ds.code NOT IN ('ready_to_publish')
       AND (d.assignee_id = $1 OR d.designer_id = $1)
     ORDER BY d.updated_at DESC`,
    [userId, workspaceId]
  );
  return rows;
}

export async function listReviewQueue(workspaceId, reviewerUserId = null) {
  const params = [workspaceId];
  let reviewerFilter = "";
  if (reviewerUserId != null) {
    reviewerFilter = " AND d.reviewer_id = $2";
    params.push(reviewerUserId);
  }
  const { rows } = await query(
    `SELECT d.public_uuid, d.title, ds.code AS status_code, pt.name AS platform_name,
            c.public_uuid AS campaign_public_uuid
     FROM deliverables d
     JOIN campaigns c ON c.id = d.campaign_id
     JOIN deliverable_statuses ds ON ds.id = d.current_status_id
     JOIN platform_types pt ON pt.id = d.platform_type_id
     WHERE c.workspace_id = $1 AND ds.code = 'submitted_for_review'${reviewerFilter}
     ORDER BY d.updated_at`,
    params
  );
  return rows;
}

export async function getDeliverableStatusCodesForCampaign(campaignId) {
  const { rows } = await query(
    `SELECT ds.code FROM deliverables d
     JOIN deliverable_statuses ds ON ds.id = d.current_status_id
     WHERE d.campaign_id = $1`,
    [campaignId]
  );
  return rows.map((r) => r.code);
}

export async function getExportReadyDeliverables(campaignId) {
  const { rows } = await query(
    `SELECT d.public_uuid, d.title, pt.code AS platform_code, pt.field_schema,
            dv.payload, dv.version_no
     FROM deliverables d
     JOIN platform_types pt ON pt.id = d.platform_type_id
     JOIN deliverable_statuses ds ON ds.id = d.current_status_id
     LEFT JOIN LATERAL (
       SELECT * FROM deliverable_versions WHERE deliverable_id = d.id ORDER BY version_no DESC LIMIT 1
     ) dv ON true
     WHERE d.campaign_id = $1 AND ds.code IN ('approved', 'ready_to_publish')`,
    [campaignId]
  );
  return rows;
}
