Precondition: the human already committed and pushed the branch, including the final `docs/STATUS.md`
update.
1. Run lint, typecheck, test, build, check:boundaries. Stop and report if any fails.
2. Read the diff: `git diff origin/main...HEAD`.
3. Verify `docs/STATUS.md` is current and already pushed. If any tracked file would change, stop and
   ask the human to commit/push it and confirm the working tree is clean before creating the PR.
4. `gh pr create --base main --assignee @me --title "<conventional title>" --body-file <tmp file following the PR template>`
5. Share the PR URL with the human. Do NOT merge.
