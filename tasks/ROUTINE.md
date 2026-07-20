# ROUTINE — execute exactly ONE task per run

You are a build agent for the EWATER web redesign (Urban Flood Digital Twin
Platform UI). Each run you complete **one** atomic task from the backlog, then
stop. You may start cold with no memory of previous runs — all state is in the
repo. Follow these steps exactly.

## 0. Orient (read first)

- Read [tasks/INDEX.md](INDEX.md) — the backlog + status.
- Read the tail of [tasks/PROGRESS.md](PROGRESS.md) to see what just shipped.
- Skim the relevant `tasks/backlog/phase-N.md` section for this task's detail.

## 1. Pick the next task

- Scan `INDEX.md` top-to-bottom. The next task is the **first `- [ ]`** whose
  dependencies (`deps:`) are all `- [x]`.
- If that task is `- [!]` blocked, skip it and take the next eligible one.
- If no task is eligible (all done, or all remaining are blocked), **stop** and
  write a short status summary. Do not invent work.

## 2. Confirm scope

- Implement **only this one task**. Do not start the next one, even if small.
- If the task turns out to be too large for one run (touches many unrelated
  files, or bundles multiple distinct efforts), **split it**: replace its line
  in `INDEX.md` with 2–4 smaller `- [ ]` sub-tasks (suffix ids like
  `P0-06a`/`P0-06b`), then implement only the first.

## 3. Get the detailed spec

- Open `tasks/backlog/phase-<N>.md` and find this task's section.
- **If no detailed section exists** (later phases are not pre-written): create
  one now using [_TEMPLATE.md](_TEMPLATE.md), deriving the detail from the
  `INDEX.md` line plus the corresponding Phase description in the approved
  redesign plan (the per-page UI-block breakdown already captured there — see
  `docs/learn-log/README.md` for where that plan content lives, or ask the user
  if it's not findable). Append it to the correct `backlog/phase-<N>.md`.

## 4. Implement

- Match surrounding conventions: TypeScript strict, plain CSS (no new
  framework), bilingual VI/EN via `useT()`/`t()` — every new string gets a key
  in **both** `vi` and `en` blocks of `web/src/i18n/strings.ts` in the same
  edit.
- Reuse existing modules before writing new ones — see the "port" list in the
  approved plan (`map/`, `monitoring/`, `sim/`, `network/trace.ts`,
  `state/store.ts`, `DataTable.tsx`, `ChartModal.tsx`, `StepControl.tsx`, etc.).
- Any "control" UI (gate/pump ops, backup, config save) must change local mock
  state only, with a `DemoBadge`/note — never imply real device control.
- Keep the change focused and cohesive.

## 5. Verify (must pass before marking done)

Run what applies to the files you touched:
- `cd web && npx tsc --noEmit`
- `cd web && node scripts/check-i18n.mjs` (must report no vi/en key mismatch)
- `cd web && npm run build`
- For UI changes: describe the manual check you'd run in `npm run dev`
  (no Playwright in this repo — no automated e2e).
- Meet the task's **Done when** acceptance criteria explicitly.

If verification fails and you cannot fix it within this run, see step 8 (blocked).

## 6. Teach it back — write the learn-log report (before finishing)

Every task that changes product code (`web/src/**`) ships a short lesson
alongside it:
1. Copy [../docs/learn-log/_TEMPLATE.md](../docs/learn-log/_TEMPLATE.md) to
   `docs/learn-log/<task-id>-<slug>.md` and fill it in: the problem, the new
   concept(s) this task introduces (React/GIS/hydrology/architecture — with a
   plain-language analogy where useful), how you approached it and what you
   rejected, where you got stuck (if anywhere), and how to redo + verify it.
   Scale depth to difficulty — a one-line i18n-key task gets a short report; a
   new layout engine or data-service pattern gets the full treatment.
2. Add a row to the index in [../docs/learn-log/README.md](../docs/learn-log/README.md).
3. Update the concept tracker in [../docs/LEARNING_LOG.md](../docs/LEARNING_LOG.md)
   using the `learning-log` skill (new concepts this task introduces).

## 7. Bookkeeping (on success)

1. Mark the task `- [x]` in `INDEX.md`.
2. Append one entry to `PROGRESS.md`:
   `## <YYYY-MM-DD> — <task-id> <title>` then bullets: changed / files / verify
   / follow-up.
3. Do not commit to git unless the user explicitly asked for commits in this
   session — leave changes staged/working-tree unless told otherwise.
4. **Stop.** One task per run (unless the user is driving the session
   interactively and asks to continue immediately).

## 8. If blocked

- Mark the task `- [!]` in `INDEX.md`.
- Append to [BLOCKERS.md](BLOCKERS.md): the task id, what's blocking, and the
  specific decision/info needed from the user.
- Then either take the next eligible task (back to step 1) **or**, if the
  blocker is fundamental, stop and report. Never thrash retrying the same
  failing approach.

## Guardrails

- **One task, every run** in autonomous/looped mode. In an interactive session
  where the user is actively driving, working through several consecutive
  eligible tasks is fine — but still update `INDEX.md`/`PROGRESS.md`/learn-log
  per task, not batched at the end.
- Don't fake green. If verification fails, the task isn't done — block it.
- Don't delete or rewrite work from earlier tasks unless this task says to.
- Keep `INDEX.md` ordering intact; only change checkboxes or split lines.
