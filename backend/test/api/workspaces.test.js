import "../setup.js";
import assert from "node:assert/strict";
import request from "supertest";
import { getTestApp } from "../helpers/app.js";
import { loginAs, authHeader } from "../helpers/auth.js";
import { getDemoWorkspaceUuid, getOtherWorkspaceUuid } from "../helpers/seed.js";
import { dbTest } from "../helpers/dbTest.js";

dbTest("GET /workspaces/:id returns demo workspace for owner", async () => {
  const token = await loginAs("owner");
  const wsId = getDemoWorkspaceUuid();
  const res = await request(getTestApp())
    .get(`/api/v1/workspaces/${wsId}`)
    .set(authHeader(token));
  assert.equal(res.status, 200);
  assert.equal(res.body.data.slug, "demo-workspace-test");
});

dbTest("GET /workspaces/:id forbidden for non-member", async () => {
  const token = await loginAs("owner");
  const otherWsId = getOtherWorkspaceUuid();
  const res = await request(getTestApp())
    .get(`/api/v1/workspaces/${otherWsId}`)
    .set(authHeader(token));
  assert.equal(res.status, 403);
});

dbTest("POST /workspaces creates new workspace for admin", async () => {
  const token = await loginAs("owner");
  const res = await request(getTestApp())
    .post("/api/v1/workspaces")
    .set(authHeader(token))
    .send({ name: "Agency Alpha", slug: "agency-alpha-test" });
  assert.equal(res.status, 201);
});

dbTest("GET /workspaces lists memberships for specialist", async () => {
  const token = await loginAs("writer");
  const res = await request(getTestApp()).get("/api/v1/workspaces").set(authHeader(token));
  assert.equal(res.status, 200);
  assert.ok(res.body.data.length >= 1);
  assert.equal(res.body.data[0].accountRole, "writer");
});

dbTest("POST /workspaces forbidden for writer specialist", async () => {
  const token = await loginAs("writer");
  const res = await request(getTestApp())
    .post("/api/v1/workspaces")
    .set(authHeader(token))
    .send({ name: "Writer WS", slug: "writer-ws-test" });
  assert.equal(res.status, 403);
});

dbTest("GET /workspaces/:id/members lists demo team for owner", async () => {
  const token = await loginAs("owner");
  const wsId = getDemoWorkspaceUuid();
  const res = await request(getTestApp())
    .get(`/api/v1/workspaces/${wsId}/members`)
    .set(authHeader(token));
  assert.equal(res.status, 200);
  assert.ok(res.body.data.length >= 4);
});

dbTest("GET /workspaces/:id/members allowed for specialist members", async () => {
  const token = await loginAs("writer");
  const wsId = getDemoWorkspaceUuid();
  const res = await request(getTestApp())
    .get(`/api/v1/workspaces/${wsId}/members`)
    .set(authHeader(token));
  assert.equal(res.status, 200);
  assert.ok(res.body.data.some((m) => m.accountRole === "writer"));
});

dbTest("GET /workspaces/:id/members forbidden for non-members", async () => {
  const token = await loginAs("owner");
  const otherWsId = getOtherWorkspaceUuid();
  const res = await request(getTestApp())
    .get(`/api/v1/workspaces/${otherWsId}/members`)
    .set(authHeader(token));
  assert.equal(res.status, 403);
});
