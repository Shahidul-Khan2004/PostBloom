import "../setup.js";
import assert from "node:assert/strict";
import request from "supertest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getTestApp } from "../helpers/app.js";
import { loginAs, authHeader } from "../helpers/auth.js";
import { getDemoWorkspaceUuid } from "../helpers/seed.js";
import { dbTest } from "../helpers/dbTest.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(__dirname, "../fixtures/linkedin-sample.xlsx");

dbTest("admin specialist analytics reflects participation and completion", async () => {
  const ownerToken = await loginAs("owner");
  const writerToken = await loginAs("writer");
  const reviewerToken = await loginAs("reviewer");
  const wsId = getDemoWorkspaceUuid();
  const buffer = readFileSync(fixturePath);

  await request(getTestApp())
    .post(`/api/v1/workspaces/${wsId}/analytics/import`)
    .set(authHeader(ownerToken))
    .attach("file", buffer, "linkedin-sample.xlsx");

  const opps = await request(getTestApp())
    .get(`/api/v1/workspaces/${wsId}/opportunities`)
    .set(authHeader(ownerToken));

  const campaignRes = await request(getTestApp())
    .post(`/api/v1/workspaces/${wsId}/campaigns`)
    .set(authHeader(ownerToken))
    .send({
      opportunityUuid: opps.body.data[0].publicUuid,
      name: "Analytics campaign",
      platformCodes: ["threads_thread"],
    });
  const campaignId = campaignRes.body.data.publicUuid;

  const delivRes = await request(getTestApp())
    .get(`/api/v1/campaigns/${campaignId}/deliverables`)
    .set(authHeader(ownerToken));
  const threads = delivRes.body.data.find((d) => d.platformCode === "threads_thread");

  const writerReq = await request(getTestApp())
    .post(`/api/v1/deliverables/${threads.publicUuid}/staff-requests`)
    .set(authHeader(ownerToken))
    .send({ roleCode: "writer" });
  assert.equal(writerReq.status, 201);
  await request(getTestApp())
    .post(`/api/v1/staff-requests/${writerReq.body.data.publicUuid}/accept`)
    .set(authHeader(writerToken));

  const reviewerReq = await request(getTestApp())
    .post(`/api/v1/deliverables/${threads.publicUuid}/staff-requests`)
    .set(authHeader(ownerToken))
    .send({ roleCode: "reviewer" });
  assert.equal(reviewerReq.status, 201);
  await request(getTestApp())
    .post(`/api/v1/staff-requests/${reviewerReq.body.data.publicUuid}/accept`)
    .set(authHeader(reviewerToken));

  for (const statusCode of [
    "in_review",
    "partially_approved",
    "ready_to_publish",
    "completed",
  ]) {
    const statusRes = await request(getTestApp())
      .post(`/api/v1/campaigns/${campaignId}/status`)
      .set(authHeader(ownerToken))
      .send({ statusCode, notes: `Transition to ${statusCode}` });
    assert.equal(statusRes.status, 200, `expected transition to ${statusCode}`);
  }

  const metricsRes = await request(getTestApp())
    .get("/api/v1/admin/analytics/specialists")
    .set(authHeader(ownerToken));
  assert.equal(metricsRes.status, 200);

  const writerMetrics = metricsRes.body.data.find((m) => m.accountRole === "writer");
  assert.ok(writerMetrics);
  assert.ok(writerMetrics.campaignsParticipated >= 1);
  assert.ok(writerMetrics.campaignsCompleted >= 1);

  const filtered = await request(getTestApp())
    .get("/api/v1/admin/analytics/specialists?role=writer")
    .set(authHeader(ownerToken));
  assert.equal(filtered.status, 200);
  assert.ok(filtered.body.data.every((m) => m.accountRole === "writer"));
});

dbTest("non-admin cannot access specialist analytics", async () => {
  const writerToken = await loginAs("writer");
  const res = await request(getTestApp())
    .get("/api/v1/admin/analytics/specialists")
    .set(authHeader(writerToken));
  assert.equal(res.status, 403);
});
