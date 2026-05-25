import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseLinkedInAnalyticsXlsx } from "../../src/integrations/linkedinXlsxParser.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(__dirname, "../fixtures/linkedin-sample.xlsx");

test("parseLinkedInAnalyticsXlsx reads fixture posts", () => {
  const buffer = readFileSync(fixturePath);
  const result = parseLinkedInAnalyticsXlsx(buffer);
  assert.ok(result.posts.length >= 3);
  assert.ok(result.posts[0].linkedinPostUrl.includes("linkedin.com"));
  assert.ok(result.rowCounts.posts >= 3);
});
