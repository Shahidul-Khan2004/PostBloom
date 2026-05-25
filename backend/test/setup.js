import { before } from "node:test";
import pool from "../src/config/db.js";
import { resetDatabase } from "./helpers/db.js";

globalThis.__POSTBLOOM_DB_READY__ = false;

before(async () => {
  try {
    await pool.query("SELECT 1");
    await resetDatabase();
    globalThis.__POSTBLOOM_DB_READY__ = true;
  } catch (err) {
    console.warn("[tests] Postgres unavailable — skipping DB integration tests:", err.message);
  }
});

export function skipUnlessDb(t) {
  if (!globalThis.__POSTBLOOM_DB_READY__) {
    t.skip("PostgreSQL not available (run: docker compose up -d)");
  }
}
