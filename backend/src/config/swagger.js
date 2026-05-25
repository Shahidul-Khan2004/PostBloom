import swaggerJsdoc from "swagger-jsdoc";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "PostBloom API",
      version: "0.1.0",
      description:
        "LinkedIn analytics import to cross-platform campaign workflow with RBAC, approvals, and audit.",
    },
    servers: [{ url: `http://localhost:${env.port}`, description: "Local" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      parameters: {
        WorkspaceId: {
          name: "workspaceId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
        CampaignId: {
          name: "campaignId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
        DeliverableId: {
          name: "deliverableId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
        OpportunityId: {
          name: "opportunityId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
        ImportId: {
          name: "importId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
        NotificationId: {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      },
      responses: {
        Unauthorized: {
          description: "Authentication required or invalid token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        Forbidden: {
          description: "Insufficient permissions",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        ValidationError: {
          description: "Request validation failed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        Conflict: {
          description: "Resource already exists",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                details: { type: "array", items: { type: "object" } },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            publicUuid: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            displayName: { type: "string" },
            accountRole: {
              type: "string",
              enum: ["user", "admin", "designer", "writer", "reviewer"],
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        AuthData: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
            token: { type: "string", description: "JWT bearer token" },
          },
        },
        DataEnvelope: {
          type: "object",
          properties: {
            data: {},
          },
        },
        OkResponse: {
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
                ok: { type: "boolean", example: true },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [join(__dirname, "../api/routes/*.js")],
};

export const swaggerSpec = swaggerJsdoc(options);
