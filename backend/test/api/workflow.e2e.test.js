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

dbTest("end-to-end: import → campaign → deliverable staffing → submit → owner review", async () => {
  const ownerToken = await loginAs("owner");
  const writerToken = await loginAs("writer");
  const wsId = getDemoWorkspaceUuid();
  const buffer = readFileSync(fixturePath);

  await request(getTestApp())
    .post(`/api/v1/workspaces/${wsId}/analytics/import`)
    .set(authHeader(ownerToken))
    .attach("file", buffer, "linkedin-sample.xlsx");

  const opps = await request(getTestApp())
    .get(`/api/v1/workspaces/${wsId}/opportunities`)
    .set(authHeader(ownerToken));
  const sourcePostId = opps.body.data[0].publicUuid;

  await request(getTestApp())
    .patch(`/api/v1/workspaces/${wsId}/opportunities/${sourcePostId}/enrich`)
    .set(authHeader(ownerToken))
    .send({ title: "Demo source post title" });

  const campaignRes = await request(getTestApp())
    .post(`/api/v1/workspaces/${wsId}/campaigns`)
    .set(authHeader(ownerToken))
    .send({
      opportunityUuid: sourcePostId,
      name: "Cross-platform expansion demo",
      platformCodes: [],
    });
  assert.equal(campaignRes.status, 201);
  const campaignId = campaignRes.body.data.publicUuid;

  const addRes = await request(getTestApp())
    .post(`/api/v1/campaigns/${campaignId}/deliverables`)
    .set(authHeader(ownerToken))
    .send({ platformCode: "instagram_carousel" });
  assert.equal(addRes.status, 201);
  const deliverableId = addRes.body.data.publicUuid;

  const writerReq = await request(getTestApp())
    .post(`/api/v1/deliverables/${deliverableId}/staff-requests`)
    .set(authHeader(ownerToken))
    .send({});
  assert.equal(writerReq.status, 201);

  await request(getTestApp())
    .post(`/api/v1/staff-requests/${writerReq.body.data.publicUuid}/accept`)
    .set(authHeader(writerToken));

  const submitRes = await request(getTestApp())
    .post(`/api/v1/deliverables/${deliverableId}/versions`)
    .set(authHeader(writerToken))
    .send({
      payload: {
        carousel_title: "Backend tips",
        slide_1_hook: "Hook",
        slides_2_6: "Points",
        final_cta: "Follow",
        caption: "Caption text",
      },
    });
  assert.equal(submitRes.status, 201);

  const reviewRes = await request(getTestApp())
    .post(`/api/v1/deliverables/${deliverableId}/review`)
    .set(authHeader(ownerToken))
    .send({ action: "approve", notes: "Owner self-review" });
  assert.equal(reviewRes.status, 200);

  const exportRes = await request(getTestApp())
    .get(`/api/v1/campaigns/${campaignId}/export-ready`)
    .set(authHeader(ownerToken));
  assert.ok(exportRes.body.data.length >= 1);
});
