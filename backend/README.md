# PostBloom API

Backend for PostBloom — import real LinkedIn analytics XLSX, rank content opportunities, and run cross-platform campaign workflows with RBAC, approvals, and audit.

## Requirements

- Node.js 20+
- PostgreSQL 16 (Docker recommended)

## Quick start

```bash
# From repo root
docker compose up -d

cd backend
cp .env.example .env
npm install
node scripts/generate-fixture-xlsx.js
node scripts/seed-demo.js
npm run dev
```

- API: http://localhost:3000
- Swagger UI: http://localhost:3000/api/docs
- OpenAPI JSON: http://localhost:3000/api/docs/openapi.json

To call protected endpoints in Swagger UI, run **POST /api/v1/auth/login**, copy `data.token`, click **Authorize**, and enter `Bearer <token>`.

## Platform RBAC

Authorization uses **global account roles** on `users.account_role`, plus **workspace membership** (`workspace_members`) for which workspaces a user can access.

| Account role | Can create workspaces | Typical capabilities |
|--------------|----------------------|--------------------|
| `user` | Yes | Register; create own workspaces |
| `admin` | Yes | Single platform admin; assign roles; manage all workspace features |
| `writer` | No | Submit structured copy; comment |
| `designer` | No | Submit work via `externalUrl`; comment |
| `reviewer` | No | Review deliverables; comment |

**Admin endpoints** (platform admin JWT only):

- `POST /api/v1/admin/users/:userId/role` — body `{ "roleCode": "designer" | "writer" | "reviewer" | "user" | "admin" }` (`userId` = user `public_uuid`)
- `POST /api/v1/admin/users/:userId/workspaces/:workspaceId` — add specialist/admin to a workspace
- `GET /api/v1/admin/analytics/specialists` — specialist participation and completion metrics (`?role=writer` optional)

## Onboarding order

Per workspace, operations must follow:

1. **Create workspace** — `POST /api/v1/workspaces` (`user` or `admin`)
2. **Import analytics** — `POST /api/v1/workspaces/:workspaceId/analytics/import` (XLSX)
3. **Create campaign** — `POST /api/v1/workspaces/:workspaceId/campaigns` (blocked until step 2 completes)

`GET /api/v1/workspaces/:workspaceId` returns `setup.hasImport` and `setup.canCreateCampaign` for UI progress.

## Campaign staffing

Specialists join a campaign **only by accepting** a staff request. There is no manual assign API.

After a campaign is created, add deliverables from platform templates, then broadcast requests:

- `POST /api/v1/campaigns/:campaignId/deliverables` — body `{ "platformCode", "title?", "dueDate?" }`
- `POST /api/v1/deliverables/:deliverableId/staff-requests` — broadcast **writer**, **designer**, or **reviewer** to **all platform specialists** with that role (writer/designer default from platform template; pass `"roleCode": "reviewer"` explicitly)
- `GET` / `DELETE /api/v1/deliverables/:deliverableId/staff-requests/:roleCode` — list or cancel pending requests for one deliverable
- `GET /api/v1/campaigns/:campaignId/staff-requests` — list all deliverable staff requests in the campaign
- `GET /api/v1/specialist/staff-requests?status=pending` — specialist inbox (platform-wide)
- `POST /api/v1/staff-requests/:requestId/accept` — first accept wins; auto-joins workspace; assigns that role on **that deliverable only**

Campaign owners may **self-review** when no reviewer is assigned on the deliverable. Assigned reviewers use `POST /api/v1/deliverables/:deliverableId/review`.

Existing databases: apply `07_account_rbac.sql`, then `08`, `09`, and `10_deliverable_staff_reviewer.sql` under [`schemas/postgres-init/`](schemas/postgres-init/).

**Workspaces:**

- `GET /api/v1/workspaces` — list workspaces the current user belongs to
- `POST /api/v1/workspaces` — allowed for `user` and `admin` only

Existing databases: run migration SQL in [`schemas/postgres-init/07_account_rbac.sql`](schemas/postgres-init/07_account_rbac.sql) (tests apply it automatically).

## Demo accounts

| Email | Account role | Password |
|-------|--------------|----------|
| owner@demo.postbloom | admin | Demo1234! |
| reviewer@demo.postbloom | reviewer | Demo1234! |
| writer@demo.postbloom | writer | Demo1234! |
| designer@demo.postbloom | designer | Demo1234! |

Run `node scripts/seed-demo.js` after the database is initialized.

## Tests

```bash
docker compose up -d
cd backend
npm install
node scripts/generate-fixture-xlsx.js
npm test
```

Uses `node:test` + `supertest` against a real Postgres database (`DATABASE_URL` in `.env.test`).

## Privacy

Do not commit real LinkedIn analytics XLSX files. Use `test/fixtures/linkedin-sample.xlsx` only.
