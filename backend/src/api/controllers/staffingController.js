import * as staffingService from "../../services/staffingService.js";

export async function listRequests(req, res) {
  const { campaignId } = req.validated?.params ?? req.params;
  const data = await staffingService.listStaffRequests(req.workspaceId, campaignId);
  res.status(200).json({ data });
}

export async function acceptRequest(req, res) {
  const { requestId } = req.validated?.params ?? req.params;
  const data = await staffingService.acceptStaffRequest(
    requestId,
    req.actorUserId,
    req.user.accountRole
  );
  res.status(200).json({ data });
}

export async function createDeliverableRequest(req, res) {
  const { deliverableId } = req.validated?.params ?? req.params;
  const body = req.validated?.body ?? req.body;
  const data = await staffingService.createDeliverableStaffRequest(
    req.workspaceId,
    deliverableId,
    req.actorUserId,
    body
  );
  res.status(201).json({ data });
}

export async function listDeliverableRequests(req, res) {
  const { deliverableId } = req.validated?.params ?? req.params;
  const data = await staffingService.listDeliverableStaffRequests(
    req.workspaceId,
    deliverableId
  );
  res.status(200).json({ data });
}

export async function cancelDeliverableRequest(req, res) {
  const { deliverableId, roleCode } = req.validated?.params ?? req.params;
  const data = await staffingService.cancelDeliverableStaffRequest(
    req.workspaceId,
    deliverableId,
    roleCode
  );
  res.status(200).json({ data });
}

export async function listInbox(req, res) {
  const status = req.query.status ?? "pending";
  const data = await staffingService.listSpecialistInbox(
    req.actorUserId,
    req.user.accountRole,
    { status }
  );
  res.status(200).json({ data });
}
