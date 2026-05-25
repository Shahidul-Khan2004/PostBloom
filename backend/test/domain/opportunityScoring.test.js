import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreOpportunities } from "../../src/domain/opportunityScoring.js";

test("scoreOpportunities ranks higher impressions first", () => {
  const posts = [
    { linkedinPostUrl: "a", impressions: 100, engagements: 5, publishDate: "2025-01-01" },
    { linkedinPostUrl: "b", impressions: 5000, engagements: 50, publishDate: "2025-06-01" },
    { linkedinPostUrl: "c", impressions: 500, engagements: 10, publishDate: "2025-03-01" },
  ];
  const scored = scoreOpportunities(posts, { periodEnd: "2025-12-31" });
  assert.equal(scored[0].linkedinPostUrl, "b");
  assert.equal(scored[0].rank, 1);
  assert.ok(scored[0].score >= scored[1].score);
  assert.ok(scored[0].recommendationLabel.length > 0);
});

test("scoreOpportunities handles missing engagements", () => {
  const posts = [
    { linkedinPostUrl: "a", impressions: 100, engagements: null, publishDate: "2025-01-01" },
    { linkedinPostUrl: "b", impressions: 200, engagements: null, publishDate: "2025-02-01" },
  ];
  const scored = scoreOpportunities(posts);
  assert.equal(scored.length, 2);
  assert.ok(scored[0].scoreBreakdown.notes.includes("redistributed") || scored[0].scoreBreakdown.notes.includes("missing"));
});
