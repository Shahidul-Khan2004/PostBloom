import { Router } from "express";
import validate from "../middlewares/validate.js";
import { requireAuth, requirePlatformAdmin } from "../middlewares/auth.js";
import {
  assignRoleSchema,
  adminUserIdParam,
  adminAddWorkspaceParams,
} from "../validators/schemas.js";
import * as adminController from "../controllers/adminController.js";

const router = Router();

/**
 * @openapi
 * /api/v1/admin/users/{userId}/role:
 *   post:
 *     summary: Assign global account role (platform admin only)
 *     tags: [Admin]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleCode]
 *             properties:
 *               roleCode:
 *                 type: string
 *                 enum: [user, designer, writer, reviewer, admin]
 *     responses:
 *       200:
 *         description: User role updated
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  "/users/:userId/role",
  requireAuth,
  requirePlatformAdmin,
  validate("params", adminUserIdParam, "params"),
  validate("body", assignRoleSchema),
  adminController.assignRole
);

/**
 * @openapi
 * /api/v1/admin/users/{userId}/workspaces/{workspaceId}:
 *   post:
 *     summary: Add user to workspace (platform admin only)
 *     tags: [Admin]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - $ref: '#/components/parameters/WorkspaceId'
 *     responses:
 *       200:
 *         description: Workspace members after add
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  "/users/:userId/workspaces/:workspaceId",
  requireAuth,
  requirePlatformAdmin,
  validate("params", adminAddWorkspaceParams, "params"),
  adminController.addToWorkspace
);

/**
 * @openapi
 * /api/v1/admin/analytics/specialists:
 *   get:
 *     summary: Specialist campaign participation and completion metrics
 *     tags: [Admin]
 *     parameters:
 *       - name: role
 *         in: query
 *         schema:
 *           type: string
 *           enum: [writer, designer, reviewer]
 *     responses:
 *       200:
 *         description: Per-specialist accountability metrics
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  "/analytics/specialists",
  requireAuth,
  requirePlatformAdmin,
  adminController.specialistAnalytics
);

export default router;
