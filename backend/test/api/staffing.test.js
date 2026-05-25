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

async function createCampaignWithDeliverables(ownerToken, wsId) {
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
      name: "Staffing test campaign",
      platformCodes: ["instagram_carousel", "threads_thread"],
    });
  return res.body.data.publicUuid;
}

dbTest("deliverable staff request broadcast, accept, and assignment", async () => {
  const ownerToken = await loginAs("owner");
  const writerToken = await loginAs("writer");
  const wsId = getDemoWorkspaceUuid();
  const campaignId = await createCampaignWithDeliverables(ownerToken, wsId);

  const delivRes = await request(getTestApp())
    .get(`/api/v1/campaigns/${campaignId}/deliverables`)
    .set(authHeader(ownerToken));
  const threads = delivRes.body.data.find((d) => d.platformCode === "threads_thread");

  const writerReq = await request(getTestApp())
    .post(`/api/v1/deliverables/${threads.publicUuid}/staff-requests`)
    .set(authHeader(ownerToken))
    .send({ roleCode: "writer" });
  assert.equal(writerReq.status, 201);
  assert.equal(writerReq.body.data.status, "pending");

  const inbox = await request(getTestApp())
    .get("/api/v1/specialist/staff-requests?status=pending")
    .set(authHeader(writerToken));
  assert.ok(
    inbox.body.data.some((r) => r.deliverablePublicUuid === threads.publicUuid)
  );

  const accept = await request(getTestApp())
    .post(`/api/v1/staff-requests/${writerReq.body.data.publicUuid}/accept`)
    .set(authHeader(writerToken));
  assert.equal(accept.status, 200);
  assert.equal(accept.body.data.status, "accepted");

  const secondAccept = await request(getTestApp())
    .post(`/api/v1/staff-requests/${writerReq.body.data.publicUuid}/accept`)
    .set(authHeader(writerToken));
  assert.equal(secondAccept.status, 409);

  const afterWriter = await request(getTestApp())
    .get(`/api/v1/campaigns/${campaignId}/deliverables`)
    .set(authHeader(ownerToken));
  const threadsAfter = afterWriter.body.data.find((d) => d.platformCode === "threads_thread");
  const instagram = afterWriter.body.data.find((d) => d.platformCode === "instagram_carousel");
  assert.equal(threadsAfter.assigneeName, "Demo Writer");
  assert.equal(instagram.assigneeName, null);
});

dbTest("reviewer accept assigns only the requested deliverable", async () => {
  const ownerToken = await loginAs("owner");
  const reviewerToken = await loginAs("reviewer");
  const wsId = getDemoWorkspaceUuid();
  const campaignId = await createCampaignWithDeliverables(ownerToken, wsId);

  const delivRes = await request(getTestApp())
    .get(`/api/v1/campaigns/${campaignId}/deliverables`)
    .set(authHeader(ownerToken));
  const threads = delivRes.body.data.find((d) => d.platformCode === "threads_thread");

  const reviewerReq = await request(getTestApp())
    .post(`/api/v1/deliverables/${threads.publicUuid}/staff-requests`)
    .set(authHeader(ownerToken))
    .send({ roleCode: "reviewer" });
  assert.equal(reviewerReq.status, 201);

  const reviewerAccept = await request(getTestApp())
    .post(`/api/v1/staff-requests/${reviewerReq.body.data.publicUuid}/accept`)
    .set(authHeader(reviewerToken));
  assert.equal(reviewerAccept.status, 200);

  const afterReview = await request(getTestApp())
    .get(`/api/v1/campaigns/${campaignId}/deliverables`)
    .set(authHeader(ownerToken));
  const threadsAfter = afterReview.body.data.find((d) => d.platformCode === "threads_thread");
  const instagram = afterReview.body.data.find((d) => d.platformCode === "instagram_carousel");
  assert.equal(threadsAfter.reviewerName, "Demo Reviewer");
  assert.equal(instagram.reviewerName, null);
});

dbTest("duplicate pending deliverable staff request returns 409", async () => {
  const ownerToken = await loginAs("owner");
  const wsId = getDemoWorkspaceUuid();
  const campaignId = await createCampaignWithDeliverables(ownerToken, wsId);

  const delivRes = await request(getTestApp())
    .get(`/api/v1/campaigns/${campaignId}/deliverables`)
    .set(authHeader(ownerToken));
  const threads = delivRes.body.data.find((d) => d.platformCode === "threads_thread");

  await request(getTestApp())
    .post(`/api/v1/deliverables/${threads.publicUuid}/staff-requests`)
    .set(authHeader(ownerToken))
    .send({ roleCode: "writer" });

  const dup = await request(getTestApp())
    .post(`/api/v1/deliverables/${threads.publicUuid}/staff-requests`)
    .set(authHeader(ownerToken))
    .send({ roleCode: "writer" });
  assert.equal(dup.status, 409);
});
