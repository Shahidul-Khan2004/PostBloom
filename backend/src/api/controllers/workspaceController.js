import * as workspaceService from "../../services/workspaceService.js";

export async function create(req, res) {
  const body = req.validated?.body ?? req.body;
  const workspace = await workspaceService.createWorkspace(
    req.actorUserId,
    req.accountRole,
    body
  );
  res.status(201).json({ data: workspace });
}

export async function list(req, res) {
  const workspaces = await workspaceService.listWorkspaces(req.actorUserId);
  res.status(200).json({ data: workspaces });
}

export async function get(req, res) {
  const { workspaceId } = req.validated?.params ?? req.params;
  const workspace = await workspaceService.getWorkspace(workspaceId, req.actorUserId);
  res.status(200).json({ data: workspace });
}

export async function listMembers(req, res) {
  const { workspaceId } = req.validated?.params ?? req.params;
  const members = await workspaceService.listMembers(workspaceId, req.actorUserId);
  res.status(200).json({ data: members });
}
