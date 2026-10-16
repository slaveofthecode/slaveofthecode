# Proposed learnings (human approves before they go to AGENTS.md)

Durable lessons proposed by the agent. The human reviews them and promotes the
good ones into `AGENTS.md`. Do not edit `AGENTS.md` directly.

- Git gotchas carried over from v1: direct pushes to protected branches are rejected
  (`GH013`); use feature branches + PRs. `gh` is authenticated and SSH works.
- opencode custom commands declared inline need a `template` field (a `prompt` field
  is rejected). Markdown command files under `.opencode/command/` use the body as the
  template, with `$ARGUMENTS` for user input.
- (PR-5) `astro check` (`@astrojs/check`) failed to import because Bun does not materialize
  the *bundled* transitive `@emnapi/wasi-threads` of `@emnapi/core` (pulled in by
  `@astrojs/astro2tsx`). Workaround: declare `@emnapi/wasi-threads` as a root devDependency.
  Revisit when Bun or `@astrojs/check` fixes bundled-dep handling.
- (PR-14) PDF-derived JSON that humans then polish is **not idempotent** if the
  ingester overwrites everything: a plain re-run reintroduces PDF artifacts
  (`UT ( Jest )`, `.NET`→`NET`) and drops hand-added fields (`profile.links`, cert
  `issuer`/`date`). Two rules fix it: (1) match entries by a stable natural key and
  reuse ids, carrying over fields the source lacks and keeping the old value when it
   only differs by punctuation/casing; (2) write a file only when its content changed
   (compare a key-sorted stringify) so unchanged files keep their original formatting.
- (Vercel API) Vercel does **not** bundle `api/*.ts` Node functions: it transpiles each
  file (ts-morph) and runs them under Node ESM, with `@vercel/nft` tracing but leaving
  bare (node_modules) specifiers external. So every relative import in the traced graph
  needs an explicit `.js` extension (`ERR_MODULE_NOT_FOUND: Cannot find module
  '/var/task/.../src/index'`), and the runtime must not import a workspace TS package
  (Node can't run its `.ts`); keep such values local. Loading the sql.js `.wasm` from
  disk likewise fails — embed it (base64). Verify a fix by transpiling per-file
  (`tsc`/type-stripping) and running the emitted ESM under Node, not by bundling.
