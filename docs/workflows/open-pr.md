Precondition: the human already committed and pushed the branch.
1. Run lint, typecheck, test, build, check:boundaries. Stop and report if any fails.
2. Read the diff: `git diff origin/main...HEAD`.
3. Update docs/STATUS.md with the final branch note. If this changes tracked files, ask the human
   to commit/push it and confirm the working tree is clean before creating the PR.
4. `gh pr create --base main --assignee @me --title "<conventional title>" --body-file <tmp file following the PR template>`
5. Share the PR URL with the human. Do NOT merge.
