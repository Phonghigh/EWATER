# Learn-Log — teach-back reports for the web redesign

While `tasks/` builds the new Urban Flood Digital Twin web UI one task at a
time, this folder collects a short report per task explaining *what the
problem was, how it was solved, and what concept it introduces* — in plainer
language than a terse progress-log entry.

| File | What it is | Who it's for |
|---|---|---|
| [tasks/PROGRESS.md](../../tasks/PROGRESS.md) | Terse build ledger (changed / files / verify) | Tracking build state |
| **`docs/learn-log/<task>.md`** (this folder) | A short lesson per task | Understanding *why*, not just *what* |
| [docs/LEARNING_LOG.md](../LEARNING_LOG.md) | Concept-mastery tracker + mind map | Tracking what's been covered |

## How it works

1. After a task's code is done and verified (per [tasks/ROUTINE.md](../../tasks/ROUTINE.md)
   step 5), copy [`_TEMPLATE.md`](_TEMPLATE.md) to
   `docs/learn-log/<task-id>-<slug>.md` and fill it in — grounded in the actual
   diff and the `PROGRESS.md` entry for that task, not a generic explainer.
2. Add a row to the [Index](#index) below and update the concept tracker in
   [LEARNING_LOG.md](../LEARNING_LOG.md).

Unlike XmindClone (the pattern this is adapted from), there's no automated
research-trail capture or Stop-hook enforcement here — reports are written by
hand as part of finishing each task, scaled to how much the task actually
introduced (a one-line i18n-key task can say "Nothing new here"; a new
data-service pattern or layout mechanism gets the fuller treatment).

## Reading a report

Each report follows [`_TEMPLATE.md`](_TEMPLATE.md): one-sentence summary → why
it matters → the problem → concepts involved → how it was approached → where
(if anywhere) it got stuck → how to verify → gotchas.

## Index

Newest at the top. One row per task report.

| Task | Report | Notes |
|---|---|---|
| P1-01 | [dashboardService aggregate](P1-01-dashboard-service.md) | Surcharge ratio (>1.0) as flood depth above ground, not a bug to clamp; deterministic vs. random mock for untyped source fields |
| P0-16 | [Delete unused code, reverse pre-scaffold policy](P0-16-delete-unused-reverse-scaffold-policy.md) | YAGNI applied to your own recent scaffolding; verify bundle content by a library's own literal strings |
| P0-13 | [Route guard matrix verification](P0-13-route-guard-verification.md) | Static code-trace as a verification method, and its limits |
| P0-12 | [Reskin Login.tsx](P0-12-login-reskin.md) | Deviated from the mockup's field label for backend correctness |
| P0-11 | [Rewrite styles.css](P0-11-styles-rewrite.md) | CSS custom properties as a tiny design-token layer; verify-by-grep instead of instinct |
| P0-10 | [AppShell.tsx + new App.tsx router](P0-10-appshell-router.md) | Two independent nested layout routes (shell vs. auth gate) |
| P0-09 | [PageHeader.tsx](P0-09-pageheader.md) | Same slot-composition shape as the existing `Card` component |
| P0-08 | [TopBar.tsx](P0-08-topbar.md) | Design revision: sidebar always mounted, not hidden for guests |
| P0-07 | [Sidebar.tsx](P0-07-sidebar.md) | Filter a static config array by role instead of inline conditionals |
| P0-06 | [Delete old-design files](P0-06-delete-old-design-files.md) | Pure deletion — sequencing note only |
| P0-05 | [RequireRole (2 roles) + RequireGuestOrRole](P0-05-require-role-guards.md) | "Documentation component" that renders unconditionally on purpose |
| P0-04 | [Simplify AuthContext to 2 roles](P0-04-auth-2-roles.md) | "No session" as a real supported state (guest), not just loading |
| P0-03 | [Rewrite i18n strings foundation](P0-03-strings-foundation.md) | Bookkeeping only — no new concept |
| P0-02 | [data/ service layer skeleton](P0-02-data-service-skeleton.md) | The mock/real "service seam" pattern |
| P0-01 | [Extend types.ts](P0-01-extend-types.md) | Shared `DeltaStat`/`ScenarioImpactResult` reuse pattern |
