import { Router } from "express";
import multer from "multer";
import validate from "../middlewares/validate.js";
import { requireAuth, requirePermission } from "../middlewares/auth.js";
import { workspaceIdParam, enrichOpportunitySchema } from "../validators/schemas.js";
import { env } from "../../config/env.js";
import * as analyticsController from "../controllers/analyticsController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadBytes },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.originalname.endsWith(".xlsx");
    cb(ok ? null : new Error("Only XLSX files allowed"), ok);
  },
});

const router = Router({ mergeParams: true });

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}/analytics/import:
 *   post:
 *     summary: Import LinkedIn analytics XLSX
 *     tags: [Analytics]
 *     parameters:
 *       - $ref: '#/components/parameters/WorkspaceId'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Import completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DataEnvelope'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/import",
  requireAuth,
  validate("params", workspaceIdParam, "params"),
  requirePermission("analytics:import"),
  upload.single("file"),
  analyticsController.importFile
);

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}/analytics/imports:
 *   get:
 *     summary: List analytics imports
 *     tags: [Analytics]
 *     parameters:
 *       - $ref: '#/components/parameters/WorkspaceId'
 *     responses:
 *       200:
 *         description: Import history
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DataEnvelope'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  "/imports",
  requireAuth,
  validate("params", workspaceIdParam, "params"),
  requirePermission("analytics:import"),
  analyticsController.listImports
);

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}/analytics/imports/{importId}/summary:
 *   get:
 *     summary: Get import summary
 *     tags: [Analytics]
 *     parameters:
 *       - $ref: '#/components/parameters/WorkspaceId'
 *       - $ref: '#/components/parameters/ImportId'
 *     responses:
 *       200:
 *         description: Import summary metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DataEnvelope'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  "/imports/:importId/summary",
  requireAuth,
  validate("params", workspaceIdParam, "params"),
  requirePermission("analytics:import"),
  analyticsController.importSummary
);

export default router;
