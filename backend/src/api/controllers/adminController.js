import * as adminService from "../../services/adminService.js";
import * as adminAnalyticsService from "../../services/adminAnalyticsService.js";

export async function assignRole(req, res) {
  const { userId } = req.validated?.params ?? req.params;
  const { roleCode } = req.validated?.body ?? req.body;
  const user = await adminService.assignUserRole(req.actorUserId, userId, roleCode);
  res.status(200).json({ data: user });
}

export async function addToWorkspace(req, res) {
  const { userId, workspaceId } = req.validated?.params ?? req.params;
  const members = await adminService.addUserToWorkspace(
    req.actorUserId,
    userId,
    workspaceId
  );
  res.status(200).json({ data: members });
}

export async function specialistAnalytics(req, res) {
  const role = req.query.role;
  const data = await adminAnalyticsService.getSpecialistMetrics({ role });
  res.status(200).json({ data });
}
