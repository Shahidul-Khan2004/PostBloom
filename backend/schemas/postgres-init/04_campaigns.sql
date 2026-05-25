CREATE TABLE campaign_statuses (
  id SMALLSERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE campaign_status_transitions (
  id SMALLSERIAL PRIMARY KEY,
  from_status_id SMALLINT NOT NULL REFERENCES campaign_statuses(id),
  to_status_id SMALLINT NOT NULL REFERENCES campaign_statuses(id),
  UNIQUE (from_status_id, to_status_id)
);

CREATE TABLE campaigns (
  id BIGSERIAL PRIMARY KEY,
  public_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_post_id BIGINT NOT NULL REFERENCES source_posts(id),
  name VARCHAR(500) NOT NULL,
  current_status_id SMALLINT NOT NULL REFERENCES campaign_statuses(id),
  created_by BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_workspace ON campaigns(workspace_id);
CREATE INDEX idx_campaigns_source_post ON campaigns(source_post_id);

CREATE TABLE campaign_status_history (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  from_status_id SMALLINT REFERENCES campaign_statuses(id),
  to_status_id SMALLINT NOT NULL REFERENCES campaign_statuses(id),
  changed_by BIGINT NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE platform_types (
  id SMALLSERIAL PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  field_schema JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE deliverable_statuses (
  id SMALLSERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE deliverable_status_transitions (
  id SMALLSERIAL PRIMARY KEY,
  from_status_id SMALLINT NOT NULL REFERENCES deliverable_statuses(id),
  to_status_id SMALLINT NOT NULL REFERENCES deliverable_statuses(id),
  UNIQUE (from_status_id, to_status_id)
);

CREATE TABLE deliverables (
  id BIGSERIAL PRIMARY KEY,
  public_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  platform_type_id SMALLINT NOT NULL REFERENCES platform_types(id),
  title VARCHAR(500) NOT NULL,
  assignee_id BIGINT REFERENCES users(id),
  reviewer_id BIGINT REFERENCES users(id),
  current_status_id SMALLINT NOT NULL REFERENCES deliverable_statuses(id),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deliverables_campaign ON deliverables(campaign_id);
CREATE INDEX idx_deliverables_assignee ON deliverables(assignee_id);
CREATE INDEX idx_deliverables_status ON deliverables(current_status_id);

CREATE TABLE deliverable_status_history (
  id BIGSERIAL PRIMARY KEY,
  deliverable_id BIGINT NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  from_status_id SMALLINT REFERENCES deliverable_statuses(id),
  to_status_id SMALLINT NOT NULL REFERENCES deliverable_statuses(id),
  changed_by BIGINT NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE deliverable_versions (
  id BIGSERIAL PRIMARY KEY,
  public_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  deliverable_id BIGINT NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  submitted_by BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (deliverable_id, version_no)
);

CREATE TABLE assets (
  id BIGSERIAL PRIMARY KEY,
  public_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  deliverable_version_id BIGINT NOT NULL REFERENCES deliverable_versions(id) ON DELETE CASCADE,
  file_path TEXT,
  external_url TEXT,
  mime_type VARCHAR(100),
  uploaded_by BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE comments (
  id BIGSERIAL PRIMARY KEY,
  public_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  deliverable_id BIGINT NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  author_id BIGINT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE review_actions (
  id BIGSERIAL PRIMARY KEY,
  deliverable_id BIGINT NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  actor_id BIGINT NOT NULL REFERENCES users(id),
  action VARCHAR(30) NOT NULL CHECK (action IN ('approve', 'request_revision')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
