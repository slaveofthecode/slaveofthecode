---
name: update-readme-gif
description: Updating the daily random-GIF automation for the GitHub profile README — update-readme.js, the GitHub Actions workflow, or the Giphy URL lists. Use when the request mentions random gif, daily gif, README image, Giphy, or update-readme.
---

# Update the daily random-GIF README

The profile `README.md` shows a random GIF refreshed by CI. **Three files hold GIF
URL lists and MUST stay in sync** — changing only one is a HARD rule violation:

1. `update-readme.js` — `gifs[]` array (the CI writer)
2. `src/pages/api/random-gif.ts` — `gifs` record (the live site endpoint)
3. `README.md` — static fallback in the `![Random GIF](...)` line (renders between CI runs)

## Workflow (`update-readme.js`)

- Reads `README.md`, replaces `![Random GIF](<url>)` with a random pick from its
  list, writes back. Runs at most once per day.

## CI (`.github/workflows/update-readme.yml`)

- Trigger: cron `0 0 * * *` + `workflow_dispatch`.
- Expected steps: checkout → setup node → `node update-readme.js` → commit named
  `🖼️ Update README with today's GIF` → push. No-change runs must not fail the job.

## Known gotchas

- **Bug:** the workflow calls `node update-readme.ts` but the file is
  `update-readme.js` — if you touch the workflow, fix this reference.
- The workflow runs `npm install` and pins `node-version: '16'`, but the script
  only uses Node built-ins (`fs`) — neither is required; prefer simplifying.
- Never change the GIF list in fewer than all three places. Prefer appending one
  URL to all three at once.
- Giphy URLs live under `https://media.giphy.com/media/<id>/giphy.gif`.

## Steps

1. Decide the change: replace the whole list (all three files) or append one URL.
2. Apply to `update-readme.js`, `random-gif.ts`, and `README.md` identically.
3. Sanity-check locally: `node update-readme.js` then `git diff README.md`
   (revert the local README mutation before committing unless intentional).
4. If touching the workflow, validate YAML + the fixed `update-readme.js` reference.
5. Run `npm run build` (site endpoint is TS) and update memory per `memory-update`.