<!--
  LEARN-LOG REPORT TEMPLATE
  Copy this file to  docs/learn-log/<task-id>-<slug>.md  (e.g. P1-01-dashboard-service.md)
  and fill it in. Plain language, no unexplained jargon — define terms on first use.
  Depth scales with difficulty: a trivial task can leave most sections as one line
  ("Nothing new here"); a task introducing a real new pattern gets the full treatment.
  Delete these HTML comments and any section that genuinely doesn't apply.
-->

# <task-id> — <Short title>

**Date:** <YYYY-MM-DD> · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
> What did this task build, and what is it for?

## 2. Where it fits
- Which phase in [tasks/INDEX.md](../../tasks/INDEX.md)?
- What can the app do *after* this task that it couldn't before?

## 3. The problem
What made this task need actual thought (vs. rote repetition of a pattern
already used elsewhere in the app)?

## 4. Concepts introduced
> For each new concept this task relies on:

### <Concept name>
- **Plain definition:** one sentence, no jargon.
- **Why it shows up here:** the concrete reason this task needed it.

*(repeat per concept; if nothing genuinely new, say so and skip to §5)*

## 5. How it was approached
- Options considered (including ones rejected) and why the chosen one won.
- Existing code reused (link the file) vs. genuinely new.

## 6. Where it got stuck (if anywhere)
- **Symptom** → **cause** → **fix**. If it went smoothly, say "No real snags."

## 7. How to verify it yourself
```bash
<command(s) — e.g. cd web && npx tsc --noEmit>
```
Expected: `<what a passing result looks like>`

## 8. Gotchas / things to remember
- Short reminders — traps this task's approach could fall into if touched again.
