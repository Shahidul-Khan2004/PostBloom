import "../setup.js";
import assert from "node:assert/strict";
import request from "supertest";
import { getTestApp } from "../helpers/app.js";
import { loginAs, authHeader } from "../helpers/auth.js";
import { getDemoWorkspaceUuid } from "../helpers/seed.js";
import { dbTest } from "../helpers/dbTest.js";

dbTest("platform admin assigns specialist role by user UUID", async () => {
  const adminToken = await loginAs("owner");
  const wsId = getDemoWorkspaceUuid();

  const registerRes = await request(getTestApp())
    .post("/api/v1/auth/register")
    .send({
      email: "newspecialist@test.postbloom",
      password: "Demo1234!",
      displayName: "New Specialist",
    });
  assert.equal(registerRes.status, 201);
  const userUuid = registerRes.body.data.user.publicUuid;

  const assignRes = await request(getTestApp())
    .post(`/api/v1/admin/users/${userUuid}/role`)
    .set(authHeader(adminToken))
    .send({ roleCode: "writer" });
  assert.equal(assignRes.status, 200);
  assert.equal(assignRes.body.data.accountRole, "writer");

  const addRes = await request(getTestApp())
    .post(`/api/v1/admin/users/${userUuid}/workspaces/${wsId}`)
    .set(authHeader(adminToken));
  assert.equal(addRes.status, 200);

  const createWsRes = await request(getTestApp())
    .post("/api/v1/workspaces")
    .set(authHeader(registerRes.body.data.token))
    .send({ name: "Blocked Workspace", slug: "blocked-ws-test" });
  assert.equal(createWsRes.status, 403);
});

dbTest("non-admin cannot assign roles", async () => {
  const writerToken = await loginAs("writer");
  const adminToken = await loginAs("owner");
  const meRes = await request(getTestApp()).get("/api/v1/auth/me").set(authHeader(adminToken));
  const adminUuid = meRes.body.data.publicUuid;

  const res = await request(getTestApp())
    .post(`/api/v1/admin/users/${adminUuid}/role`)
    .set(authHeader(writerToken))
    .send({ roleCode: "reviewer" });
  assert.equal(res.status, 403);
});
