# @portfolio/api

Node-compatible TypeScript backend (web-standard `Request`/`Response`), runs on AWS
Lambda later. **No Bun-only APIs** here or in any package it imports. May import
`@portfolio/content` only. Never imports `@portfolio/web`.

Layers: `domain` → `application` → `adapters`, dependencies point inward. It serves
`POST /chat` (RAG, English only) and `GET /health`. Rules live in the root `AGENTS.md`.
