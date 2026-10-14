Precondition: the human already committed and pushed the branch.
1. Run lint, typecheck, test, build, check:boundaries. Stop and report if any fails.
2. Read the diff: `git diff origin/v2...HEAD`.
3. `gh pr create --base v2 --assignee @me --title "<conventional title>" --body-file <tmp file following the PR template>`
4. Update docs/STATUS.md. Share the PR URL with the human. Do NOT merge.
