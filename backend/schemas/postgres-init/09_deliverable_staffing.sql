-- Per-deliverable writer/designer staffing; campaign_staff_requests limited to reviewer

CREATE TABLE IF NOT EXISTS deliverable_staff_requests (
  id BIGSERIAL PRIMARY KEY,
  public_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  deliverable_id BIGINT NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  role_code VARCHAR(20) NOT NULL CHECK (role_code IN ('writer', 'designer', 'reviewer')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'cancelled')),
  requested_by BIGINT NOT NULL REFERENCES users(id),
  accepted_by BIGINT REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (deliverable_id, role_code)
);

CREATE INDEX IF NOT EXISTS idx_deliverable_staff_requests_deliverable
  ON deliverable_staff_requests(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_deliverable_staff_requests_status
  ON deliverable_staff_requests(status);

DO $$
BEGIN
  ALTER TABLE campaign_participants
    DROP CONSTRAINT IF EXISTS campaign_participants_campaign_id_role_code_key;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'campaign_participants_campaign_user_role_unique'
  ) THEN
    ALTER TABLE campaign_participants
      ADD CONSTRAINT campaign_participants_campaign_user_role_unique
      UNIQUE (campaign_id, user_id, role_code);
  END IF;
END $$;

ALTER TABLE campaign_staff_requests
  DROP CONSTRAINT IF EXISTS campaign_staff_requests_role_code_check;

ALTER TABLE campaign_staff_requests
  DROP CONSTRAINT IF EXISTS campaign_staff_requests_reviewer_only;

ALTER TABLE campaign_staff_requests
  ADD CONSTRAINT campaign_staff_requests_reviewer_only
  CHECK (role_code = 'reviewer');
