/**
 * OpenAPI component schemas — keep in sync with docs/API.md and route handlers.
 * Imported by src/config/swagger.js
 */

export const openApiComponents = {
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
    UserId: {
      name: "userId",
      in: "path",
      required: true,
      schema: { type: "string", format: "uuid", description: "User publicUuid" },
    },
    StaffRequestId: {
      name: "requestId",
      in: "path",
      required: true,
      schema: { type: "string", format: "uuid" },
    },
    RoleCodePath: {
      name: "roleCode",
      in: "path",
      required: true,
      schema: { type: "string", enum: ["writer", "designer", "reviewer"] },
    },
  },
  responses: {
    Unauthorized: {
      description: "Authentication required or invalid token",
      content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
    },
    Forbidden: {
      description: "Insufficient permissions",
      content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
    },
    NotFound: {
      description: "Resource not found",
      content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
    },
    ValidationError: {
      description: "Request validation failed",
      content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
    },
    Conflict: {
      description: "Resource already exists or conflict",
      content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
    },
  },
  schemas: {
    Error: {
      type: "object",
      properties: {
        error: {
          type: "object",
          properties: {
            code: { type: "string", example: "VALIDATION_ERROR" },
            message: { type: "string" },
            details: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    User: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Internal ID; use publicUuid in URLs" },
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
    Workspace: {
      type: "object",
      properties: {
        id: { type: "integer" },
        publicUuid: { type: "string", format: "uuid" },
        name: { type: "string" },
        slug: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
      },
    },
    WorkspaceWithSetup: {
      allOf: [
        { $ref: "#/components/schemas/Workspace" },
        {
          type: "object",
          properties: {
            setup: {
              type: "object",
              properties: {
                hasImport: { type: "boolean" },
                canCreateCampaign: { type: "boolean" },
              },
            },
          },
        },
      ],
    },
    WorkspaceListItem: {
      type: "object",
      properties: {
        publicUuid: { type: "string", format: "uuid" },
        name: { type: "string" },
        slug: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
        accountRole: { type: "string" },
      },
    },
    WorkspaceMember: {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            publicUuid: { type: "string", format: "uuid" },
            email: { type: "string" },
            displayName: { type: "string" },
          },
        },
        roleCode: { type: "string" },
        accountRole: { type: "string" },
        status: { type: "string", example: "active" },
        joinedAt: { type: "string", format: "date-time" },
      },
    },
    MetricsCoverage: {
      type: "object",
      properties: {
        postsImported: { type: "integer" },
        engagementValidatedPosts: { type: "integer" },
        reachOnlyPosts: { type: "integer" },
      },
    },
    TopOpportunitySummary: {
      type: "object",
      properties: {
        linkedinPostUrl: { type: "string" },
        score: { type: "number" },
        rankWithinEvidenceType: { type: "integer" },
        evidenceType: { type: "string", enum: ["engagement_validated", "reach_only"] },
        recommendationLabel: { type: "string" },
        recommendationReasons: { type: "array", items: { type: "string" } },
      },
    },
    Opportunity: {
      type: "object",
      properties: {
        publicUuid: { type: "string", format: "uuid" },
        linkedinPostUrl: { type: "string" },
        publishDate: { type: "string", format: "date", nullable: true },
        impressions: { type: "number", nullable: true },
        engagements: { type: "number", nullable: true },
        engagementRate: { type: "number", nullable: true },
        enrichmentTitle: { type: "string", nullable: true },
        enrichmentExcerpt: { type: "string", nullable: true },
        enrichmentNotes: { type: "string", nullable: true },
        enrichedAt: { type: "string", format: "date-time", nullable: true },
        score: { type: "number", nullable: true },
        rank: { type: "integer", nullable: true },
        rankWithinEvidenceType: { type: "integer", nullable: true },
        scoreBreakdown: { type: "object", nullable: true },
        recommendationLabel: { type: "string", nullable: true },
        recommendationReasons: { type: "array", items: { type: "string" } },
        evidenceType: {
          type: "string",
          nullable: true,
          enum: ["engagement_validated", "reach_only"],
        },
        scoreBasis: {
          type: "string",
          nullable: true,
          enum: ["full_metrics", "reach_only"],
        },
        confidence: {
          type: "string",
          nullable: true,
          enum: ["strong_evidence", "limited_evidence"],
        },
        importPublicUuid: { type: "string", format: "uuid" },
      },
    },
    ImportResult: {
      type: "object",
      properties: {
        importPublicUuid: { type: "string", format: "uuid" },
        postsImported: { type: "integer" },
        metricsCoverage: { $ref: "#/components/schemas/MetricsCoverage" },
        notices: { type: "array", items: { type: "string" } },
        warnings: { type: "array", items: { type: "string" } },
        dateRange: {
          type: "object",
          properties: {
            start: { type: "string", format: "date" },
            end: { type: "string", format: "date" },
          },
        },
        discovery: { type: "object" },
        topPosts: {
          type: "array",
          items: { $ref: "#/components/schemas/TopOpportunitySummary" },
        },
        topReachSignals: {
          type: "array",
          items: { $ref: "#/components/schemas/TopOpportunitySummary" },
        },
      },
    },
    ImportSummary: {
      type: "object",
      properties: {
        publicUuid: { type: "string", format: "uuid" },
        originalFilename: { type: "string" },
        dateRangeStart: { type: "string", format: "date" },
        dateRangeEnd: { type: "string", format: "date" },
        rowCounts: { type: "object" },
        metricsCoverage: { $ref: "#/components/schemas/MetricsCoverage" },
        warnings: { type: "array", items: { type: "string" } },
        discoverySummary: { type: "object" },
        createdAt: { type: "string", format: "date-time" },
      },
    },
    PlatformField: {
      type: "object",
      properties: {
        key: { type: "string" },
        label: { type: "string" },
        type: { type: "string", enum: ["text", "textarea"] },
        required: { type: "boolean" },
      },
    },
    PlatformType: {
      type: "object",
      properties: {
        code: { type: "string" },
        name: { type: "string" },
        fieldSchema: {
          type: "array",
          items: { $ref: "#/components/schemas/PlatformField" },
        },
      },
    },
    CampaignListItem: {
      type: "object",
      properties: {
        publicUuid: { type: "string", format: "uuid" },
        name: { type: "string" },
        statusCode: { type: "string" },
        statusName: { type: "string" },
        enrichmentTitle: { type: "string", nullable: true },
        createdAt: { type: "string", format: "date-time" },
      },
    },
    Deliverable: {
      type: "object",
      properties: {
        publicUuid: { type: "string", format: "uuid" },
        title: { type: "string" },
        statusCode: { type: "string" },
        platformCode: { type: "string" },
        platformName: { type: "string" },
        assigneeName: { type: "string", nullable: true },
        reviewerName: { type: "string", nullable: true },
        designerName: { type: "string", nullable: true },
        dueDate: { type: "string", format: "date", nullable: true },
      },
    },
    CampaignDetail: {
      type: "object",
      properties: {
        publicUuid: { type: "string", format: "uuid" },
        name: { type: "string" },
        statusCode: { type: "string" },
        statusName: { type: "string" },
        opportunityUuid: { type: "string", format: "uuid" },
        enrichmentTitle: { type: "string", nullable: true },
        createdAt: { type: "string", format: "date-time" },
        deliverables: {
          type: "array",
          items: { $ref: "#/components/schemas/Deliverable" },
        },
      },
    },
    CampaignCreated: {
      type: "object",
      properties: {
        publicUuid: { type: "string", format: "uuid" },
        name: { type: "string" },
        deliverableCount: { type: "integer" },
      },
    },
    Comment: {
      type: "object",
      properties: {
        publicUuid: { type: "string", format: "uuid" },
        body: { type: "string" },
        authorName: { type: "string" },
        authorRole: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
      },
    },
    VersionSubmitted: {
      type: "object",
      properties: {
        publicUuid: { type: "string", format: "uuid" },
        versionNo: { type: "integer" },
        payload: { type: "object" },
        externalUrl: { type: "string", nullable: true },
      },
    },
    ReviewResult: {
      type: "object",
      properties: {
        statusCode: { type: "string", example: "ready_to_publish" },
      },
    },
    StaffRequest: {
      type: "object",
      properties: {
        publicUuid: { type: "string", format: "uuid" },
        requestScope: { type: "string", enum: ["deliverable", "campaign"] },
        campaignPublicUuid: { type: "string", format: "uuid" },
        campaignName: { type: "string" },
        deliverablePublicUuid: { type: "string", format: "uuid", nullable: true },
        deliverableTitle: { type: "string", nullable: true },
        workspacePublicUuid: { type: "string", format: "uuid" },
        roleCode: { type: "string", enum: ["writer", "designer", "reviewer"] },
        status: { type: "string", enum: ["pending", "accepted", "cancelled"] },
        requestedByName: { type: "string", nullable: true },
        acceptedByName: { type: "string", nullable: true },
        acceptedAt: { type: "string", format: "date-time", nullable: true },
        createdAt: { type: "string", format: "date-time" },
      },
    },
    Notification: {
      type: "object",
      properties: {
        publicUuid: { type: "string", format: "uuid" },
        type: { type: "string" },
        payload: { type: "object" },
        readAt: { type: "string", format: "date-time", nullable: true },
        createdAt: { type: "string", format: "date-time" },
      },
    },
    AuditEvent: {
      type: "object",
      properties: {
        publicUuid: { type: "string", format: "uuid" },
        entityType: { type: "string" },
        entityId: { type: "integer", nullable: true },
        entityPublicUuid: { type: "string", format: "uuid", nullable: true },
        action: { type: "string" },
        metadata: { type: "object" },
        actorName: { type: "string", nullable: true },
        createdAt: { type: "string", format: "date-time" },
      },
    },
    SpecialistMetric: {
      type: "object",
      properties: {
        publicUuid: { type: "string", format: "uuid" },
        displayName: { type: "string" },
        accountRole: { type: "string" },
        campaignsParticipated: { type: "integer" },
        campaignsCompleted: { type: "integer" },
        completionRate: { type: "number", format: "float" },
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
    /** @deprecated Prefer typed schemas; see docs/API.md for exact shapes */
    DataEnvelope: {
      type: "object",
      properties: {
        data: { description: "See docs/API.md for response shape per endpoint" },
      },
    },
  },
};
