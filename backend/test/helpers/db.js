import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../../src/config/db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

import { seedDemoUsers } from "./seed.js";

/** Serializes parallel test workers that share one Postgres instance. */
const TEST_DB_LOCK_ID = 0x504f424c;

export async function resetDatabase() {
  await pool.query("SELECT pg_advisory_lock($1)", [TEST_DB_LOCK_ID]);
  try {
    await resetDatabaseUnlocked();
  } finally {
    await pool.query("SELECT pg_advisory_unlock($1)", [TEST_DB_LOCK_ID]);
  }
}

async function resetDatabaseUnlocked() {
  const seedsDir = join(__dirname, "../../schemas/postgres-init");

  const tables = [
    "audit_events",
    "notifications",
    "review_actions",
    "comments",
    "assets",
    "deliverable_versions",
    "deliverable_status_history",
    "deliverable_staff_requests",
    "deliverables",
    "campaign_participants",
    "campaign_staff_requests",
    "campaign_status_history",
    "campaigns",
    "opportunity_scores",
    "source_posts",
    "analytics_imports",
    "creator_accounts",
    "workspace_members",
    "workspaces",
    "users",
  ];
  await pool.query(`TRUNCATE ${tables.join(", ")} RESTART IDENTITY CASCADE`);

  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM roles");
  if (rows[0].n === 0) {
    const sql = readFileSync(join(seedsDir, "06_seeds.sql"), "utf8");
    await pool.query(sql);
  }

  const migrationSql = readFileSync(join(seedsDir, "07_account_rbac.sql"), "utf8");
  await pool.query(migrationSql);

  const staffingSql = readFileSync(join(seedsDir, "08_campaign_staffing.sql"), "utf8");
  await pool.query(staffingSql);

  const deliverableStaffingSql = readFileSync(
    join(seedsDir, "09_deliverable_staffing.sql"),
    "utf8"
  );
  await pool.query(deliverableStaffingSql);

  const reviewerRoleSql = readFileSync(
    join(seedsDir, "10_deliverable_staff_reviewer.sql"),
    "utf8"
  );
  await pool.query(reviewerRoleSql);

  await seedDemoUsers();
}

export async function closePool() {
  await pool.end();
}
