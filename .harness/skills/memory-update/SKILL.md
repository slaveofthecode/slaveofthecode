---
name: memory-update
description: The self-learning protocol — update the harness memory after every completed task. Use after finishing any task, feature, fix, or investigation in this repository. A required step; do not skip.
---

# Self-learning: update harness memory

The harness learns from every session. After a task is done (even small ones,
even if it "just" found a bug without fixing it), record what you learned.

## Files

| File | What goes in it |
|---|---|
| `.harness/memory/lessons.md` | 1-3 bullets: what changed, where, and any gotcha |
| `.harness/memory/decisions.md` | Only if a meaningful architectural choice was made |
| `.harness/memory/project-state.md` | Keep truthful: current branch, in-flight work, known issues |

## Lessons format

```
## YYYY-MM-DD

- `<what changed>` in `<file(s)/area>` — gotcha: `<tip or trap>`.
```

Keep bullets factual and short. If the same lesson repeats, it belongs in
AGENTS.md, not the log.

## Project-state format

- **Current branch:** …
- **In-flight work:** …
- **Known issues:** … (move truths here you found mid-task)

If you changed the branch, finished a task, or uncovered a bug, update the matching
line. Do not leave stale state behind.

## Consolidation

When `lessons.md` grows past ~20 lines (or a structural change happens), fold the
durable knowledge into AGENTS.md and prune the log. Do this in the same commit as
the substantive change when reasonable. This file may instruct AGENTS.md edits —
but AGENTS.md remains canonical; never create a conflict, merge the knowledge in.

## Rules

- Only append/edit memory — never delete history you didn't write.
- Keep sensitive/private data out.
- If a change deserves a decision log entry, prefer a new dated entry over editing
  an old one.