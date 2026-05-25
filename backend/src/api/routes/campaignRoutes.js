import { Router } from "express";
import validate from "../middlewares/validate.js";
import { requireAuth, requirePermission } from "../middlewares/auth.js";
import {
  loadCampaignWorkspace,
  loadDeliverableWorkspace,
  requireCampaignPermission,
  requireCampaignPermissionAny,
} from "../middlewares/campaignContext.js";
import {
  workspaceIdParam,
  createCampaignSchema,
  createDeliverableSchema,
  campaignStatusSchema,
  submitVersionSchema,
  reviewSchema,
  commentSchema,
  createDeliverableStaffRequestSchema,
  campaignIdParam,
  deliverableIdParam,
  deliverableStaffCancelParams,
  staffRequestIdParam,
} from "../validators/schemas.js";
import * as campaignController from "../controllers/campaignController.js";
import * as staffingController from "../controllers/staffingController.js";

const router = Router();

/**
 * @openapi
 * /api/v1/platforms:
 *   get:
 *     summary: List platform deliverable templates
 *     tags: [Campaigns]
 *     responses:
 *       200:
 *         description: Platform types and deliverable templates
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DataEnvelope'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/platforms", requireAuth, campaignController.listPlatforms);

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}/campaigns:
 *   post:
 *     summary: Create campaign from opportunity
 *     tags: [Campaigns]
 *     parameters:
 *       - $ref: '#/components/parameters/WorkspaceId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [opportunityUuid, name, platformCodes]
 *             properties:
 *               opportunityUuid: { type: string, format: uuid }
 *               name: { type: string }
 *               platformCodes:
 *                 type: array
 *                 items: { type: string }
 *               dueDate: { type: string, format: date, example: "2026-06-01" }
 *     responses:
 *       201:
 *         description: Campaign created
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
  "/workspaces/:workspaceId/campaigns",
  requireAuth,
  validate("params", workspaceIdParam, "params"),
  validate("campaign", createCampaignSchema),
  requirePermission("campaign:create"),
  campaignController.create
);

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}/campaigns:
 *   get:
 *     summary: List campaigns in workspace
 *     tags: [Campaigns]
 *     parameters:
 *       - $ref: '#/components/parameters/WorkspaceId'
 *     responses:
 *       200:
 *         description: Campaign list
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
  "/workspaces/:workspaceId/campaigns",
  requireAuth,
  validate("params", workspaceIdParam, "params"),
  requirePermission("campaign:view"),
  campaignController.list
);

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}/my-work:
 *   get:
 *     summary: Deliverables assigned to current user
 *     tags: [Campaigns]
 *     parameters:
 *       - $ref: '#/components/parameters/WorkspaceId'
 *     responses:
 *       200:
 *         description: My work queue
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
  "/workspaces/:workspaceId/my-work",
  requireAuth,
  validate("params", workspaceIdParam, "params"),
  requirePermission("deliverable:submit"),
  campaignController.myWork
);

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}/review-queue:
 *   get:
 *     summary: Deliverables awaiting review
 *     tags: [Campaigns]
 *     parameters:
 *       - $ref: '#/components/parameters/WorkspaceId'
 *     responses:
 *       200:
 *         description: Review queue
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
  "/workspaces/:workspaceId/review-queue",
  requireAuth,
  validate("params", workspaceIdParam, "params"),
  requirePermission("deliverable:review"),
  campaignController.reviewQueue
);

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}/activity:
 *   get:
 *     summary: Workspace audit activity log
 *     tags: [Campaigns]
 *     parameters:
 *       - $ref: '#/components/parameters/WorkspaceId'
 *       - name: entity
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by entity type
 *     responses:
 *       200:
 *         description: Audit events
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
  "/workspaces/:workspaceId/activity",
  requireAuth,
  validate("params", workspaceIdParam, "params"),
  requirePermission("audit:view"),
  campaignController.activity
);

/**
 * @openapi
 * /api/v1/campaigns/{campaignId}:
 *   get:
 *     summary: Get campaign detail
 *     tags: [Campaigns]
 *     parameters:
 *       - $ref: '#/components/parameters/CampaignId'
 *     responses:
 *       200:
 *         description: Campaign detail
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
 */
router.get(
  "/campaigns/:campaignId",
  requireAuth,
  loadCampaignWorkspace,
  requireCampaignPermission("campaign:view"),
  campaignController.get
);

/**
 * @openapi
 * /api/v1/campaigns/{campaignId}/status:
 *   post:
 *     summary: Transition campaign status
 *     tags: [Campaigns]
 *     parameters:
 *       - $ref: '#/components/parameters/CampaignId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [statusCode]
 *             properties:
 *               statusCode: { type: string }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Campaign status updated
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
router.post(
  "/campaigns/:campaignId/status",
  requireAuth,
  loadCampaignWorkspace,
  validate("status", campaignStatusSchema),
  requireCampaignPermission("campaign:create"),
  campaignController.transitionStatus
);

/**
 * @openapi
 * /api/v1/campaigns/{campaignId}/deliverables:
 *   get:
 *     summary: List campaign deliverables
 *     tags: [Campaigns]
 *     parameters:
 *       - $ref: '#/components/parameters/CampaignId'
 *     responses:
 *       200:
 *         description: Deliverables for campaign
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
 */
router.get(
  "/campaigns/:campaignId/deliverables",
  requireAuth,
  loadCampaignWorkspace,
  requireCampaignPermission("campaign:view"),
  campaignController.listDeliverables
);

/**
 * @openapi
 * /api/v1/campaigns/{campaignId}/deliverables:
 *   post:
 *     summary: Add a deliverable from a platform template
 *     tags: [Campaigns]
 *     parameters:
 *       - $ref: '#/components/parameters/CampaignId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [platformCode]
 *             properties:
 *               platformCode: { type: string }
 *               title: { type: string }
 *               dueDate: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Deliverable created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/campaigns/:campaignId/deliverables",
  requireAuth,
  validate("params", campaignIdParam, "params"),
  loadCampaignWorkspace,
  validate("body", createDeliverableSchema),
  requireCampaignPermission("campaign:create"),
  campaignController.addDeliverable
);

/**
 * @openapi
 * /api/v1/campaigns/{campaignId}/export-ready:
 *   get:
 *     summary: List export-ready deliverables
 *     tags: [Campaigns]
 *     parameters:
 *       - $ref: '#/components/parameters/CampaignId'
 *     responses:
 *       200:
 *         description: Deliverables ready to publish
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
 */
router.get(
  "/campaigns/:campaignId/export-ready",
  requireAuth,
  loadCampaignWorkspace,
  requireCampaignPermission("campaign:view"),
  campaignController.exportReady
);

/**
 * @openapi
 * /api/v1/deliverables/{deliverableId}/versions:
 *   post:
 *     summary: Submit deliverable version
 *     tags: [Campaigns]
 *     parameters:
 *       - $ref: '#/components/parameters/DeliverableId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [payload]
 *             properties:
 *               payload:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       201:
 *         description: Version submitted
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
router.post(
  "/deliverables/:deliverableId/versions",
  requireAuth,
  loadDeliverableWorkspace,
  validate("version", submitVersionSchema),
  requireCampaignPermission("deliverable:submit"),
  campaignController.submitVersion
);

/**
 * @openapi
 * /api/v1/deliverables/{deliverableId}/review:
 *   post:
 *     summary: Review deliverable version
 *     tags: [Campaigns]
 *     parameters:
 *       - $ref: '#/components/parameters/DeliverableId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, request_revision]
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Review recorded
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
router.post(
  "/deliverables/:deliverableId/review",
  requireAuth,
  loadDeliverableWorkspace,
  validate("review", reviewSchema),
  requireCampaignPermissionAny("deliverable:review", "campaign:create"),
  campaignController.review
);

/**
 * @openapi
 * /api/v1/deliverables/{deliverableId}/comments:
 *   get:
 *     summary: List deliverable comments
 *     tags: [Campaigns]
 *     parameters:
 *       - $ref: '#/components/parameters/DeliverableId'
 *     responses:
 *       200:
 *         description: Comment thread
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
 */
router.get(
  "/deliverables/:deliverableId/comments",
  requireAuth,
  loadDeliverableWorkspace,
  requireCampaignPermission("campaign:view"),
  campaignController.listComments
);

/**
 * @openapi
 * /api/v1/deliverables/{deliverableId}/comments:
 *   post:
 *     summary: Add deliverable comment
 *     tags: [Campaigns]
 *     parameters:
 *       - $ref: '#/components/parameters/DeliverableId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             properties:
 *               body: { type: string }
 *     responses:
 *       201:
 *         description: Comment created
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
router.post(
  "/deliverables/:deliverableId/comments",
  requireAuth,
  loadDeliverableWorkspace,
  validate("comment", commentSchema),
  requireCampaignPermission("deliverable:comment"),
  campaignController.addComment
);

/**
 * @openapi
 * /api/v1/campaigns/{campaignId}/staff-requests:
 *   get:
 *     summary: List all deliverable staffing requests for a campaign
 *     tags: [Staffing]
 *     parameters:
 *       - name: campaignId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deliverable staff requests (platform-wide broadcast; accept-only)
 */
router.get(
  "/campaigns/:campaignId/staff-requests",
  requireAuth,
  validate("params", campaignIdParam, "params"),
  loadCampaignWorkspace,
  requireCampaignPermission("campaign:view"),
  staffingController.listRequests
);

/**
 * @openapi
 * /api/v1/staff-requests/{requestId}/accept:
 *   post:
 *     summary: Accept a broadcast staffing request (specialist)
 *     tags: [Staffing]
 *     parameters:
 *       - name: requestId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Request accepted and deliverables mapped
 */
router.post(
  "/staff-requests/:requestId/accept",
  requireAuth,
  validate("params", staffRequestIdParam, "params"),
  staffingController.acceptRequest
);

/**
 * @openapi
 * /api/v1/specialist/staff-requests:
 *   get:
 *     summary: Specialist inbox of pending staffing requests
 *     tags: [Staffing]
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending]
 *     responses:
 *       200:
 *         description: Pending staffing requests platform-wide for the specialist role
 */
router.get("/specialist/staff-requests", requireAuth, staffingController.listInbox);

/**
 * @openapi
 * /api/v1/deliverables/{deliverableId}/staff-requests:
 *   post:
 *     summary: Broadcast a specialist request for this deliverable (platform-wide)
 *     tags: [Staffing]
 *     parameters:
 *       - $ref: '#/components/parameters/DeliverableId'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roleCode:
 *                 type: string
 *                 enum: [writer, designer, reviewer]
 *     responses:
 *       201:
 *         description: Deliverable staff request created
 */
router.post(
  "/deliverables/:deliverableId/staff-requests",
  requireAuth,
  validate("params", deliverableIdParam, "params"),
  loadDeliverableWorkspace,
  validate("body", createDeliverableStaffRequestSchema),
  requireCampaignPermission("campaign:create"),
  staffingController.createDeliverableRequest
);

/**
 * @openapi
 * /api/v1/deliverables/{deliverableId}/staff-requests:
 *   get:
 *     summary: List staffing requests for a deliverable
 *     tags: [Staffing]
 *     parameters:
 *       - $ref: '#/components/parameters/DeliverableId'
 *     responses:
 *       200:
 *         description: Deliverable staff requests
 */
router.get(
  "/deliverables/:deliverableId/staff-requests",
  requireAuth,
  validate("params", deliverableIdParam, "params"),
  loadDeliverableWorkspace,
  requireCampaignPermission("campaign:view"),
  staffingController.listDeliverableRequests
);

/**
 * @openapi
 * /api/v1/deliverables/{deliverableId}/staff-requests/{roleCode}:
 *   delete:
 *     summary: Cancel a pending deliverable staffing request
 *     tags: [Staffing]
 *     parameters:
 *       - $ref: '#/components/parameters/DeliverableId'
 *       - name: roleCode
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [writer, designer]
 *     responses:
 *       200:
 *         description: Request cancelled
 */
router.delete(
  "/deliverables/:deliverableId/staff-requests/:roleCode",
  requireAuth,
  validate("params", deliverableStaffCancelParams, "params"),
  loadDeliverableWorkspace,
  requireCampaignPermission("campaign:create"),
  staffingController.cancelDeliverableRequest
);

export default router;
