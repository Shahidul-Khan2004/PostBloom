import { query } from "../config/db.js";

export async function record({
  workspaceId,
  actorId,
  entityType,
  entityId,
  entityPublicUuid,
  action,
  metadata = {},
}) {
  const { rows } = await query(
    `INSERT INTO audit_events (workspace_id, actor_id, entity_type, entity_id, entity_public_uuid, action, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [workspaceId, actorId, entityType, entityId ?? null, entityPublicUuid ?? null, action, JSON.stringify(metadata)]
  );
  return rows[0];
}

export async function listByWorkspace(workspaceId, { limit = 50, entityType } = {}) {
  const params = [workspaceId];
  let sql = `SELECT ae.*, u.display_name AS actor_name
             FROM audit_events ae
             LEFT JOIN users u ON u.id = ae.actor_id
             WHERE ae.workspace_id = $1`;
  if (entityType) {
    params.push(entityType);
    sql += ` AND ae.entity_type = $${params.length}`;
  }
  params.push(limit);
  sql += ` ORDER BY ae.created_at DESC LIMIT $${params.length}`;

  const { rows } = await query(sql, params);
  return rows.map((row) => ({
    publicUuid: row.public_uuid,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityPublicUuid: row.entity_public_uuid,
    action: row.action,
    metadata: row.metadata,
    actorName: row.actor_name,
    createdAt: row.created_at,
  }));
}
