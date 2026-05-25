import { test } from "node:test";

export function dbTest(name, fn) {
  test(name, async (t) => {
    if (!globalThis.__POSTBLOOM_DB_READY__) {
      return t.skip("PostgreSQL not available (run: docker compose up -d)");
    }
    return fn(t);
  });
}
