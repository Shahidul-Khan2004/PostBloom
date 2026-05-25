import jwt from "jsonwebtoken";
import BackendError from "../../lib/BackendError.js";
import { env } from "../../config/env.js";
import { permissionsForAccountRole } from "../../domain/permissions.js";
import * as userRepo from "../../repositories/userRepository.js";
import * as memberRepo from "../../repositories/workspaceMemberRepository.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new BackendError(401, "UNAUTHORIZED", "Missing or invalid authorization"));
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await userRepo.findById(payload.sub);
    if (!user) {
      return next(new BackendError(401, "UNAUTHORIZED", "User not found"));
    }
    req.user = user;
    req.actorUserId = user.id;
    req.accountRole = user.accountRole;
    req.permissions = permissionsForAccountRole(user.accountRole);
    next();
  } catch {
    return next(new BackendError(401, "UNAUTHORIZED", "Invalid or expired token"));
  }
}

export function requirePlatformAdmin(req, res, next) {
  if (req.accountRole !== "admin") {
    return next(new BackendError(403, "FORBIDDEN", "Platform admin required"));
  }
  next();
}

export function requirePermission(...permissionCodes) {
  return async (req, res, next) => {
    const workspaceUuid = req.params.workspaceId ?? req.params.id ?? req.workspaceUuid;
    if (!workspaceUuid) {
      return next(new BackendError(400, "BAD_REQUEST", "Workspace context required"));
    }

    const membership = await memberRepo.findMembershipWithPermissions(
      req.actorUserId,
      workspaceUuid
    );
    if (!membership) {
      return next(new BackendError(403, "FORBIDDEN", "Not a workspace member"));
    }

    const hasAll = permissionCodes.every((code) => membership.permissions.includes(code));
    if (!hasAll) {
      return next(new BackendError(403, "FORBIDDEN", "Insufficient permissions"));
    }

    req.workspace = membership.workspace;
    req.workspaceId = membership.workspace.id;
    req.authz = {
      role: membership.roleCode,
      accountRole: membership.accountRole,
      permissions: membership.permissions,
    };
    next();
  };
}

export function requireWorkspaceMember(req, res, next) {
  return requirePermission()(req, res, next);
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  requireAuth(req, res, next);
}
