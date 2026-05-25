import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { getTestApp } from "../helpers/app.js";

test("GET /health returns ok", async () => {
  const res = await request(getTestApp()).get("/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, "ok");
});

test("GET /api/docs/openapi.json returns spec", async () => {
  const res = await request(getTestApp()).get("/api/docs/openapi.json");
  assert.equal(res.status, 200);
  assert.equal(res.body.openapi, "3.0.3");
  assert.ok(res.body.paths["/health"]);
});
