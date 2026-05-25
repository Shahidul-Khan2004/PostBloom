import "../setup.js";
import assert from "node:assert/strict";
import request from "supertest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getTestApp } from "../helpers/app.js";
import { loginAs, authHeader } from "../helpers/auth.js";
import { dbTest } from "../helpers/dbTest.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(__dirname, "../fixtures/linkedin-sample.xlsx");

dbTest("campaign creation blocked before analytics import", async () => {
  const ownerToken = await loginAs("owner");

  const wsRes = await request(getTestApp())
    .post("/api/v1/workspaces")
    .set(authHeader(ownerToken))
    .send({ name: "Onboarding Test WS", slug: "onboarding-test-ws" });
  assert.equal(wsRes.status, 201);
  const wsId = wsRes.body.data.publicUuid;

  const setupRes = await request(getTestApp())
    .get(`/api/v1/workspaces/${wsId}`)
    .set(authHeader(ownerToken));
  assert.equal(setupRes.status, 200);
  assert.equal(setupRes.body.data.setup.hasImport, false);
  assert.equal(setupRes.body.data.setup.canCreateCampaign, false);

  const campaignRes = await request(getTestApp())
    .post(`/api/v1/workspaces/${wsId}/campaigns`)
    .set(authHeader(ownerToken))
    .send({
      opportunityUuid: "00000000-0000-0000-0000-000000000001",
      name: "Too early",
      platformCodes: ["threads_thread"],
    });
  assert.equal(campaignRes.status, 422);
  assert.equal(campaignRes.body.error.code, "WORKSPACE_NOT_READY");
});

dbTest("campaign creation allowed after analytics import", async () => {
  const ownerToken = await loginAs("owner");
  const buffer = readFileSync(fixturePath);

  const wsRes = await request(getTestApp())
    .post("/api/v1/workspaces")
    .set(authHeader(ownerToken))
    .send({ name: "Ready WS", slug: "ready-ws-test" });
  const wsId = wsRes.body.data.publicUuid;

  await request(getTestApp())
    .post(`/api/v1/workspaces/${wsId}/analytics/import`)
    .set(authHeader(ownerToken))
    .attach("file", buffer, "linkedin-sample.xlsx");

  const opps = await request(getTestApp())
    .get(`/api/v1/workspaces/${wsId}/opportunities`)
    .set(authHeader(ownerToken));
  const sourcePostId = opps.body.data[0].publicUuid;

  const campaignRes = await request(getTestApp())
    .post(`/api/v1/workspaces/${wsId}/campaigns`)
    .set(authHeader(ownerToken))
    .send({
      opportunityUuid: sourcePostId,
      name: "After import",
      platformCodes: ["threads_thread"],
    });
  assert.equal(campaignRes.status, 201);
});
