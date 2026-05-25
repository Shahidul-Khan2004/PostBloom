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

async function createEmptyCampaign(ownerToken, wsId) {
  const buffer = readFileSync(fixturePath);
  await request(getTestApp())
    .post(`/api/v1/workspaces/${wsId}/analytics/import`)
    .set(authHeader(ownerToken))
    .attach("file", buffer, "linkedin-sample.xlsx");

  const opps = await request(getTestApp())
    .get(`/api/v1/workspaces/${wsId}/opportunities`)
    .set(authHeader(ownerToken));

  const res = await request(getTestApp())
    .post(`/api/v1/workspaces/${wsId}/campaigns`)
    .set(authHeader(ownerToken))
    .send({
      opportunityUuid: opps.body.data[0].publicUuid,
      name: "Deliverable staffing campaign",
      platformCodes: [],
    });
  assert.equal(res.status, 201);
  return res.body.data.publicUuid;
}

dbTest("per-deliverable staff request, accept, and single deliverable assignment", async () => {
  const ownerToken = await loginAs("owner");
  const writerToken = await loginAs("writer");
  const wsId = getDemoWorkspaceUuid();
  const campaignId = await createEmptyCampaign(ownerToken, wsId);

  const addRes = await request(getTestApp())
    .post(`/api/v1/campaigns/${campaignId}/deliverables`)
    .set(authHeader(ownerToken))
    .send({ platformCode: "instagram_carousel", title: "IG carousel" });
  assert.equal(addRes.status, 201);
  const deliverableId = addRes.body.data.publicUuid;

  const writerReq = await request(getTestApp())
    .post(`/api/v1/deliverables/${deliverableId}/staff-requests`)
    .set(authHeader(ownerToken))
    .send({});
  assert.equal(writerReq.status, 201);
  assert.equal(writerReq.body.data.roleCode, "writer");

  const inbox = await request(getTestApp())
    .get("/api/v1/specialist/staff-requests?status=pending")
    .set(authHeader(writerToken));
  assert.ok(
    inbox.body.data.some(
      (r) => r.deliverablePublicUuid === deliverableId && r.requestScope === "deliverable"
    )
  );

  const accept = await request(getTestApp())
    .post(`/api/v1/staff-requests/${writerReq.body.data.publicUuid}/accept`)
    .set(authHeader(writerToken));
  assert.equal(accept.status, 200);

  const delivRes = await request(getTestApp())
    .get(`/api/v1/campaigns/${campaignId}/deliverables`)
    .set(authHeader(ownerToken));
  const ig = delivRes.body.data.find((d) => d.publicUuid === deliverableId);
  assert.equal(ig.assigneeName, "Demo Writer");
  assert.equal(ig.statusCode, "in_progress");
});

dbTest("reviewer staff request is per-deliverable with platform-wide broadcast", async () => {
  const ownerToken = await loginAs("owner");
  const reviewerToken = await loginAs("reviewer");
  const wsId = getDemoWorkspaceUuid();
  const campaignId = await createEmptyCampaign(ownerToken, wsId);

  const addRes = await request(getTestApp())
    .post(`/api/v1/campaigns/${campaignId}/deliverables`)
    .set(authHeader(ownerToken))
    .send({ platformCode: "threads_thread" });
  const deliverableId = addRes.body.data.publicUuid;

  const reviewerReq = await request(getTestApp())
    .post(`/api/v1/deliverables/${deliverableId}/staff-requests`)
    .set(authHeader(ownerToken))
    .send({ roleCode: "reviewer" });
  assert.equal(reviewerReq.status, 201);

  await request(getTestApp())
    .post(`/api/v1/staff-requests/${reviewerReq.body.data.publicUuid}/accept`)
    .set(authHeader(reviewerToken));

  const delivRes = await request(getTestApp())
    .get(`/api/v1/campaigns/${campaignId}/deliverables`)
    .set(authHeader(ownerToken));
  const threads = delivRes.body.data.find((d) => d.publicUuid === deliverableId);
  assert.equal(threads.reviewerName, "Demo Reviewer");
});

dbTest("duplicate pending deliverable staff request returns 409", async () => {
  const ownerToken = await loginAs("owner");
  const wsId = getDemoWorkspaceUuid();
  const campaignId = await createEmptyCampaign(ownerToken, wsId);

  const addRes = await request(getTestApp())
    .post(`/api/v1/campaigns/${campaignId}/deliverables`)
    .set(authHeader(ownerToken))
    .send({ platformCode: "threads_thread" });
  const deliverableId = addRes.body.data.publicUuid;

  await request(getTestApp())
    .post(`/api/v1/deliverables/${deliverableId}/staff-requests`)
    .set(authHeader(ownerToken))
    .send({ roleCode: "writer" });

  const dup = await request(getTestApp())
    .post(`/api/v1/deliverables/${deliverableId}/staff-requests`)
    .set(authHeader(ownerToken))
    .send({ roleCode: "writer" });
  assert.equal(dup.status, 409);
});
