-- Migration for databases created before platform-wide RBAC (idempotent).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'account_role'
  ) THEN
    ALTER TABLE users ADD COLUMN account_role VARCHAR(20) NOT NULL DEFAULT 'user'
      CHECK (account_role IN ('user', 'admin', 'designer', 'writer', 'reviewer'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS users_single_admin ON users ((true)) WHERE account_role = 'admin';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspace_members' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE workspace_members DROP COLUMN role_id;
  END IF;
END $$;

INSERT INTO permissions (code, description) VALUES
  ('deliverable:comment', 'Comment on deliverables'),
  ('workspace:create', 'Create new workspaces')
ON CONFLICT (code) DO NOTHING;

UPDATE users SET account_role = 'admin' WHERE email = 'owner@demo.postbloom' AND account_role = 'user';

UPDATE users SET account_role = 'reviewer' WHERE email = 'reviewer@demo.postbloom';
UPDATE users SET account_role = 'writer' WHERE email = 'writer@demo.postbloom';
UPDATE users SET account_role = 'designer' WHERE email = 'designer@demo.postbloom';
