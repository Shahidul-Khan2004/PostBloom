import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import * as notificationController from "../controllers/notificationController.js";

const router = Router();

/**
 * @openapi
 * /api/v1/notifications:
 *   get:
 *     summary: List notifications for current user
 *     tags: [Notifications]
 *     parameters:
 *       - name: unread
 *         in: query
 *         schema:
 *           type: string
 *           enum: ['true']
 *         description: When set to true, return only unread notifications
 *     responses:
 *       200:
 *         description: Notification list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DataEnvelope'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", requireAuth, notificationController.list);

/**
 * @openapi
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - $ref: '#/components/parameters/NotificationId'
 *     responses:
 *       200:
 *         description: Notification marked read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OkResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch("/:id/read", requireAuth, notificationController.markRead);

export default router;
