# P0-06 — Delete old-design files

**Date:** 2026-07-20 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

## 1. In one sentence
Deleted the 10 files that made up the old FRMIS-style portal UI (pages,
top-nav, citizen-only map picker, nearest-node helper), clearing the way for
the new sidebar UI's pages to take their routes.

## 3. The problem
Nothing new conceptually — pure deletion. The only judgment call was
*sequencing*: this had to happen after P0-04/P0-05 (so nothing still-live
referenced the removed `citizen` role) and before P0-10 (which rewrites
`App.tsx` to stop importing the now-gone files). Leaving `App.tsx` red in
between is intentional, not a mistake — see PROGRESS.md's note.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
```
Expected right now: errors, but **all of them inside `App.tsx` only** — that
confirms the deletion itself didn't break anything it shouldn't have. Full
green comes back once P0-10 rewrites `App.tsx`.
