import BackendError from "../lib/BackendError.js";
import { canCreateWorkspace } from "../domain/permissions.js";
import * as workspaceRepo from "../repositories/workspaceRepository.js";
import * as memberRepo from "../repositories/workspaceMemberRepository.js";
import * as analyticsRepo from "../repositories/analyticsRepository.js";
import * as auditRepo from "../repositories/auditRepository.js";

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function createWorkspace(actorUserId, accountRole, { name, slug }) {
  if (!canCreateWorkspace(accountRole)) {
    throw new BackendError(
      403,
      "FORBIDDEN",
      "Specialist accounts cannot create workspaces"
    );
  }
  const finalSlug = slug ?? slugify(name);
  if (await workspaceRepo.slugExists(finalSlug)) {
    throw new BackendError(409, "SLUG_EXISTS", "Workspace slug already taken");
  }
  const workspace = await workspaceRepo.create({ name, slug: finalSlug });
  await memberRepo.addMember(workspace.id, actorUserId);
  await analyticsRepo.getOrCreateCreatorAccount(workspace.id);
  await auditRepo.record({
    workspaceId: workspace.id,
    actorId: actorUserId,
    entityType: "workspace",
    entityId: workspace.id,
    entityPublicUuid: workspace.publicUuid,
    action: "created",
    metadata: { name },
  });
  return workspace;
}

export async function listWorkspaces(actorUserId) {
  return memberRepo.listWorkspacesForUser(actorUserId);
}

export async function getWorkspace(publicUuid, actorUserId) {
  const workspace = await workspaceRepo.findByPublicUuid(publicUuid);
  if (!workspace) throw new BackendError(404, "NOT_FOUND", "Workspace not found");
  const membership = await memberRepo.findMembershipWithPermissions(actorUserId, publicUuid);
  if (!membership) {
    throw new BackendError(403, "FORBIDDEN", "Not a workspace member");
  }
  const hasImport = await analyticsRepo.hasCompletedImport(workspace.id);
  return {
    ...workspace,
    setup: {
      hasImport,
      canCreateCampaign: hasImport,
    },
  };
}

export async function listMembers(workspacePublicUuid, actorUserId) {
  const workspace = await workspaceRepo.findByPublicUuid(workspacePublicUuid);
  if (!workspace) throw new BackendError(404, "NOT_FOUND", "Workspace not found");
  const membership = await memberRepo.findMembershipWithPermissions(actorUserId, workspacePublicUuid);
  if (!membership) {
    throw new BackendError(403, "FORBIDDEN", "Not a workspace member");
  }
  return memberRepo.listMembers(workspace.id);
}
