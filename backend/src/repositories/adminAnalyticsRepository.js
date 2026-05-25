import { query } from "../config/db.js";

export async function listSpecialistMetrics({ role } = {}) {
  const params = [];
  let roleFilter = "";
  if (role) {
    params.push(role);
    roleFilter = "AND account_role = $1";
  }

  const { rows } = await query(
    `SELECT public_uuid, display_name, account_role,
            campaigns_participated, campaigns_completed
     FROM vw_specialist_campaign_metrics
     WHERE 1=1 ${roleFilter}
     ORDER BY campaigns_completed DESC, campaigns_participated DESC`,
    params
  );

  return rows.map((r) => {
    const participated = r.campaigns_participated;
    const completed = r.campaigns_completed;
    return {
      publicUuid: r.public_uuid,
      displayName: r.display_name,
      accountRole: r.account_role,
      campaignsParticipated: participated,
      campaignsCompleted: completed,
      completionRate: participated > 0 ? completed / participated : 0,
    };
  });
}
