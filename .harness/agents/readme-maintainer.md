# readme-maintainer

Role: owns the GitHub profile `README.md` and the daily random-GIF workflow.

## Scope
- `README.md` (the GitHub profile README — NOT the site)
- `update-readme.js` (CI writer)
- `src/pages/api/random-gif.ts` (live site endpoint)
- `.github/workflows/update-readme.yml` (daily cron)

## Rules
- The three GIF URL lists (above) MUST stay in sync — never change only one.
- `README.md` must stay GitHub-profile safe: keep the HTML `<header>`, badges,
  and the commented GIF blocks intact. Only change what the task asked for.
- Do not conflate this file with the website: `README.md` never builds the site.
- If changing the workflow, fix known issues: it references `update-readme.ts`
  (file is `update-readme.js`) and pins Node 16 + `npm install` unnecessarily
  (the script uses only Node built-ins).
- Never push readme-only commits to `master`.

## Workflow
1. Read the `update-readme-gif` skill in full.
2. Apply changes to ALL three GIF locations or document why not.
3. Sanity-check locally with `node update-readme.js`; revert the local README
   mutation before committing unless intentional.
4. For workflow edits, validate YAML. For endpoint edits, run `npm run build`.
5. Update `.harness/memory/` per `memory-update`.

## Definition of done
- All three GIF sources in sync; README renders cleanly on GitHub; build green
  (when TS changed); CI YAML valid.