# PostBloom

Turn proven LinkedIn posts into coordinated cross-platform content campaigns. Import real LinkedIn analytics (XLSX), rank content opportunities, and run multi-platform campaigns with RBAC, specialist staffing, approvals, and audit trails.

## Repository layout

| Path | Description |
|------|-------------|
| [`backend/`](backend/) | Express 5 REST API, PostgreSQL, Swagger/OpenAPI, tests |
| [`frontend/`](frontend/) | Next.js 15 app (marketing site + authenticated workspace UI) |
| [`docs/`](docs/) | Architecture and API reference |
| [`docker-compose.yml`](docker-compose.yml) | PostgreSQL 16 for local development |

---

## Prerequisites

- **Node.js** 20 or later
- **npm** (comes with Node)
- **Docker** and **Docker Compose** (recommended for PostgreSQL)

---

## Setup & installation

### 1. Start the database

From the repository root:

```bash
docker compose up -d
```

This starts PostgreSQL 16 on port `5432` and applies init scripts from `backend/schemas/postgres-init/`.

### 2. Backend API

```bash
cd backend
cp .env.example .env
npm install
node scripts/generate-fixture-xlsx.js
node scripts/seed-demo.js
npm run dev
```

The API listens at **http://localhost:3000** (configurable via `PORT` in `.env`).

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (default matches Docker Compose) |
| `JWT_SECRET` | Signing key for auth tokens — change in production |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `UPLOAD_DIR` | Local directory for uploaded analytics files |
| `MAX_UPLOAD_BYTES` | Max upload size (default 10 MB) |

### 3. Frontend (optional)

With the API running:

```bash
cd frontend
npm install
npm run dev
```

The app is served at **http://localhost:5050**. It talks to the API at `http://localhost:3000` by default.

To point at a different API host, set:

```bash
export NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### 4. Try the API in Swagger

1. Open **http://localhost:3000/api/docs**
2. Run **POST /api/v1/auth/login** with a demo account (see below)
3. Copy `data.token`, click **Authorize**, and enter `Bearer <token>`

### Demo accounts

After `node scripts/seed-demo.js`:

| Email | Role | Password |
|-------|------|----------|
| owner@demo.postbloom | admin | Demo1234! |
| reviewer@demo.postbloom | reviewer | Demo1234! |
| writer@demo.postbloom | writer | Demo1234! |
| designer@demo.postbloom | designer | Demo1234! |

More detail: [backend/README.md](backend/README.md).

### Running tests

```bash
docker compose up -d
cd backend
npm install
node scripts/generate-fixture-xlsx.js
npm test
```

Tests use Node’s built-in test runner and Supertest against a real Postgres instance (`backend/.env.test`).

---

## Technologies used

### Backend

| Technology | Role |
|------------|------|
| [Node.js](https://nodejs.org/) 20+ | Runtime |
| [Express](https://expressjs.com/) 5 | HTTP API |
| [PostgreSQL](https://www.postgresql.org/) 16 | Primary datastore |
| [pg](https://node-postgres.com/) | Database client |
| [Zod](https://zod.dev/) | Request validation |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) + [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | Auth |
| [multer](https://github.com/expressjs/multer) | File uploads (LinkedIn XLSX) |
| [xlsx](https://sheetjs.com/) | Spreadsheet parsing |
| [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc) + [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express) | OpenAPI docs |
| Docker Compose | Local Postgres |

### Frontend

| Technology | Role |
|------------|------|
| [Next.js](https://nextjs.org/) 15 | App framework (App Router) |
| [React](https://react.dev/) 19 | UI |
| [TypeScript](https://www.typescriptlang.org/) | Typed components |
| [Tailwind CSS](https://tailwindcss.com/) | Styling |

### Architecture

Layered API: `route → auth → RBAC → validate → controller → service → repository → database`. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## API & documentation

| Resource | Link |
|----------|------|
| **API reference (canonical)** | [docs/API.md](docs/API.md) — contracts, RBAC, models, endpoints |
| **Architecture overview** | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| **Backend README** | [backend/README.md](backend/README.md) — RBAC, onboarding, staffing, migrations |
| **Swagger UI** (local) | http://localhost:3000/api/docs |
| **OpenAPI JSON** (local) | http://localhost:3000/api/docs/openapi.json |

When changing routes or response shapes, update `docs/API.md`, the route `@openapi` JSDoc blocks, and run from `backend/`:

```bash
npm run docs:check
```

---

## Privacy

Do not commit real LinkedIn analytics `.xlsx` files, production credentials, or secrets. Use generated fixtures under `backend/test/fixtures/` for development and tests only.
