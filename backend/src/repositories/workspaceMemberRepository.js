import { query } from "../config/db.js";
import { mapWorkspaceFromRow } from "./workspaceRepository.js";
import { permissionsForAccountRole } from "../domain/permissions.js";

export async function ensureActiveMember(userId, workspaceId) {
  return addMember(workspaceId, userId);
}

export async function addMember(workspaceId, userId) {
  const { rows } = await query(
    `INSERT INTO workspace_members (workspace_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (workspace_id, user_id) DO UPDATE SET status = 'active'
     RETURNING *`,
    [workspaceId, userId]
  );
  return rows[0];
}

export async function isMember(userId, workspaceId) {
  const { rows } = await query(
    `SELECT 1 FROM workspace_members
     WHERE user_id = $1 AND workspace_id = $2 AND status = 'active'`,
    [userId, workspaceId]
  );
  return Boolean(rows[0]);
}

export async function findMembershipWithPermissions(userId, workspacePublicUuid) {
  const { rows } = await query(
    `SELECT w.*, u.account_role, wm.id AS membership_id
     FROM workspace_members wm
     JOIN workspaces w ON w.id = wm.workspace_id
     JOIN users u ON u.id = wm.user_id
     WHERE wm.user_id = $1 AND w.public_uuid = $2 AND wm.status = 'active'`,
    [userId, workspacePublicUuid]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    workspace: mapWorkspaceFromRow(row),
    roleCode: row.account_role,
    accountRole: row.account_role,
    permissions: permissionsForAccountRole(row.account_role),
  };
}

export async function listMembers(workspaceId) {
  const { rows } = await query(
    `SELECT u.public_uuid, u.email, u.display_name, u.account_role, wm.status, wm.created_at
     FROM workspace_members wm
     JOIN users u ON u.id = wm.user_id
     WHERE wm.workspace_id = $1 AND wm.status = 'active'
     ORDER BY wm.created_at`,
    [workspaceId]
  );
  return rows.map((row) => ({
    user: {
      publicUuid: row.public_uuid,
      email: row.email,
      displayName: row.display_name,
    },
    roleCode: row.account_role,
    accountRole: row.account_role,
    status: row.status,
    joinedAt: row.created_at,
  }));
}

export async function listWorkspacesForUser(userId) {
  const { rows } = await query(
    `SELECT w.public_uuid, w.name, w.slug, w.created_at, u.account_role
     FROM workspace_members wm
     JOIN workspaces w ON w.id = wm.workspace_id
     JOIN users u ON u.id = wm.user_id
     WHERE wm.user_id = $1 AND wm.status = 'active'
     ORDER BY w.name`,
    [userId]
  );
  return rows.map((row) => ({
    publicUuid: row.public_uuid,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
    accountRole: row.account_role,
  }));
}

export async function findMemberByEmail(workspaceId, email) {
  const { rows } = await query(
    `SELECT u.id FROM users u
     JOIN workspace_members wm ON wm.user_id = u.id
     WHERE wm.workspace_id = $1 AND u.email = $2 AND wm.status = 'active'`,
    [workspaceId, email.toLowerCase()]
  );
  return rows[0]?.id;
}
