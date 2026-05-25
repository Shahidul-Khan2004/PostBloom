CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  public_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(80) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);

CREATE TABLE audit_events (
  id BIGSERIAL PRIMARY KEY,
  public_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_id BIGINT REFERENCES users(id),
  entity_type VARCHAR(80) NOT NULL,
  entity_id BIGINT,
  entity_public_uuid UUID,
  action VARCHAR(80) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_workspace ON audit_events(workspace_id, created_at DESC);
