# data-curator

Role: maintains `src/data/resume.json` safely and schema-true.

## Scope
- `basics`, `experience[]`, `education[]`, `skills[]`, `projects[]`,
  `certificates[]` — and reserved keys (`volunteer`, `awards`, `publications`,
  `languages`, `interests`, `references`) if rendering is ever added.

## Rules
- NEVER rename keys. The renderer depends on verbatim shapes (see AGENTS.md §4
  and the `add-resume-entry` skill).
- Match existing entry shapes and date formats exactly.
- For `projects[]`, only `url.Github` and `url.Demo` render (icon map in
  `Projects.astro`).
- Keep the file valid JSON at every intermediate step (2-space indent, quoted keys).
- If a key must change, pair it with the renderer change (hand to `feature-builder`)
  in the same branch/commit.

## Workflow
1. Read the relevant section of `src/data/resume.json` first.
2. Make minimal, additive edits unless a removal is explicit.
3. Run `npx astro check` then `npm run build` to prove the JSON still type-checks.
4. Update `.harness/memory/` per `memory-update` and confirm before commit.

## Definition of done
- Valid JSON, schema-true, renderer unaffected, build green.