import { query, getPool } from "../config/db.js";
import { classifyPostEvidence } from "../domain/opportunityScoring.js";
import { toApiDateOnly } from "../lib/dateFormat.js";

export async function getOrCreateCreatorAccount(workspaceId) {
  const { rows } = await query(
    "SELECT * FROM creator_accounts WHERE workspace_id = $1",
    [workspaceId]
  );
  if (rows[0]) return rows[0];

  const created = await query(
    `INSERT INTO creator_accounts (workspace_id) VALUES ($1) RETURNING *`,
    [workspaceId]
  );
  return created.rows[0];
}

export async function createImport(client, data) {
  const { rows } = await client.query(
    `INSERT INTO analytics_imports (
      creator_account_id, imported_by, original_filename,
      date_range_start, date_range_end, sheet_manifest, status,
      row_counts, warnings, discovery_summary
    ) VALUES ($1,$2,$3,$4,$5,$6,'completed',$7,$8,$9) RETURNING *`,
    [
      data.creatorAccountId,
      data.importedBy,
      data.originalFilename,
      data.dateRangeStart,
      data.dateRangeEnd,
      JSON.stringify(data.manifest),
      JSON.stringify(data.rowCounts),
      JSON.stringify(data.warnings),
      JSON.stringify(data.discovery ?? {}),
    ]
  );
  return rows[0];
}

export async function bulkInsertPostsAndScores(client, creatorAccountId, importId, scoredPosts) {
  const posts = [];
  for (const p of scoredPosts) {
    const { rows } = await client.query(
      `INSERT INTO source_posts (
        creator_account_id, import_id, linkedin_post_url, publish_date,
        impressions, engagements, engagement_rate
      ) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        creatorAccountId,
        importId,
        p.linkedinPostUrl,
        p.publishDate,
        p.impressions,
        p.engagements,
        p.engagementRate,
      ]
    );
    const post = rows[0];
    if (p.score != null) {
      const breakdown = {
        ...p.scoreBreakdown,
        evidenceType: p.evidenceType,
        scoreBasis: p.scoreBasis,
        confidence: p.confidence,
        recommendationReasons: p.recommendationReasons ?? [],
        rankWithinEvidenceType: p.rankWithinEvidenceType,
      };
      await client.query(
        `INSERT INTO opportunity_scores (source_post_id, score, rank, score_breakdown, recommendation_label)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          post.id,
          p.score,
          p.rank,
          JSON.stringify(breakdown),
          p.recommendationLabel,
        ]
      );
    }
    posts.push(post);
  }
  return posts;
}

export async function hasCompletedImport(workspaceId) {
  const { rows } = await query(
    `SELECT 1 FROM analytics_imports ai
     JOIN creator_accounts ca ON ca.id = ai.creator_account_id
     WHERE ca.workspace_id = $1 AND ai.status = 'completed'
     LIMIT 1`,
    [workspaceId]
  );
  return Boolean(rows[0]);
}

export async function listImports(creatorAccountId) {
  const { rows } = await query(
    `SELECT public_uuid, original_filename, date_range_start, date_range_end,
            row_counts, warnings, created_at
     FROM analytics_imports WHERE creator_account_id = $1 ORDER BY created_at DESC`,
    [creatorAccountId]
  );
  return rows;
}

export async function findImportByPublicUuid(publicUuid, workspaceId) {
  const { rows } = await query(
    `SELECT ai.* FROM analytics_imports ai
     JOIN creator_accounts ca ON ca.id = ai.creator_account_id
     WHERE ai.public_uuid = $1 AND ca.workspace_id = $2`,
    [publicUuid, workspaceId]
  );
  return rows[0];
}

export function mapOpportunityFromRow(row) {
  const breakdown = row.score_breakdown ?? {};
  const derived = classifyPostEvidence({
    impressions: row.impressions != null ? Number(row.impressions) : null,
    engagements: row.engagements != null ? Number(row.engagements) : null,
    engagementRate: row.engagement_rate != null ? Number(row.engagement_rate) : null,
  });

  const evidenceType = breakdown.evidenceType ?? derived.evidenceType;
  const scoreBasis = breakdown.scoreBasis ?? derived.scoreBasis;
  const confidence = breakdown.confidence ?? derived.confidence;
  const recommendationReasons =
    breakdown.recommendationReasons ?? [];
  const rankWithinEvidenceType =
    breakdown.rankWithinEvidenceType ?? null;

  const { recommendationReasons: _rr, rankWithinEvidenceType: _rw, evidenceType: _et, scoreBasis: _sb, confidence: _c, ...scoreBreakdown } =
    breakdown;

  return {
    publicUuid: row.public_uuid,
    linkedinPostUrl: row.linkedin_post_url,
    publishDate: toApiDateOnly(row.publish_date),
    impressions: row.impressions != null ? Number(row.impressions) : null,
    engagements: row.engagements != null ? Number(row.engagements) : null,
    engagementRate: row.engagement_rate != null ? Number(row.engagement_rate) : null,
    enrichmentTitle: row.enrichment_title,
    enrichmentExcerpt: row.enrichment_excerpt,
    enrichmentNotes: row.enrichment_notes,
    enrichedAt: row.enriched_at,
    score: row.score != null ? Number(row.score) : null,
    rank: row.rank,
    scoreBreakdown: Object.keys(scoreBreakdown).length > 0 ? scoreBreakdown : null,
    recommendationLabel: row.recommendation_label,
    evidenceType,
    scoreBasis,
    confidence,
    recommendationReasons,
    rankWithinEvidenceType,
    importPublicUuid: row.import_public_uuid,
  };
}

export async function listOpportunities(workspaceId, { sort = "score" } = {}) {
  const order = sort === "date" ? "sp.publish_date DESC NULLS LAST" : "os.rank ASC";
  const { rows } = await query(
    `SELECT sp.*, os.score, os.rank, os.score_breakdown, os.recommendation_label,
            ai.public_uuid AS import_public_uuid
     FROM source_posts sp
     JOIN opportunity_scores os ON os.source_post_id = sp.id
     JOIN creator_accounts ca ON ca.id = sp.creator_account_id
     JOIN analytics_imports ai ON ai.id = sp.import_id
     WHERE ca.workspace_id = $1
     ORDER BY ${order}`,
    [workspaceId]
  );
  return rows;
}

export async function findOpportunityByPublicUuid(publicUuid, workspaceId) {
  const { rows } = await query(
    `SELECT sp.*, os.score, os.rank, os.score_breakdown, os.recommendation_label,
            ai.public_uuid AS import_public_uuid
     FROM source_posts sp
     JOIN opportunity_scores os ON os.source_post_id = sp.id
     JOIN creator_accounts ca ON ca.id = sp.creator_account_id
     JOIN analytics_imports ai ON ai.id = sp.import_id
     WHERE sp.public_uuid = $1 AND ca.workspace_id = $2`,
    [publicUuid, workspaceId]
  );
  return rows[0];
}

export async function enrichOpportunity(publicUuid, workspaceId, data, enrichedBy) {
  const { rows } = await query(
    `UPDATE source_posts sp SET
      enrichment_title = $3,
      enrichment_excerpt = $4,
      enrichment_notes = $5,
      enriched_at = NOW(),
      enriched_by = $6
     FROM creator_accounts ca
     WHERE sp.creator_account_id = ca.id
       AND sp.public_uuid = $1 AND ca.workspace_id = $2
     RETURNING sp.*`,
    [publicUuid, workspaceId, data.title, data.excerpt ?? null, data.notes ?? null, enrichedBy]
  );
  return rows[0];
}

export { getPool };
