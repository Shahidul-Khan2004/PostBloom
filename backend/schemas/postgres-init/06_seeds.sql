-- Roles
INSERT INTO roles (code, name) VALUES
  ('owner', 'Workspace Owner'),
  ('reviewer', 'Creator / Client Reviewer'),
  ('writer', 'Writer / Content Strategist'),
  ('designer', 'Designer / Video Editor');

-- Permissions
INSERT INTO permissions (code, description) VALUES
  ('workspace:manage', 'Manage workspace and members'),
  ('analytics:import', 'Import LinkedIn analytics'),
  ('opportunity:enrich', 'Enrich source opportunities'),
  ('campaign:create', 'Create and manage campaigns'),
  ('campaign:view', 'View campaigns'),
  ('deliverable:assign', 'Assign deliverables'),
  ('deliverable:submit', 'Submit deliverable versions'),
  ('deliverable:review', 'Review and approve deliverables'),
  ('audit:view', 'View audit timeline'),
  ('deliverable:comment', 'Comment on deliverables'),
  ('workspace:create', 'Create new workspaces');

-- Role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'owner';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.code IN ('campaign:view', 'deliverable:review', 'audit:view')
WHERE r.code = 'reviewer';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.code IN ('campaign:view', 'deliverable:submit')
WHERE r.code IN ('writer', 'designer');

-- Campaign statuses
INSERT INTO campaign_statuses (code, name, sort_order) VALUES
  ('draft', 'Draft', 1),
  ('active', 'Active', 2),
  ('in_review', 'In Review', 3),
  ('partially_approved', 'Partially Approved', 4),
  ('ready_to_publish', 'Ready to Publish', 5),
  ('completed', 'Completed', 6),
  ('cancelled', 'Cancelled', 7);

INSERT INTO campaign_status_transitions (from_status_id, to_status_id)
SELECT f.id, t.id FROM campaign_statuses f, campaign_statuses t
WHERE (f.code, t.code) IN (
  ('draft', 'active'),
  ('draft', 'cancelled'),
  ('active', 'in_review'),
  ('active', 'cancelled'),
  ('in_review', 'partially_approved'),
  ('in_review', 'active'),
  ('in_review', 'cancelled'),
  ('partially_approved', 'ready_to_publish'),
  ('partially_approved', 'in_review'),
  ('partially_approved', 'cancelled'),
  ('ready_to_publish', 'completed'),
  ('ready_to_publish', 'in_review'),
  ('completed', 'completed'),
  ('cancelled', 'cancelled')
);

-- Deliverable statuses
INSERT INTO deliverable_statuses (code, name, sort_order) VALUES
  ('assigned', 'Assigned', 1),
  ('in_progress', 'In Progress', 2),
  ('submitted_for_review', 'Submitted for Review', 3),
  ('revision_requested', 'Revision Requested', 4),
  ('approved', 'Approved', 5),
  ('ready_to_publish', 'Ready to Publish', 6);

INSERT INTO deliverable_status_transitions (from_status_id, to_status_id)
SELECT f.id, t.id FROM deliverable_statuses f, deliverable_statuses t
WHERE (f.code, t.code) IN (
  ('assigned', 'in_progress'),
  ('in_progress', 'submitted_for_review'),
  ('submitted_for_review', 'revision_requested'),
  ('submitted_for_review', 'approved'),
  ('revision_requested', 'in_progress'),
  ('approved', 'ready_to_publish'),
  ('ready_to_publish', 'ready_to_publish')
);

-- Platform types with field schemas
INSERT INTO platform_types (code, name, field_schema) VALUES
  ('instagram_carousel', 'Instagram Carousel', '[
    {"key":"carousel_title","label":"Carousel Title","type":"text","required":true},
    {"key":"slide_1_hook","label":"Slide 1 Hook","type":"text","required":true},
    {"key":"slides_2_6","label":"Slides 2-6 Key Points","type":"textarea","required":true},
    {"key":"final_cta","label":"Final CTA Slide","type":"text","required":true},
    {"key":"caption","label":"Caption","type":"textarea","required":true}
  ]'::jsonb),
  ('youtube_short', 'YouTube Short', '[
    {"key":"opening_hook","label":"Opening Hook","type":"text","required":true},
    {"key":"script","label":"45-60s Script","type":"textarea","required":true},
    {"key":"storyboard_notes","label":"Storyboard Notes","type":"textarea","required":false},
    {"key":"title","label":"Title","type":"text","required":true},
    {"key":"thumbnail_notes","label":"Thumbnail Notes","type":"text","required":false}
  ]'::jsonb),
  ('tiktok_reel', 'TikTok / Instagram Reel', '[
    {"key":"hook","label":"Hook","type":"text","required":true},
    {"key":"script","label":"Script","type":"textarea","required":true},
    {"key":"video_direction","label":"Video Direction","type":"textarea","required":true},
    {"key":"caption","label":"Caption","type":"textarea","required":true},
    {"key":"editing_notes","label":"Editing Notes","type":"textarea","required":false}
  ]'::jsonb),
  ('threads_thread', 'Threads / X Thread', '[
    {"key":"opening_hook","label":"Opening Hook","type":"text","required":true},
    {"key":"thread_body","label":"Thread Body","type":"textarea","required":true},
    {"key":"closing_cta","label":"Closing CTA","type":"text","required":true}
  ]'::jsonb);

-- Demo users: run `node scripts/seed-demo.js` after database init
