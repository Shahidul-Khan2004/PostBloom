import * as campaignService from "../../services/campaignService.js";
import * as auditRepo from "../../repositories/auditRepository.js";

export async function create(req, res) {
  const body = req.validated?.body ?? req.body;
  const result = await campaignService.createCampaign(req.workspaceId, req.actorUserId, body);
  res.status(201).json({
    data: {
      publicUuid: result.campaign.public_uuid,
      name: result.campaign.name,
      deliverableCount: result.deliverables.length,
    },
  });
}

export async function list(req, res) {
  const data = await campaignService.listCampaigns(req.workspaceId);
  res.status(200).json({ data });
}

export async function get(req, res) {
  const { campaignId } = req.params;
  const data = await campaignService.getCampaign(req.workspaceId, campaignId);
  res.status(200).json({ data });
}

export async function transitionStatus(req, res) {
  const { campaignId } = req.params;
  const body = req.validated?.body ?? req.body;
  const data = await campaignService.transitionCampaign(
    req.workspaceId,
    campaignId,
    req.actorUserId,
    body.statusCode,
    body.notes
  );
  res.status(200).json({ data });
}

export async function listDeliverables(req, res) {
  const { campaignId } = req.params;
  const data = await campaignService.listDeliverablesForCampaign(req.workspaceId, campaignId);
  res.status(200).json({ data });
}

export async function addDeliverable(req, res) {
  const { campaignId } = req.validated?.params ?? req.params;
  const body = req.validated?.body ?? req.body;
  const data = await campaignService.addDeliverable(
    req.workspaceId,
    campaignId,
    req.actorUserId,
    body
  );
  res.status(201).json({ data });
}

export async function submitVersion(req, res) {
  const { deliverableId } = req.params;
  const body = req.validated?.body ?? req.body;
  const data = await campaignService.submitVersion(
    req.workspaceId,
    deliverableId,
    req.actorUserId,
    req.user.accountRole,
    body
  );
  res.status(201).json({ data });
}

export async function review(req, res) {
  const { deliverableId } = req.params;
  const body = req.validated?.body ?? req.body;
  const data = await campaignService.reviewDeliverable(
    req.workspaceId,
    deliverableId,
    req.actorUserId,
    req.user.accountRole,
    body
  );
  res.status(200).json({ data });
}

export async function myWork(req, res) {
  const data = await campaignService.listMyWork(req.actorUserId, req.workspaceId);
  res.status(200).json({ data });
}

export async function reviewQueue(req, res) {
  const data = await campaignService.listReviewQueue(
    req.workspaceId,
    req.actorUserId,
    req.user.accountRole
  );
  res.status(200).json({ data });
}

export async function exportReady(req, res) {
  const { campaignId } = req.params;
  const data = await campaignService.getExportReady(req.workspaceId, campaignId);
  res.status(200).json({ data });
}

export async function addComment(req, res) {
  const { deliverableId } = req.params;
  const body = req.validated?.body ?? req.body;
  const data = await campaignService.addComment(
    req.workspaceId,
    deliverableId,
    req.actorUserId,
    body.body
  );
  res.status(201).json({ data });
}

export async function listComments(req, res) {
  const { deliverableId } = req.params;
  const data = await campaignService.listComments(req.workspaceId, deliverableId);
  res.status(200).json({ data });
}

export async function listPlatforms(req, res) {
  const data = await campaignService.listPlatformTypes();
  res.status(200).json({ data });
}

export async function activity(req, res) {
  const entityType = req.query.entity;
  const data = await auditRepo.listByWorkspace(req.workspaceId, { entityType });
  res.status(200).json({ data });
}
