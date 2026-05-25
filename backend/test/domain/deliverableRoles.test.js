import assert from "node:assert/strict";
import { test } from "node:test";
import {
  specialistRoleForPlatform,
  isDeliverableStaffRole,
} from "../../src/domain/deliverableRoles.js";

test("specialistRoleForPlatform maps templates to writer or designer", () => {
  assert.equal(specialistRoleForPlatform("instagram_carousel"), "writer");
  assert.equal(specialistRoleForPlatform("threads_thread"), "writer");
  assert.equal(specialistRoleForPlatform("youtube_short"), "designer");
  assert.equal(specialistRoleForPlatform("tiktok_reel"), "designer");
  assert.equal(specialistRoleForPlatform("unknown"), null);
});

test("isDeliverableStaffRole includes reviewer", () => {
  assert.equal(isDeliverableStaffRole("writer"), true);
  assert.equal(isDeliverableStaffRole("designer"), true);
  assert.equal(isDeliverableStaffRole("reviewer"), true);
});
