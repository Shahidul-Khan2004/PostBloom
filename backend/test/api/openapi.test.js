import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { swaggerSpec } from "../../src/config/swagger.js";
import { getTestApp } from "../helpers/app.js";

/** @type {Array<{ method: string; path: string; requiresInput?: boolean }>} */
export const OPENAPI_OPERATIONS = [
  { method: "get", path: "/health" },
  { method: "post", path: "/api/v1/auth/register", requiresInput: true },
  { method: "post", path: "/api/v1/auth/login", requiresInput: true },
  { method: "get", path: "/api/v1/auth/me" },
  { method: "get", path: "/api/v1/workspaces" },
  { method: "post", path: "/api/v1/workspaces", requiresInput: true },
  { method: "get", path: "/api/v1/workspaces/{workspaceId}", requiresInput: true },
  { method: "get", path: "/api/v1/workspaces/{workspaceId}/members", requiresInput: true },
  { method: "post", path: "/api/v1/admin/users/{userId}/role", requiresInput: true },
  {
    method: "post",
    path: "/api/v1/admin/users/{userId}/workspaces/{workspaceId}",
    requiresInput: true,
  },
  { method: "get", path: "/api/v1/admin/analytics/specialists" },
  { method: "post", path: "/api/v1/workspaces/{workspaceId}/analytics/import", requiresInput: true },
  { method: "get", path: "/api/v1/workspaces/{workspaceId}/analytics/imports", requiresInput: true },
  {
    method: "get",
    path: "/api/v1/workspaces/{workspaceId}/analytics/imports/{importId}/summary",
    requiresInput: true,
  },
  { method: "get", path: "/api/v1/workspaces/{workspaceId}/opportunities", requiresInput: true },
  {
    method: "get",
    path: "/api/v1/workspaces/{workspaceId}/opportunities/{opportunityId}",
    requiresInput: true,
  },
  {
    method: "patch",
    path: "/api/v1/workspaces/{workspaceId}/opportunities/{opportunityId}/enrich",
    requiresInput: true,
  },
  { method: "get", path: "/api/v1/platforms" },
  { method: "post", path: "/api/v1/workspaces/{workspaceId}/campaigns", requiresInput: true },
  { method: "get", path: "/api/v1/workspaces/{workspaceId}/campaigns", requiresInput: true },
  { method: "get", path: "/api/v1/workspaces/{workspaceId}/my-work", requiresInput: true },
  { method: "get", path: "/api/v1/workspaces/{workspaceId}/review-queue", requiresInput: true },
  { method: "get", path: "/api/v1/workspaces/{workspaceId}/activity", requiresInput: true },
  { method: "get", path: "/api/v1/campaigns/{campaignId}", requiresInput: true },
  { method: "post", path: "/api/v1/campaigns/{campaignId}/status", requiresInput: true },
  { method: "get", path: "/api/v1/campaigns/{campaignId}/deliverables", requiresInput: true },
  {
    method: "post",
    path: "/api/v1/campaigns/{campaignId}/deliverables",
    requiresInput: true,
  },
  { method: "get", path: "/api/v1/campaigns/{campaignId}/export-ready", requiresInput: true },
  { method: "get", path: "/api/v1/campaigns/{campaignId}/staff-requests", requiresInput: true },
  { method: "post", path: "/api/v1/staff-requests/{requestId}/accept", requiresInput: true },
  { method: "get", path: "/api/v1/specialist/staff-requests" },
  {
    method: "post",
    path: "/api/v1/deliverables/{deliverableId}/staff-requests",
    requiresInput: true,
  },
  {
    method: "get",
    path: "/api/v1/deliverables/{deliverableId}/staff-requests",
    requiresInput: true,
  },
  {
    method: "delete",
    path: "/api/v1/deliverables/{deliverableId}/staff-requests/{roleCode}",
    requiresInput: true,
  },
  { method: "post", path: "/api/v1/deliverables/{deliverableId}/versions", requiresInput: true },
  { method: "post", path: "/api/v1/deliverables/{deliverableId}/review", requiresInput: true },
  { method: "get", path: "/api/v1/deliverables/{deliverableId}/comments", requiresInput: true },
  { method: "post", path: "/api/v1/deliverables/{deliverableId}/comments", requiresInput: true },
  { method: "get", path: "/api/v1/notifications", requiresInput: true },
  { method: "patch", path: "/api/v1/notifications/{id}/read", requiresInput: true },
];

function has2xxResponse(responses) {
  return Object.keys(responses).some((code) => code.startsWith("2"));
}

function hasInput(operation) {
  const params = operation.parameters ?? [];
  const hasParams = params.length > 0;
  const hasBody = Boolean(operation.requestBody);
  return hasParams || hasBody;
}

test("GET /api/docs/openapi.json returns spec", async () => {
  const res = await request(getTestApp()).get("/api/docs/openapi.json");
  assert.equal(res.status, 200);
  assert.equal(res.body.openapi, "3.0.3");
  assert.ok(res.body.paths["/health"]);
});

test("OpenAPI spec documents every API operation", () => {
  const paths = swaggerSpec.paths ?? {};

  for (const { method, path, requiresInput } of OPENAPI_OPERATIONS) {
    const pathItem = paths[path];
    assert.ok(pathItem, `missing path ${path}`);
    const operation = pathItem[method];
    assert.ok(operation, `missing ${method.toUpperCase()} ${path}`);
    assert.ok(operation.responses, `missing responses for ${method.toUpperCase()} ${path}`);
    assert.ok(
      has2xxResponse(operation.responses),
      `missing 2xx response for ${method.toUpperCase()} ${path}`
    );

    if (requiresInput) {
      assert.ok(
        hasInput(operation),
        `missing parameters or requestBody for ${method.toUpperCase()} ${path}`
      );
    }
  }

  const documented = Object.entries(paths).flatMap(([p, item]) =>
    Object.keys(item).filter((m) => !m.startsWith("$")).map((m) => `${m.toUpperCase()} ${p}`)
  );
  assert.equal(
    documented.length,
    OPENAPI_OPERATIONS.length,
    `unexpected extra/missing paths: ${documented.join(", ")}`
  );
});
