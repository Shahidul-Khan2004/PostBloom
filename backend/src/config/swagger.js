import swaggerJsdoc from "swagger-jsdoc";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./env.js";
import { openApiComponents } from "../api/openapi/components.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "PostBloom API",
      version: "0.1.0",
      description: [
        "LinkedIn analytics import to cross-platform campaign workflow with RBAC, approvals, and audit.",
        "",
        "**Frontend engineers:** read the canonical guide at `docs/API.md` in the repository root.",
        "This Swagger UI is generated from the same route annotations — use `/api/docs/openapi.json` for codegen.",
      ].join("\n"),
      contact: {
        name: "PostBloom API",
      },
    },
    externalDocs: {
      description: "Full API reference for frontend (markdown)",
      url: "https://github.com/postbloom/postbloom/blob/main/docs/API.md",
    },
    servers: [{ url: `http://localhost:${env.port}`, description: "Local" }],
    tags: [
      { name: "System", description: "Health and metadata" },
      { name: "Auth", description: "Registration, login, session" },
      { name: "Workspaces", description: "Workspace CRUD and members" },
      { name: "Analytics", description: "LinkedIn XLSX import" },
      { name: "Opportunities", description: "Scored content opportunities" },
      { name: "Campaigns", description: "Campaigns, deliverables, review" },
      { name: "Staffing", description: "Specialist broadcast requests" },
      { name: "Notifications", description: "In-app notifications" },
      { name: "Admin", description: "Platform admin (accountRole admin only)" },
    ],
    components: openApiComponents,
    security: [{ bearerAuth: [] }],
  },
  apis: [join(__dirname, "../api/routes/*.js")],
};

export const swaggerSpec = swaggerJsdoc(options);
