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

dbTest("POST analytics/import uploads fixture XLSX", async () => {
  const token = await loginAs("owner");
  const wsId = getDemoWorkspaceUuid();
  const buffer = readFileSync(fixturePath);
  const res = await request(getTestApp())
    .post(`/api/v1/workspaces/${wsId}/analytics/import`)
    .set(authHeader(token))
    .attach("file", buffer, "linkedin-sample.xlsx");
  assert.equal(res.status, 201);
  assert.ok(res.body.data.postsImported >= 3);
});

dbTest("GET opportunities returns ranked list after import", async () => {
  const token = await loginAs("owner");
  const wsId = getDemoWorkspaceUuid();
  const buffer = readFileSync(fixturePath);
  await request(getTestApp())
    .post(`/api/v1/workspaces/${wsId}/analytics/import`)
    .set(authHeader(token))
    .attach("file", buffer, "linkedin-sample.xlsx");

  const res = await request(getTestApp())
    .get(`/api/v1/workspaces/${wsId}/opportunities`)
    .set(authHeader(token));
  assert.equal(res.status, 200);
  assert.ok(res.body.data[0].score != null);
});

dbTest("PATCH enrich opportunity requires title", async () => {
  const token = await loginAs("owner");
  const wsId = getDemoWorkspaceUuid();
  const buffer = readFileSync(fixturePath);
  await request(getTestApp())
    .post(`/api/v1/workspaces/${wsId}/analytics/import`)
    .set(authHeader(token))
    .attach("file", buffer, "linkedin-sample.xlsx");

  const list = await request(getTestApp())
    .get(`/api/v1/workspaces/${wsId}/opportunities`)
    .set(authHeader(token));
  const oppId = list.body.data[0].publicUuid;

  const res = await request(getTestApp())
    .patch(`/api/v1/workspaces/${wsId}/opportunities/${oppId}/enrich`)
    .set(authHeader(token))
    .send({ title: "Things I wish I knew before backend development" });
  assert.equal(res.status, 200);
});

dbTest("analytics import forbidden for writer role", async () => {
  const token = await loginAs("writer");
  const wsId = getDemoWorkspaceUuid();
  const buffer = readFileSync(fixturePath);
  const res = await request(getTestApp())
    .post(`/api/v1/workspaces/${wsId}/analytics/import`)
    .set(authHeader(token))
    .attach("file", buffer, "linkedin-sample.xlsx");
  assert.equal(res.status, 403);
});
