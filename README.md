# PostBloom

Turn proven LinkedIn posts into coordinated cross-platform content campaigns.

## Repository layout

| Path | Description |
|------|-------------|
| [`backend/`](backend/) | Express 5 API (active) — Swagger, tests, Postgres |
| [`frontend/`](frontend/) | React app (deferred) |
| [`docs/API.md`](docs/API.md) | **API reference for frontend** (canonical) |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design |
| [`docker-compose.yml`](docker-compose.yml) | PostgreSQL 16 for local dev |

## Quick start

```bash
docker compose up -d
cd backend
cp .env.example .env
npm install
node scripts/generate-fixture-xlsx.js
node scripts/seed-demo.js
npm run dev
```

- API: http://localhost:3000  
- **Frontend API docs:** [docs/API.md](docs/API.md)  
- Swagger: http://localhost:3000/api/docs  

See [backend/README.md](backend/README.md) for demo accounts, tests, and API modules.

## Privacy

Do not commit real LinkedIn analytics `.xlsx` files or credentials.
