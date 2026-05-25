import { query } from "../config/db.js";
import BackendError from "../lib/BackendError.js";

export function mapWorkspaceFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    publicUuid: row.public_uuid,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
  };
}

export async function create({ name, slug }) {
  const { rows } = await query(
    `INSERT INTO workspaces (name, slug) VALUES ($1, $2) RETURNING *`,
    [name, slug]
  );
  return mapWorkspaceFromRow(rows[0]);
}

export async function findByPublicUuid(publicUuid) {
  const { rows } = await query("SELECT * FROM workspaces WHERE public_uuid = $1", [publicUuid]);
  return mapWorkspaceFromRow(rows[0]);
}

export async function findById(id) {
  const { rows } = await query("SELECT * FROM workspaces WHERE id = $1", [id]);
  return mapWorkspaceFromRow(rows[0]);
}

export async function slugExists(slug) {
  const { rows } = await query("SELECT 1 FROM workspaces WHERE slug = $1", [slug]);
  return rows.length > 0;
}
