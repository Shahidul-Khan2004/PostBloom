import { query } from "../config/db.js";
import BackendError from "../lib/BackendError.js";

export function mapUserFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    publicUuid: row.public_uuid,
    email: row.email,
    displayName: row.display_name,
    accountRole: row.account_role,
    createdAt: row.created_at,
  };
}

export async function findByEmail(email) {
  const { rows } = await query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
  return mapUserFromRow(rows[0]);
}

export async function findByEmailWithHash(email) {
  const { rows } = await query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
  const row = rows[0];
  if (!row) return null;
  return { ...mapUserFromRow(row), passwordHash: row.password_hash };
}

export async function findById(id) {
  const { rows } = await query("SELECT * FROM users WHERE id = $1", [id]);
  return mapUserFromRow(rows[0]);
}

export async function findByPublicUuid(publicUuid) {
  const { rows } = await query("SELECT * FROM users WHERE public_uuid = $1", [publicUuid]);
  return mapUserFromRow(rows[0]);
}

export async function findAdmin() {
  const { rows } = await query("SELECT * FROM users WHERE account_role = 'admin' LIMIT 1");
  return mapUserFromRow(rows[0]);
}

export async function create({ email, passwordHash, displayName }) {
  try {
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, display_name, account_role)
       VALUES ($1, $2, $3, 'user') RETURNING *`,
      [email.toLowerCase(), passwordHash, displayName]
    );
    return mapUserFromRow(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      throw new BackendError(409, "EMAIL_EXISTS", "Email already registered");
    }
    throw err;
  }
}

export async function updateAccountRole(userId, accountRole) {
  const { rows } = await query(
    `UPDATE users SET account_role = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [userId, accountRole]
  );
  return mapUserFromRow(rows[0]);
}

export async function demoteCurrentAdmin(excludeUserId) {
  await query(
    `UPDATE users SET account_role = 'user', updated_at = NOW()
     WHERE account_role = 'admin' AND id <> $1`,
    [excludeUserId]
  );
}
