# @portfolio/api

Node-compatible TypeScript backend (web-standard `Request`/`Response`), runs on AWS
Lambda later. **No Bun-only APIs** here or in any package it imports. May import
`@portfolio/content` only. Never imports `@portfolio/web`.

Layers (when it grows): `domain` → `application` → `adapters`, dependencies point
inward. Skeleton only now; the chat (`POST /chat`, `LLMProvider`) comes later.
Rules live in the root `AGENTS.md`.
