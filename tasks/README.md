# Task System — how the web redesign builds itself

This folder turns the approved redesign plan (Urban Flood Digital Twin web UI,
see `docs/` and the plan history in this session) into a backlog of atomic tasks,
one per build iteration — mirroring the pattern used in `D:\project\XmindClone`.
A routine loop executes **one task per iteration**, marks it done, and commits.

## Files

| File | Role |
|---|---|
| [INDEX.md](INDEX.md) | The full ordered backlog. Checkboxes are the **single source of truth** for status. |
| [ROUTINE.md](ROUTINE.md) | The per-iteration playbook. This is the prompt the loop runs each time. |
| [PROGRESS.md](PROGRESS.md) | Append-only log of completed tasks (date, id, summary, verify result). |
| [BLOCKERS.md](BLOCKERS.md) | Questions/decisions that paused a task. Review these yourself. |
| [_TEMPLATE.md](_TEMPLATE.md) | Shape of a detailed task spec. |
| [../docs/learn-log/](../docs/learn-log/) | **Lesson per task** — the "teach it back" report written each run (see ROUTINE step 6). |
| [../CLAUDE.md](../CLAUDE.md) | Agent guide + the Task System / Learn-Log pointer (loaded every session). |
| `backlog/phase-*.md` | Detailed specs per phase. `phase-0.md` is fully written; later phases are derived on demand (see ROUTINE step 3). |

## Status markers in INDEX.md

- `- [ ]` todo
- `- [x]` done
- `- [!]` blocked (see BLOCKERS.md)

## How to wire the routine loop

Each iteration should run with this prompt (it points at the playbook, which
contains all the detail):

```
Read tasks/ROUTINE.md and execute exactly ONE task, then stop.
```

You can drive that on a timer in any of these ways:

- **In-app `/loop`** — run every N minutes/hours:
  `/loop 1h Read tasks/ROUTINE.md and execute exactly ONE task, then stop.`
- **Scheduled cloud routine** — use the `/schedule` skill for a cron routine with
  the same prompt.
- **Manual** — just ask for the next task whenever you want it done. This is how
  the backlog was worked through in the session that created it.

> The loop is **resumable and stateless**: state lives entirely in `INDEX.md` +
> `PROGRESS.md` in the repo, so it survives restarts and runs on any machine.

## Scope covered by this backlog

This backlog is scoped to the **web app redesign only** (`web/src`), per the
approved plan: rebuild `web/` as a 9-page "Urban Flood Digital Twin" sidebar UI
(Dashboard, Bản đồ GIS, Quan trắc thời gian thực, Dự báo, What-if Analysis,
Công trình & Vận hành, Thiệt hại & Tác động, Báo cáo, Quản trị hệ thống) +
reskinned Login, 3-tier access (Khách/Cơ quan/Admin), bilingual VI/EN, mock data
backed by a swappable `web/src/data/` service layer. `mobile/`, `data-pipeline/`,
`shared/` are out of scope for this backlog.

## Assumptions baked into the backlog

- No new test framework is introduced (repo has no Vitest/Playwright today) —
  verification is `tsc --noEmit` + `npm run build` + `node scripts/check-i18n.mjs`
  + manual `npm run dev` smoke-checks.
- All "control" actions (gate/pump operation, backups, config edits) are local
  mock state changes only — never wired to a real device or service.
- If any assumption is wrong, edit the relevant tasks in `INDEX.md` before
  looping further.
