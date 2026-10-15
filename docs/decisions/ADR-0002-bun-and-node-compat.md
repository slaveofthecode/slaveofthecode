# ADR-0002 Bun as package manager and test runner; Node-compatible API

- **Context:** we want a fast install/test loop and a runtime that also deploys to
  AWS Lambda (Node runtime).
- **Decision:** use **Bun** for install, scripts and `bun test` (Bun workspaces).
  `apps/api` and every package it imports must stay **Node-compatible** (web-standard
  `Request`/`Response`, no Bun-only APIs).
- **Consequences:** fast local tooling; the API bundles/ports cleanly to Lambda later.
  Cost: avoid Bun-specific globals in shared/backend code.
