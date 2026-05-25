-- Allow reviewer on per-deliverable staff requests (platform-wide broadcast, accept-only)

ALTER TABLE deliverable_staff_requests
  DROP CONSTRAINT IF EXISTS deliverable_staff_requests_role_code_check;

ALTER TABLE deliverable_staff_requests
  ADD CONSTRAINT deliverable_staff_requests_role_code_check
  CHECK (role_code IN ('writer', 'designer', 'reviewer'));
