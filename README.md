# GREEN-API Playground

[![CI](https://github.com/gdfdfagera/green-api/actions/workflows/ci.yml/badge.svg)](https://github.com/gdfdfagera/green-api/actions/workflows/ci.yml)

**Live demo:** https://green-api-playground.onrender.com

An HTML page plus a Node.js/TypeScript backend that calls the [GREEN-API](https://green-api.com)
methods: `getSettings`, `getStateInstance`, `sendMessage`, `sendFileByUrl`.

## What's inside

| Layer | Technologies |
|---|---|
| Frontend | Plain HTML / CSS / JS (no framework), layout based on the assignment mockup, read-only response field |
| Backend | Node.js 20, TypeScript, Express — a thin proxy to GREEN-API |
| Validation | `zod`: validates `idInstance` / `apiTokenInstance`, normalizes a phone number into a `chatId` (`77771234567@c.us`) |
| Reliability | request timeouts, single error handler (`400` validation / `502` upstream), non-JSON responses wrapped into a JSON envelope, graceful shutdown, healthcheck |
| Security | `helmet` security headers (incl. CSP), per-IP rate limiting on `/api`, masked token field |
| CI | GitHub Actions running lint + test + build on every push |
| Tests | Vitest + Supertest (validation + route integration with mocked `fetch`) |
| Deployment | Multi-stage `Dockerfile` (non-root, healthcheck) + `docker-compose.yml` |

## Architecture

```
Browser (src/public)  ──POST /api/{method}──►  Express (src/app.ts)
                                                  │  zod validation (src/validation.ts)
                                                  ▼
                                          GreenApiClient (src/greenApi/client.ts)
                                                  │  GET/POST waInstance{id}/{method}/{token}
                                                  ▼
                                             api.green-api.com
```

## Running

### Option 1 — Docker (recommended)

```bash
docker compose up --build
```

Open http://localhost:3000

### Option 2 — locally (Node.js 20+)

```bash
npm install
npm run dev      # development mode with auto-reload
# or a production build:
npm run build && npm start
```

### Environment variables

Copy `.env.example` → `.env` if needed (the defaults work out of the box):

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP server port |
| `GREEN_API_BASE_URL` | `https://api.green-api.com` | API base URL (for a self-hosted instance) |
| `GREEN_API_TIMEOUT_MS` | `15000` | Outgoing request timeout |

## Deployment (Render)

The repo ships a `render.yaml` blueprint. On [Render](https://render.com):
**New → Blueprint → connect this repository**. Render reads `render.yaml`, builds the
Docker image and exposes a public HTTPS URL. The `PORT` variable is provided by Render
automatically and read by the app. Health checks hit `/health`.

## How to use

1. In the GREEN-API console create an instance on a free developer account.
2. Scan the QR code and connect a phone number.
3. On the page enter `idInstance` and `ApiTokenInstance` (stored in localStorage; the token field is masked).
4. Click `getSettings`, `getStateInstance`, `sendMessage`, `sendFileByUrl` —
   the method's response is shown in the read-only field on the right along with the HTTP status.

## Testing without a real instance

The validation and proxy logic can be checked without credentials:

```bash
# Validation error (empty credentials) -> HTTP 400
curl -s http://localhost:3000/api/getSettings \
  -H 'Content-Type: application/json' \
  -d '{"idInstance":"","apiTokenInstance":""}'

# Wrong idInstance -> GREEN-API nginx returns 403, wrapped into a JSON envelope with a hint
curl -s http://localhost:3000/api/getSettings \
  -H 'Content-Type: application/json' \
  -d '{"idInstance":"123","apiTokenInstance":"faketoken"}'
```

With real credentials `sendMessage` returns `{"idMessage":"..."}` and the message is delivered.

## Commands

```bash
npm run dev      # dev server (tsx watch)
npm run build    # compile TS + copy static assets to dist/
npm start        # run the compiled build
npm test         # unit and integration tests
npm run lint     # ESLint
```

## Structure

```
src/
  server.ts            entry point (bootstrap + graceful shutdown)
  app.ts               Express app factory (reused by tests)
  config.ts            configuration from env
  validation.ts        zod schemas and chatId normalization
  greenApi/client.ts   typed GREEN-API HTTP client
  routes/api.ts        /api/* proxy routes
  middleware/          single error handler
  public/              the HTML page (index.html, styles.css, app.js)
tests/                 vitest: validation + api
```
