import { Router } from "express";
import validate from "../middlewares/validate.js";
import { requireAuth, requirePermission } from "../middlewares/auth.js";
import { workspaceIdParam, enrichOpportunitySchema } from "../validators/schemas.js";
import * as analyticsController from "../controllers/analyticsController.js";

const router = Router({ mergeParams: true });

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}/opportunities:
 *   get:
 *     summary: Ranked opportunity feed
 *     tags: [Opportunities]
 *     parameters:
 *       - $ref: '#/components/parameters/WorkspaceId'
 *       - name: sort
 *         in: query
 *         schema:
 *           type: string
 *           enum: [score, date]
 *           default: score
 *     responses:
 *       200:
 *         description: Ranked opportunities
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
  "/",
  requireAuth,
  validate("params", workspaceIdParam, "params"),
  requirePermission("analytics:import"),
  analyticsController.listOpportunities
);

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}/opportunities/{opportunityId}:
 *   get:
 *     summary: Get opportunity detail
 *     tags: [Opportunities]
 *     parameters:
 *       - $ref: '#/components/parameters/WorkspaceId'
 *       - $ref: '#/components/parameters/OpportunityId'
 *     responses:
 *       200:
 *         description: Opportunity detail
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
  "/:opportunityId",
  requireAuth,
  validate("params", workspaceIdParam, "params"),
  requirePermission("analytics:import"),
  analyticsController.getOpportunity
);

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}/opportunities/{opportunityId}/enrich:
 *   patch:
 *     summary: Enrich opportunity metadata
 *     tags: [Opportunities]
 *     parameters:
 *       - $ref: '#/components/parameters/WorkspaceId'
 *       - $ref: '#/components/parameters/OpportunityId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               excerpt: { type: string }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Updated opportunity
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
router.patch(
  "/:opportunityId/enrich",
  requireAuth,
  validate("params", workspaceIdParam, "params"),
  validate("enrich", enrichOpportunitySchema),
  requirePermission("opportunity:enrich"),
  analyticsController.enrich
);

export default router;
