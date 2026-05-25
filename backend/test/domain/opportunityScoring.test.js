import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scoreOpportunities,
  classifyPostEvidence,
} from "../../src/domain/opportunityScoring.js";

test("classifyPostEvidence: zero engagement is engagement_validated", () => {
  const tier = classifyPostEvidence({
    impressions: 7,
    engagements: 0,
    engagementRate: 0,
  });
  assert.equal(tier.evidenceType, "engagement_validated");
  assert.equal(tier.scoreBasis, "full_metrics");
});

test("classifyPostEvidence: null engagements is reach_only", () => {
  const tier = classifyPostEvidence({
    impressions: 29,
    engagements: null,
    engagementRate: null,
  });
  assert.equal(tier.evidenceType, "reach_only");
  assert.equal(tier.confidence, "limited_evidence");
});

test("scoreOpportunities ranks higher impressions first among validated", () => {
  const posts = [
    { linkedinPostUrl: "a", impressions: 100, engagements: 5, engagementRate: 0.05, publishDate: "2025-01-01" },
    { linkedinPostUrl: "b", impressions: 5000, engagements: 50, engagementRate: 0.01, publishDate: "2025-06-01" },
    { linkedinPostUrl: "c", impressions: 500, engagements: 10, engagementRate: 0.02, publishDate: "2025-03-01" },
  ];
  const scored = scoreOpportunities(posts, { periodEnd: "2025-12-31" });
  assert.equal(scored[0].linkedinPostUrl, "b");
  assert.equal(scored[0].evidenceType, "engagement_validated");
  assert.equal(scored[0].rankWithinEvidenceType, 1);
  assert.equal(scored[0].rank, 1);
  assert.ok(scored[0].score >= scored[1].score);
  assert.ok(scored[0].recommendationReasons.length > 0);
});

test("scoreOpportunities: reach-only has no fake engagement percentiles", () => {
  const posts = [
    { linkedinPostUrl: "a", impressions: 100, engagements: null, engagementRate: null, publishDate: "2025-01-01" },
    { linkedinPostUrl: "b", impressions: 200, engagements: null, engagementRate: null, publishDate: "2025-02-01" },
  ];
  const scored = scoreOpportunities(posts);
  assert.equal(scored.length, 2);
  assert.equal(scored[0].evidenceType, "reach_only");
  assert.equal(scored[0].recommendationLabel, "Reach-led signal");
  assert.ok(scored[0].scoreBreakdown.excludedMetrics.includes("engagements"));
  assert.equal(scored[0].scoreBreakdown.engPct, undefined);
  assert.equal(scored[0].scoreBreakdown.ratePct, undefined);
  assert.equal(scored[0].scoreBreakdown.weights.impressions, 0.85);
  assert.equal(scored[0].scoreBreakdown.weights.recency, 0.15);
});

test("scoreOpportunities: mixed cohort separates ranks and global order", () => {
  const posts = [
    { linkedinPostUrl: "validated-low", impressions: 10, engagements: 1, engagementRate: 0.1, publishDate: "2025-01-01" },
    { linkedinPostUrl: "validated-high", impressions: 1000, engagements: 100, engagementRate: 0.1, publishDate: "2025-06-01" },
    { linkedinPostUrl: "reach-high", impressions: 500, engagements: null, engagementRate: null, publishDate: "2025-06-01" },
    { linkedinPostUrl: "reach-low", impressions: 50, engagements: null, engagementRate: null, publishDate: "2025-01-01" },
  ];
  const scored = scoreOpportunities(posts, { periodEnd: "2025-12-31" });

  const validated = scored.filter((p) => p.evidenceType === "engagement_validated");
  const reach = scored.filter((p) => p.evidenceType === "reach_only");

  assert.equal(validated.length, 2);
  assert.equal(reach.length, 2);
  assert.equal(validated[0].linkedinPostUrl, "validated-high");
  assert.equal(validated[0].rankWithinEvidenceType, 1);
  assert.equal(reach[0].linkedinPostUrl, "reach-high");
  assert.equal(reach[0].rankWithinEvidenceType, 1);

  assert.ok(validated[0].rank < reach[0].rank);
  assert.equal(scored[0].evidenceType, "engagement_validated");
  assert.equal(scored[2].evidenceType, "reach_only");
});

test("scoreOpportunities: breakout label for top reach and engagement", () => {
  const posts = Array.from({ length: 8 }, (_, i) => ({
    linkedinPostUrl: `peer-${i}`,
    impressions: 100 + i,
    engagements: 5 + i,
    engagementRate: 0.05,
    publishDate: "2025-01-01",
  }));
  posts.push({
    linkedinPostUrl: "breakout",
    impressions: 5828,
    engagements: 105,
    engagementRate: 0.018,
    publishDate: "2025-06-01",
  });
  const scored = scoreOpportunities(posts, { periodEnd: "2025-12-31" });
  const breakout = scored.find((p) => p.linkedinPostUrl === "breakout");
  assert.equal(breakout.recommendationLabel, "Breakout reach opportunity");
});

test("scoreOpportunities: high response-rate label", () => {
  const posts = Array.from({ length: 8 }, (_, i) => ({
    linkedinPostUrl: `peer-${i}`,
    impressions: 500 + i * 10,
    engagements: 10,
    engagementRate: 0.01 + i * 0.001,
    publishDate: "2025-01-01",
  }));
  posts.push({
    linkedinPostUrl: "high-rate",
    impressions: 280,
    engagements: 13,
    engagementRate: 0.15,
    publishDate: "2025-06-01",
  });
  const scored = scoreOpportunities(posts, { periodEnd: "2025-12-31" });
  const highRate = scored.find((p) => p.linkedinPostUrl === "high-rate");
  assert.equal(highRate.recommendationLabel, "High response-rate opportunity");
});

test("scoreOpportunities: zero engagement stays in validated cohort", () => {
  const posts = [
    { linkedinPostUrl: "zero", impressions: 7, engagements: 0, engagementRate: 0, publishDate: "2025-01-01" },
    { linkedinPostUrl: "reach", impressions: 29, engagements: null, engagementRate: null, publishDate: "2025-02-01" },
  ];
  const scored = scoreOpportunities(posts);
  const zero = scored.find((p) => p.linkedinPostUrl === "zero");
  assert.equal(zero.evidenceType, "engagement_validated");
  assert.equal(zero.rank, 1);
  const reach = scored.find((p) => p.linkedinPostUrl === "reach");
  assert.equal(reach.evidenceType, "reach_only");
});
