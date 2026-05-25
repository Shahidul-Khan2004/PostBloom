import BackendError from "../lib/BackendError.js";
import { isSpecialist } from "../domain/permissions.js";
import * as userRepo from "../repositories/userRepository.js";
import * as workspaceRepo from "../repositories/workspaceRepository.js";
import * as memberRepo from "../repositories/workspaceMemberRepository.js";
import * as auditRepo from "../repositories/auditRepository.js";

const ASSIGNABLE_ROLES = ["user", "designer", "writer", "reviewer", "admin"];

export async function assignUserRole(actorUserId, userPublicUuid, roleCode) {
  if (!ASSIGNABLE_ROLES.includes(roleCode)) {
    throw new BackendError(422, "INVALID_ROLE", "Unknown role");
  }

  const user = await userRepo.findByPublicUuid(userPublicUuid);
  if (!user) throw new BackendError(404, "NOT_FOUND", "User not found");

  if (roleCode === "admin") {
    await userRepo.demoteCurrentAdmin(user.id);
  } else if (user.accountRole === "admin") {
    throw new BackendError(409, "ADMIN_REQUIRED", "Cannot demote the only admin without assigning a new admin");
  }

  const updated = await userRepo.updateAccountRole(user.id, roleCode);

  const actorWorkspaces = await memberRepo.listWorkspacesForUser(actorUserId);
  if (actorWorkspaces.length > 0) {
    const ws = await workspaceRepo.findByPublicUuid(actorWorkspaces[0].publicUuid);
    if (ws) {
      await auditRepo.record({
        workspaceId: ws.id,
        actorId: actorUserId,
        entityType: "user",
        entityId: user.id,
        entityPublicUuid: user.publicUuid,
        action: "role_assigned",
        metadata: { roleCode },
      });
    }
  }

  return updated;
}

export async function addUserToWorkspace(actorUserId, userPublicUuid, workspacePublicUuid) {
  const user = await userRepo.findByPublicUuid(userPublicUuid);
  if (!user) throw new BackendError(404, "NOT_FOUND", "User not found");

  if (!isSpecialist(user.accountRole) && user.accountRole !== "admin") {
    throw new BackendError(
      422,
      "INVALID_MEMBER",
      "Only specialist or admin accounts can be added to workspaces this way"
    );
  }

  const workspace = await workspaceRepo.findByPublicUuid(workspacePublicUuid);
  if (!workspace) throw new BackendError(404, "NOT_FOUND", "Workspace not found");

  await memberRepo.addMember(workspace.id, user.id);

  await auditRepo.record({
    workspaceId: workspace.id,
    actorId: actorUserId,
    entityType: "workspace_member",
    action: "member_added",
    metadata: { userPublicUuid, accountRole: user.accountRole },
  });

  return memberRepo.listMembers(workspace.id);
}
