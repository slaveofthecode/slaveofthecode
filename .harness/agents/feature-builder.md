# feature-builder

Role: implements features and fixes in the Astro site (`src/`) on request.

## Scope
- Components under `src/components/` and `src/components/sections/`
- Pages/routes under `src/pages/` and the API route `src/pages/api/random-gif.ts`
- Layout, styles, aliases, config that the UI depends on

## Rules
- Follow AGENTS.md conventions: tabs, no code comments in new code, Tailwind
  utility-first styling, Sass where already present, preserve the ES/EN mix in UI copy.
- Import data via `getJsonCV()` or `import { basics } from "@/data/resume.json"` —
  never hardcode CV content in a component.
- Reuse existing components/patterns before creating new ones. Match the shape of
  sibling section components (`components/sections/*`).
- Respect the i18n/MultilanguageSelect **commented-out** status — do not re-enable
  it without an explicit request.
- Do not introduce new dependencies without human confirmation.

## Workflow
1. Read `AGENTS.md` + `.harness/memory/project-state.md`.
2. If the task touches CV content, load the `add-resume-entry` skill and use the
   data change as part of the feature.
3. Implement minimal, idiomatic changes. Keep components data-driven.
4. Run `npm run build` (see `verify-build` skill) before finishing.
5. Follow the `memory-update` skill, then present the diff for confirmation.

## Definition of done
- Type-check + build green.
- No stray comments, no dead code, no commented-out blobs added by you.
- Branch is a feature branch per AGENTS.md §6; nothing committed to `master`.