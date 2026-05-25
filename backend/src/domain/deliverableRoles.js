const WRITER_PLATFORMS = new Set(["instagram_carousel", "threads_thread"]);
const DESIGNER_PLATFORMS = new Set(["youtube_short", "tiktok_reel"]);

/** Maps platform template code to the specialist role needed to produce it. */
export function specialistRoleForPlatform(platformCode) {
  if (WRITER_PLATFORMS.has(platformCode)) return "writer";
  if (DESIGNER_PLATFORMS.has(platformCode)) return "designer";
  return null;
}

/** Roles that can be requested via deliverable staff-requests (platform-wide broadcast). */
export function isStaffRequestRole(roleCode) {
  return roleCode === "writer" || roleCode === "designer" || roleCode === "reviewer";
}

/** @deprecated Use isStaffRequestRole */
export function isDeliverableStaffRole(roleCode) {
  return isStaffRequestRole(roleCode);
}
