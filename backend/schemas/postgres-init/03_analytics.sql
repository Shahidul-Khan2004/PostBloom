CREATE TABLE creator_accounts (
  id BIGSERIAL PRIMARY KEY,
  public_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  workspace_id BIGINT NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  display_name VARCHAR(255) NOT NULL DEFAULT 'LinkedIn Creator',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE analytics_imports (
  id BIGSERIAL PRIMARY KEY,
  public_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  creator_account_id BIGINT NOT NULL REFERENCES creator_accounts(id) ON DELETE CASCADE,
  imported_by BIGINT NOT NULL REFERENCES users(id),
  original_filename VARCHAR(500),
  date_range_start DATE,
  date_range_end DATE,
  sheet_manifest JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(30) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  row_counts JSONB NOT NULL DEFAULT '{}',
  warnings JSONB NOT NULL DEFAULT '[]',
  discovery_summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_imports_creator ON analytics_imports(creator_account_id, created_at DESC);

CREATE TABLE source_posts (
  id BIGSERIAL PRIMARY KEY,
  public_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  creator_account_id BIGINT NOT NULL REFERENCES creator_accounts(id) ON DELETE CASCADE,
  import_id BIGINT NOT NULL REFERENCES analytics_imports(id) ON DELETE CASCADE,
  linkedin_post_url TEXT NOT NULL,
  publish_date DATE,
  impressions NUMERIC,
  engagements NUMERIC,
  engagement_rate NUMERIC,
  enrichment_title VARCHAR(500),
  enrichment_excerpt TEXT,
  enrichment_notes TEXT,
  enriched_at TIMESTAMPTZ,
  enriched_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (import_id, linkedin_post_url)
);

CREATE INDEX idx_source_posts_import ON source_posts(import_id);
CREATE INDEX idx_source_posts_creator ON source_posts(creator_account_id);

CREATE TABLE opportunity_scores (
  id BIGSERIAL PRIMARY KEY,
  source_post_id BIGINT NOT NULL UNIQUE REFERENCES source_posts(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL,
  rank INTEGER NOT NULL,
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  recommendation_label TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_opportunity_scores_rank ON opportunity_scores(rank);
