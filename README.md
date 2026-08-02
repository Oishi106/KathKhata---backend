# KathKhata AI — Backend

AI-powered business management REST API for sawmill owners in Bangladesh.

## Tech Stack
Node.js, Express, TypeScript, MongoDB/Mongoose, JWT auth (access + refresh),
bcrypt, Cloudinary, Zod validation, Helmet, rate limiting, Winston logging,
Swagger docs, node-cron.

## Getting Started

```bash
cp .env.example .env   # fill in your values
npm install
npm run dev             # http://localhost:5000
```

- Health check: `GET /health`
- API base: `/api/v1`
- Swagger docs: `/api-docs`

## Architecture

Feature-based modules under `src/modules/<feature>/{controllers,services,routes,models,validators}`.
Each module owns its own Mongoose model, business logic, and REST routes —
new modules (Marketplace, Artisan Management, OCR, etc.) can be added the
same way without touching existing code.

## AI Module

`src/modules/ai/services/aiProviderFactory.ts` abstracts the AI vendor.
Ships with a dependency-free `MockAIProvider` so the app works with zero
config, plus a `GeminiAIProvider` ready to activate via `AI_PROVIDER=gemini`
and `GEMINI_API_KEY` in `.env`. Add OpenAI or others by implementing the
same `AIProvider` interface.

## Docker

```bash
docker compose up --build
```

## Scripts
- `npm run dev` — start with ts-node + nodemon
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run compiled server
