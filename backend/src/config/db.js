import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(text, params) {
  const result = await pool.query(text, params);
  return { rows: result.rows, rowCount: result.rowCount };
}

export function getPool() {
  return pool;
}

export default pool;
