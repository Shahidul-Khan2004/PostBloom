#!/usr/bin/env node
/**
 * Ensures every Express route in src/api/routes has a preceding @openapi JSDoc block.
 * Run: npm run docs:check
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const routesDir = join(__dirname, "../src/api/routes");

const ROUTE_RE = /router\.(get|post|put|patch|delete)\s*\(/g;

let failed = false;

for (const file of readdirSync(routesDir).filter((f) => f.endsWith(".js"))) {
  const path = join(routesDir, file);
  const content = readFileSync(path, "utf8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    if (!ROUTE_RE.test(lines[i])) continue;
    ROUTE_RE.lastIndex = 0;

    const windowStart = Math.max(0, i - 40);
    const block = lines.slice(windowStart, i).join("\n");
    if (!block.includes("@openapi")) {
      console.error(`${file}:${i + 1} — missing @openapi for route: ${lines[i].trim()}`);
      failed = true;
    }
  }
}

const apiMd = join(__dirname, "../../docs/API.md");
try {
  readFileSync(apiMd, "utf8");
} catch {
  console.error("docs/API.md is missing — create the frontend API reference.");
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log("API documentation check passed (routes annotated, docs/API.md present).");
