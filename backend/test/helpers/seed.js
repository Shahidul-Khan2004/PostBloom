import bcrypt from "bcrypt";
import pool from "../../src/config/db.js";

const DEMO_PASSWORD = "Demo1234!";
const USERS = [
  { email: "owner@demo.postbloom", displayName: "Demo Admin", accountRole: "admin" },
  { email: "reviewer@demo.postbloom", displayName: "Demo Reviewer", accountRole: "reviewer" },
  { email: "writer@demo.postbloom", displayName: "Demo Writer", accountRole: "writer" },
  { email: "designer@demo.postbloom", displayName: "Demo Designer", accountRole: "designer" },
];

let workspacePublicUuid;
let otherWorkspacePublicUuid;

export function getDemoWorkspaceUuid() {
  return workspacePublicUuid;
}

/** Workspace the demo owner is not a member of (for 403 tests). */
export function getOtherWorkspaceUuid() {
  return otherWorkspacePublicUuid;
}

export async function seedDemoUsers() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const u of USERS) {
      await client.query(
        `INSERT INTO users (email, password_hash, display_name, account_role) VALUES ($1,$2,$3,$4)`,
        [u.email, hash, u.displayName, u.accountRole]
      );
    }
    const { rows: wsRows } = await client.query(
      `INSERT INTO workspaces (name, slug) VALUES ('Demo Workspace', 'demo-workspace-test')
       RETURNING id, public_uuid`
    );
    workspacePublicUuid = wsRows[0].public_uuid;
    const workspaceId = wsRows[0].id;
    await client.query(`INSERT INTO creator_accounts (workspace_id) VALUES ($1)`, [workspaceId]);
    for (const u of USERS) {
      const { rows: userRows } = await client.query("SELECT id FROM users WHERE email = $1", [
        u.email,
      ]);
      await client.query(
        `INSERT INTO workspace_members (workspace_id, user_id) VALUES ($1,$2)`,
        [workspaceId, userRows[0].id]
      );
    }

    const { rows: otherWsRows } = await client.query(
      `INSERT INTO workspaces (name, slug) VALUES ('Other Workspace', 'other-workspace-test')
       RETURNING id, public_uuid`
    );
    otherWorkspacePublicUuid = otherWsRows[0].public_uuid;
    const otherWorkspaceId = otherWsRows[0].id;
    await client.query(`INSERT INTO creator_accounts (workspace_id) VALUES ($1)`, [
      otherWorkspaceId,
    ]);
    const { rows: writerRows } = await client.query(
      "SELECT id FROM users WHERE email = $1",
      ["writer@demo.postbloom"]
    );
    await client.query(
      `INSERT INTO workspace_members (workspace_id, user_id) VALUES ($1,$2)`,
      [otherWorkspaceId, writerRows[0].id]
    );

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
