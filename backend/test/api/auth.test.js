import "../setup.js";
import assert from "node:assert/strict";
import request from "supertest";
import { test } from "node:test";
import { getTestApp } from "../helpers/app.js";
import { loginAs, authHeader } from "../helpers/auth.js";
import { dbTest } from "../helpers/dbTest.js";

test("GET /auth/me requires auth", async () => {
  const res = await request(getTestApp()).get("/api/v1/auth/me");
  assert.equal(res.status, 401);
});

dbTest("POST /auth/login succeeds for demo owner", async () => {
  const res = await request(getTestApp())
    .post("/api/v1/auth/login")
    .send({ email: "owner@demo.postbloom", password: "Demo1234!" });
  assert.equal(res.status, 200);
  assert.ok(res.body.data.token);
});

dbTest("POST /auth/login fails with wrong password", async () => {
  const res = await request(getTestApp())
    .post("/api/v1/auth/login")
    .send({ email: "owner@demo.postbloom", password: "wrong" });
  assert.equal(res.status, 401);
});

dbTest("GET /auth/me returns user when authenticated", async () => {
  const token = await loginAs("owner");
  const res = await request(getTestApp())
    .get("/api/v1/auth/me")
    .set(authHeader(token));
  assert.equal(res.status, 200);
  assert.equal(res.body.data.accountRole, "admin");
});

dbTest("POST /auth/register creates user", async () => {
  const res = await request(getTestApp())
    .post("/api/v1/auth/register")
    .send({
      email: "newuser@test.postbloom",
      password: "TestPass123!",
      displayName: "New User",
    });
  assert.equal(res.status, 201);
});
