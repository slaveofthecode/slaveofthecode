---
name: add-resume-entry
description: Adding or editing CV content in src/data/resume.json — projects, experience, education, skills, certificates. Use when the request mentions resume, CV, project, role/experience, education, skill, or certification content. Creates schema-true entries only.
---

# Add / edit resume entries

Use ONLY for content changes in `src/data/resume.json`. The renderer reads key
names verbatim — a wrong or renamed key breaks a whole section.

## Rules

1. Read `src/data/resume.json` first and **follow the exact shape of existing entries**.
2. Never rename keys. Only add/edit the value parts below.
3. Preserve the current JSON style: 2-space indentation, keys quoted.
4. For projects, only `url.Github` and `url.Demo` are rendered (see
   `src/components/sections/Projects.astro`, `ICONS_PROFILES`).

## Entry shapes

| Section | Shape |
|---|---|
| `basics` (edit only) | `{ name, title, label, email, phone, url, summary, location:{city,country,googleMaps}, profiles[] }` |
| `experience[]` | `{ rol, company, mode:{time,type}, date:{start,end|null}, summary, stack:[], url|null }` |
| `education[]` | `{ institution:{abbreviation,name,url}, area, studyType, date:{start,end} }` |
| `skills[]` | `{ name }` |
| `projects[]` | `{ name, url:{Github, Demo?}, isActive?, description, highlights[] }` |
| `certificates[]` | `{ name, date, issuedBy, url }` |

Date strings follow existing human formats: months as e.g. `"May, 2024"`, years
as `"2001"` — match neighbors.

## Steps

1. Add the entry in the right array, matching the shape above.
2. Simulate the renderer: project → `projects.map` reads `name, description, url,
   highlights`; `url.Demo` renders a demo link, other keys render icons.
3. Verify any new icon key against `ICONS_PROFILES` before using it.
4. Run `npm run build` (see `verify-build` skill). If a section types against the
   JSON (`@types` generated), regenerate rather than hand-edit.
5. Update `.harness/memory/` per the `memory-update` skill.

## Scope boundary

If the request also implies UI changes (new section component, layout), switch to
the `feature-builder` agent for the component + this skill for the data.