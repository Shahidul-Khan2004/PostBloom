import { query } from "../config/db.js";

export async function create({ userId, type, payload }) {
  const { rows } = await query(
    `INSERT INTO notifications (user_id, type, payload) VALUES ($1, $2, $3) RETURNING *`,
    [userId, type, JSON.stringify(payload)]
  );
  return rows[0];
}

export async function listForUser(userId, { unreadOnly = false } = {}) {
  let sql = `SELECT * FROM notifications WHERE user_id = $1`;
  if (unreadOnly) sql += ` AND read_at IS NULL`;
  sql += ` ORDER BY created_at DESC LIMIT 100`;
  const { rows } = await query(sql, [userId]);
  return rows.map((r) => ({
    publicUuid: r.public_uuid,
    type: r.type,
    payload: r.payload,
    readAt: r.read_at,
    createdAt: r.created_at,
  }));
}

export async function markRead(publicUuid, userId) {
  const { rows } = await query(
    `UPDATE notifications SET read_at = NOW()
     WHERE public_uuid = $1 AND user_id = $2 RETURNING *`,
    [publicUuid, userId]
  );
  return rows[0];
}
