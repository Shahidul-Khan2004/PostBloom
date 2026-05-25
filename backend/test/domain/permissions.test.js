import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canCreateWorkspace,
  permissionsForAccountRole,
  PERMISSIONS,
} from "../../src/domain/permissions.js";

test("admin has full permissions", () => {
  const perms = permissionsForAccountRole("admin");
  assert.ok(perms.includes(PERMISSIONS.CAMPAIGN_CREATE));
  assert.ok(perms.includes(PERMISSIONS.DELIVERABLE_COMMENT));
});

test("writer cannot create workspace", () => {
  assert.equal(canCreateWorkspace("writer"), false);
  assert.equal(canCreateWorkspace("user"), true);
});

test("user can import analytics and create campaigns", () => {
  const perms = permissionsForAccountRole("user");
  assert.ok(perms.includes(PERMISSIONS.ANALYTICS_IMPORT));
  assert.ok(perms.includes(PERMISSIONS.CAMPAIGN_CREATE));
});

test("reviewer can comment and review", () => {
  const perms = permissionsForAccountRole("reviewer");
  assert.ok(perms.includes(PERMISSIONS.DELIVERABLE_REVIEW));
  assert.ok(perms.includes(PERMISSIONS.DELIVERABLE_COMMENT));
});
