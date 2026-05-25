import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { notFound, errorHandler } from "./api/middlewares/errorHandler.js";
import healthRoutes from "./api/routes/healthRoutes.js";
import authRoutes from "./api/routes/authRoutes.js";
import workspaceRoutes from "./api/routes/workspaceRoutes.js";
import adminRoutes from "./api/routes/adminRoutes.js";
import analyticsRoutes from "./api/routes/analyticsRoutes.js";
import opportunityRoutes from "./api/routes/opportunityRoutes.js";
import campaignRoutes from "./api/routes/campaignRoutes.js";
import notificationRoutes from "./api/routes/notificationRoutes.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/docs/openapi.json", (_req, res) => {
    res.json(swaggerSpec);
  });
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, { customSiteTitle: "PostBloom API" })
  );

  app.use(healthRoutes);
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use("/api/v1/workspaces", workspaceRoutes);
  app.use("/api/v1/workspaces/:workspaceId/analytics", analyticsRoutes);
  app.use("/api/v1/workspaces/:workspaceId/opportunities", opportunityRoutes);
  app.use("/api/v1", campaignRoutes);
  app.use("/api/v1/notifications", notificationRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
