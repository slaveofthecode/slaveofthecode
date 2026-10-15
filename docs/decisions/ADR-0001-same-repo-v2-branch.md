# ADR-0001 Same repo with long-lived `v2` branch and cutover PR

- **Context:** the repo hosts the live portfolio on `main` (production). v2 must be
  built without disturbing production.
- **Decision:** keep one repo. Long-lived branch `v2`; features branch from `v2` and
  PR into `v2`. At the end a human-driven PR `v2 → main` replaces the old site.
  Never touch `main` or `v2` directly.
- **Consequences:** production stays stable during development. History is shared, so
  the cutover is one reviewable PR. Cost: two protected branches to maintain and a
  large final diff.

- **Status:** superseded — the cutover happened (PR #19, merge `d1c617b`); `main` is now
  the new site and `v2` is no longer used.
