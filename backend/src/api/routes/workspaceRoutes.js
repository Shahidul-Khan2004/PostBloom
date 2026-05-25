import { Router } from "express";
import validate from "../middlewares/validate.js";
import { requireAuth, requireWorkspaceMember } from "../middlewares/auth.js";
import { createWorkspaceSchema, workspaceIdParam } from "../validators/schemas.js";
import * as workspaceController from "../controllers/workspaceController.js";

const router = Router();

/**
 * @openapi
 * /api/v1/workspaces:
 *   get:
 *     summary: List workspaces for current user
 *     tags: [Workspaces]
 *     responses:
 *       200:
 *         description: Workspaces the user belongs to
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", requireAuth, workspaceController.list);

/**
 * @openapi
 * /api/v1/workspaces:
 *   post:
 *     summary: Create workspace (user or admin accounts only)
 *     tags: [Workspaces]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *     responses:
 *       201:
 *         description: Workspace created
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  "/",
  requireAuth,
  validate("workspace", createWorkspaceSchema),
  workspaceController.create
);

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}:
 *   get:
 *     summary: Get workspace
 *     tags: [Workspaces]
 *     parameters:
 *       - $ref: '#/components/parameters/WorkspaceId'
 *     responses:
 *       200:
 *         description: Workspace details
 */
router.get(
  "/:workspaceId",
  requireAuth,
  validate("params", workspaceIdParam, "params"),
  workspaceController.get
);

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}/members:
 *   get:
 *     summary: List workspace members (any workspace member)
 *     tags: [Workspaces]
 *     parameters:
 *       - $ref: '#/components/parameters/WorkspaceId'
 *     responses:
 *       200:
 *         description: Workspace members
 */
router.get(
  "/:workspaceId/members",
  requireAuth,
  validate("params", workspaceIdParam, "params"),
  requireWorkspaceMember,
  workspaceController.listMembers
);

export default router;
