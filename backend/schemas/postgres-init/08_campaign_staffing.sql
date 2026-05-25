-- Campaign-level specialist staffing (broadcast request / first accept wins)

CREATE TABLE IF NOT EXISTS campaign_staff_requests (
  id BIGSERIAL PRIMARY KEY,
  public_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  role_code VARCHAR(20) NOT NULL CHECK (role_code IN ('writer', 'designer', 'reviewer')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'cancelled')),
  requested_by BIGINT NOT NULL REFERENCES users(id),
  accepted_by BIGINT REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, role_code)
);

CREATE INDEX IF NOT EXISTS idx_campaign_staff_requests_campaign ON campaign_staff_requests(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_staff_requests_status ON campaign_staff_requests(status);

CREATE TABLE IF NOT EXISTS campaign_participants (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id),
  role_code VARCHAR(20) NOT NULL CHECK (role_code IN ('writer', 'designer', 'reviewer')),
  request_id BIGINT REFERENCES campaign_staff_requests(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, role_code)
);

CREATE INDEX IF NOT EXISTS idx_campaign_participants_user ON campaign_participants(user_id);

ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS designer_id BIGINT REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_deliverables_designer ON deliverables(designer_id);

CREATE OR REPLACE VIEW vw_specialist_campaign_metrics AS
SELECT
  u.public_uuid,
  u.display_name,
  u.account_role,
  COUNT(DISTINCT cp.campaign_id)::int AS campaigns_participated,
  COUNT(DISTINCT cp.campaign_id) FILTER (WHERE cs.code = 'completed')::int AS campaigns_completed
FROM users u
JOIN campaign_participants cp ON cp.user_id = u.id
JOIN campaigns c ON c.id = cp.campaign_id
JOIN campaign_statuses cs ON cs.id = c.current_status_id
WHERE u.account_role IN ('writer', 'designer', 'reviewer')
GROUP BY u.id, u.public_uuid, u.display_name, u.account_role;
