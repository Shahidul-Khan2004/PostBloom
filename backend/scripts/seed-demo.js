import "dotenv/config";
import bcrypt from "bcrypt";
import pool from "../src/config/db.js";

const DEMO_PASSWORD = "Demo1234!";
const USERS = [
  { email: "owner@demo.postbloom", displayName: "Demo Admin", accountRole: "admin" },
  { email: "reviewer@demo.postbloom", displayName: "Demo Reviewer", accountRole: "reviewer" },
  { email: "writer@demo.postbloom", displayName: "Demo Writer", accountRole: "writer" },
  { email: "designer@demo.postbloom", displayName: "Demo Designer", accountRole: "designer" },
];

async function main() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const u of USERS) {
      await client.query(
        `INSERT INTO users (email, password_hash, display_name, account_role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET
           password_hash = $2,
           display_name = $3,
           account_role = $4`,
        [u.email, hash, u.displayName, u.accountRole]
      );
    }

    const { rows: wsRows } = await client.query(
      `INSERT INTO workspaces (name, slug) VALUES ('Demo Workspace', 'demo-workspace')
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id, public_uuid`
    );
    const workspaceId = wsRows[0].id;

    await client.query(
      `INSERT INTO creator_accounts (workspace_id) VALUES ($1)
       ON CONFLICT (workspace_id) DO NOTHING`,
      [workspaceId]
    );

    for (const u of USERS) {
      const { rows: userRows } = await client.query("SELECT id FROM users WHERE email = $1", [
        u.email,
      ]);
      await client.query(
        `INSERT INTO workspace_members (workspace_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (workspace_id, user_id) DO UPDATE SET status = 'active'`,
        [workspaceId, userRows[0].id]
      );
    }

    await client.query("COMMIT");
    console.log("Demo users seeded. Password:", DEMO_PASSWORD);
    console.log("Workspace public UUID:", wsRows[0].public_uuid);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
