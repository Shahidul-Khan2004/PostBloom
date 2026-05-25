import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(255),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).optional(),
});

export const assignRoleSchema = z.object({
  roleCode: z.enum(["user", "designer", "writer", "reviewer", "admin"]),
});

export const adminUserIdParam = z.object({
  userId: z.string().uuid(),
});

export const adminAddWorkspaceParams = z.object({
  userId: z.string().uuid(),
  workspaceId: z.string().uuid(),
});

export const enrichOpportunitySchema = z.object({
  title: z.string().min(1).max(500),
  excerpt: z.string().max(5000).optional(),
  notes: z.string().max(5000).optional(),
});

export const createCampaignSchema = z.object({
  opportunityUuid: z.string().uuid(),
  name: z.string().min(1).max(500),
  platformCodes: z.array(z.string()).default([]),
  dueDate: z.string().date().optional(),
});

export const createDeliverableSchema = z.object({
  platformCode: z.string().min(1),
  title: z.string().min(1).max(500).optional(),
  dueDate: z.string().date().optional(),
});

export const createDeliverableStaffRequestSchema = z.object({
  roleCode: z.enum(["writer", "designer", "reviewer"]).optional(),
});

export const campaignIdParam = z.object({
  campaignId: z.string().uuid(),
});

export const deliverableIdParam = z.object({
  deliverableId: z.string().uuid(),
});

export const deliverableStaffCancelParams = z.object({
  deliverableId: z.string().uuid(),
  roleCode: z.enum(["writer", "designer", "reviewer"]),
});

export const staffRequestIdParam = z.object({
  requestId: z.string().uuid(),
});

export const campaignStatusSchema = z.object({
  statusCode: z.string(),
  notes: z.string().optional(),
});

export const submitVersionSchema = z.object({
  payload: z.record(z.unknown()).optional(),
  externalUrl: z.string().url().optional(),
});

export const reviewSchema = z.object({
  action: z.enum(["approve", "request_revision"]),
  notes: z.string().optional(),
});

export const commentSchema = z.object({
  body: z.string().min(1).max(5000),
});

export const workspaceIdParam = z.object({
  workspaceId: z.string().uuid(),
});

export const idParam = z.object({
  id: z.string().uuid(),
});
