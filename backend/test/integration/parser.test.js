import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseLinkedInAnalyticsXlsx } from "../../src/integrations/linkedinXlsxParser.js";
import { formatDateOnly } from "../../src/lib/dateFormat.js";
import { classifyPostEvidence } from "../../src/domain/opportunityScoring.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(__dirname, "../fixtures/linkedin-sample.xlsx");

test("parseLinkedInAnalyticsXlsx reads fixture posts", () => {
  const buffer = readFileSync(fixturePath);
  const result = parseLinkedInAnalyticsXlsx(buffer);
  assert.ok(result.posts.length >= 3);
  assert.ok(result.posts[0].linkedinPostUrl.includes("linkedin.com"));
  assert.ok(result.rowCounts.posts >= 3);
});

test("formatDateOnly parses US date without timezone shift", () => {
  assert.equal(formatDateOnly("5/26/2025"), "2025-05-26");
  assert.equal(formatDateOnly("5/25/2026"), "2026-05-25");
});

test("parseDateRange from discovery string returns date-only values", () => {
  const discovery = { dateRange: "5/26/2025 - 5/25/2026" };
  const buffer = readFileSync(fixturePath);
  const result = parseLinkedInAnalyticsXlsx(buffer);
  if (result.dateRangeStart && result.dateRangeEnd) {
    assert.match(result.dateRangeStart, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(result.dateRangeEnd, /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.equal(formatDateOnly("5/26/2025"), "2025-05-26");
  assert.equal(formatDateOnly("5/25/2026"), "2026-05-25");
  void discovery;
});

test("metricsCoverage counts evidence tiers from posts", () => {
  const posts = [
    { impressions: 100, engagements: 5, engagementRate: 0.05 },
    { impressions: 50, engagements: null, engagementRate: null },
    { impressions: 7, engagements: 0, engagementRate: 0 },
  ];
  let engagementValidatedPosts = 0;
  let reachOnlyPosts = 0;
  for (const p of posts) {
    const tier = classifyPostEvidence(p);
    if (tier.evidenceType === "engagement_validated") engagementValidatedPosts += 1;
    if (tier.evidenceType === "reach_only") reachOnlyPosts += 1;
  }
  assert.equal(engagementValidatedPosts, 2);
  assert.equal(reachOnlyPosts, 1);

  const buffer = readFileSync(fixturePath);
  const result = parseLinkedInAnalyticsXlsx(buffer);
  assert.ok(result.metricsCoverage);
  assert.equal(result.metricsCoverage.postsImported, result.posts.length);
  assert.equal(
    result.metricsCoverage.engagementValidatedPosts + result.metricsCoverage.reachOnlyPosts,
    result.metricsCoverage.postsImported
  );
  assert.ok(result.notices.length >= 0);
  assert.equal(result.warnings.length, 0);
});
