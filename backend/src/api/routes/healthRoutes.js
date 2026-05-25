import { Router } from "express";

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     status: { type: string, example: ok }
 *                     service: { type: string, example: postbloom-api }
 */
router.get("/health", (_req, res) => {
  res.status(200).json({ data: { status: "ok", service: "postbloom-api" } });
});

export default router;
