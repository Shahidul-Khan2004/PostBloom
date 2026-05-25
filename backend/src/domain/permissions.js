/** Platform account roles and permission codes (authorization source of truth). */

export const ACCOUNT_ROLES = ["user", "admin", "designer", "writer", "reviewer"];

export const PERMISSIONS = {
  WORKSPACE_CREATE: "workspace:create",
  WORKSPACE_MANAGE: "workspace:manage",
  ANALYTICS_IMPORT: "analytics:import",
  OPPORTUNITY_ENRICH: "opportunity:enrich",
  CAMPAIGN_CREATE: "campaign:create",
  CAMPAIGN_VIEW: "campaign:view",
  DELIVERABLE_ASSIGN: "deliverable:assign",
  DELIVERABLE_SUBMIT: "deliverable:submit",
  DELIVERABLE_REVIEW: "deliverable:review",
  DELIVERABLE_COMMENT: "deliverable:comment",
  AUDIT_VIEW: "audit:view",
};

const ALL = Object.values(PERMISSIONS);

const WORKSPACE_OPERATOR = [
  PERMISSIONS.ANALYTICS_IMPORT,
  PERMISSIONS.OPPORTUNITY_ENRICH,
  PERMISSIONS.CAMPAIGN_CREATE,
  PERMISSIONS.CAMPAIGN_VIEW,
  PERMISSIONS.AUDIT_VIEW,
];

const ROLE_PERMISSIONS = {
  user: [PERMISSIONS.WORKSPACE_CREATE, ...WORKSPACE_OPERATOR],
  admin: ALL,
  reviewer: [
    PERMISSIONS.CAMPAIGN_VIEW,
    PERMISSIONS.DELIVERABLE_REVIEW,
    PERMISSIONS.DELIVERABLE_COMMENT,
    PERMISSIONS.AUDIT_VIEW,
  ],
  writer: [
    PERMISSIONS.CAMPAIGN_VIEW,
    PERMISSIONS.DELIVERABLE_SUBMIT,
    PERMISSIONS.DELIVERABLE_COMMENT,
  ],
  designer: [
    PERMISSIONS.CAMPAIGN_VIEW,
    PERMISSIONS.DELIVERABLE_SUBMIT,
    PERMISSIONS.DELIVERABLE_COMMENT,
  ],
};

export function permissionsForAccountRole(accountRole) {
  return ROLE_PERMISSIONS[accountRole] ?? [];
}

export function canCreateWorkspace(accountRole) {
  return accountRole === "user" || accountRole === "admin";
}

export function isSpecialist(accountRole) {
  return accountRole === "designer" || accountRole === "writer" || accountRole === "reviewer";
}
