import { getPool } from "../config/db.js";
import BackendError from "../lib/BackendError.js";
import { parseLinkedInAnalyticsXlsx } from "../integrations/linkedinXlsxParser.js";
import { scoreOpportunities } from "../domain/opportunityScoring.js";
import * as analyticsRepo from "../repositories/analyticsRepository.js";
import * as workspaceRepo from "../repositories/workspaceRepository.js";
import * as auditRepo from "../repositories/auditRepository.js";
import * as notificationRepo from "../repositories/notificationRepository.js";

export async function importAnalytics(workspacePublicUuid, actorUserId, file) {
  const workspace = await workspaceRepo.findByPublicUuid(workspacePublicUuid);
  if (!workspace) throw new BackendError(404, "NOT_FOUND", "Workspace not found");

  const parsed = parseLinkedInAnalyticsXlsx(file.buffer);
  const scored = scoreOpportunities(
    parsed.posts.map((p) => ({
      linkedinPostUrl: p.linkedinPostUrl,
      publishDate: p.publishDate,
      impressions: p.impressions,
      engagements: p.engagements,
      engagementRate: p.engagementRate,
    })),
    { periodEnd: parsed.dateRangeEnd }
  );

  const account = await analyticsRepo.getOrCreateCreatorAccount(workspace.id);
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const imp = await analyticsRepo.createImport(client, {
      creatorAccountId: account.id,
      importedBy: actorUserId,
      originalFilename: file.originalname,
      dateRangeStart: parsed.dateRangeStart,
      dateRangeEnd: parsed.dateRangeEnd,
      manifest: parsed.manifest,
      rowCounts: parsed.rowCounts,
      warnings: parsed.warnings,
      discovery: parsed.discovery,
    });
    await analyticsRepo.bulkInsertPostsAndScores(client, account.id, imp.id, scored);
    await client.query("COMMIT");

    await auditRepo.record({
      workspaceId: workspace.id,
      actorId: actorUserId,
      entityType: "analytics_import",
      entityId: imp.id,
      entityPublicUuid: imp.public_uuid,
      action: "imported",
      metadata: { posts: scored.length, warnings: parsed.warnings },
    });

    const top5 = scored.slice(0, 5).map((p) => ({
      linkedinPostUrl: p.linkedinPostUrl,
      score: p.score,
      rank: p.rank,
      recommendationLabel: p.recommendationLabel,
    }));

    return {
      importPublicUuid: imp.public_uuid,
      postsImported: scored.length,
      warnings: parsed.warnings,
      dateRange: { start: parsed.dateRangeStart, end: parsed.dateRangeEnd },
      discovery: parsed.discovery,
      topPosts: top5,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function listImports(workspaceId) {
  const account = await analyticsRepo.getOrCreateCreatorAccount(workspaceId);
  return analyticsRepo.listImports(account.id);
}

export async function getImportSummary(workspaceId, importPublicUuid) {
  const imp = await analyticsRepo.findImportByPublicUuid(importPublicUuid, workspaceId);
  if (!imp) throw new BackendError(404, "NOT_FOUND", "Import not found");
  return {
    publicUuid: imp.public_uuid,
    originalFilename: imp.original_filename,
    dateRangeStart: imp.date_range_start,
    dateRangeEnd: imp.date_range_end,
    rowCounts: imp.row_counts,
    warnings: imp.warnings,
    discoverySummary: imp.discovery_summary,
    createdAt: imp.created_at,
  };
}

export async function listOpportunities(workspaceId, query) {
  return analyticsRepo.listOpportunities(workspaceId, query);
}

export async function getOpportunity(workspaceId, publicUuid) {
  const row = await analyticsRepo.findOpportunityByPublicUuid(publicUuid, workspaceId);
  if (!row) throw new BackendError(404, "NOT_FOUND", "Opportunity not found");
  return analyticsRepo.mapOpportunityFromRow(row);
}

export async function enrichOpportunity(workspaceId, publicUuid, actorUserId, data) {
  const row = await analyticsRepo.enrichOpportunity(publicUuid, workspaceId, data, actorUserId);
  if (!row) throw new BackendError(404, "NOT_FOUND", "Opportunity not found");

  await auditRepo.record({
    workspaceId,
    actorId: actorUserId,
    entityType: "source_post",
    entityPublicUuid: publicUuid,
    action: "enriched",
    metadata: { title: data.title },
  });

  return getOpportunity(workspaceId, publicUuid);
}
