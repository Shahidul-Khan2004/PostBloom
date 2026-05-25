import * as analyticsService from "../../services/analyticsService.js";

export async function importFile(req, res) {
  const { workspaceId } = req.validated?.params ?? req.params;
  if (!req.file) {
    return res.status(422).json({ error: { code: "VALIDATION_ERROR", message: "XLSX file required" } });
  }
  const result = await analyticsService.importAnalytics(workspaceId, req.actorUserId, req.file);
  res.status(201).json({ data: result });
}

export async function listImports(req, res) {
  const imports = await analyticsService.listImports(req.workspaceId);
  res.status(200).json({ data: imports });
}

export async function importSummary(req, res) {
  const { importId } = req.params;
  const summary = await analyticsService.getImportSummary(req.workspaceId, importId);
  res.status(200).json({ data: summary });
}

export async function listOpportunities(req, res) {
  const sort = req.query.sort ?? "score";
  const data = await analyticsService.listOpportunities(req.workspaceId, { sort });
  res.status(200).json({ data });
}

export async function getOpportunity(req, res) {
  const { opportunityId } = req.params;
  const data = await analyticsService.getOpportunity(req.workspaceId, opportunityId);
  res.status(200).json({ data });
}

export async function enrich(req, res) {
  const { opportunityId } = req.params;
  const body = req.validated?.body ?? req.body;
  const data = await analyticsService.enrichOpportunity(
    req.workspaceId,
    opportunityId,
    req.actorUserId,
    body
  );
  res.status(200).json({ data });
}
