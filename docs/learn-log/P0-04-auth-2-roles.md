# P0-04 — Simplify AuthContext.tsx to 2 roles

**Date:** 2026-07-20 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

## 1. In one sentence
Narrowed the `Role` union from three roles to two (`authority`/`admin`) and
made "no session" an intentional third access tier (guest) instead of just a
loading state.

## 4. Concepts introduced

### "No session" as a real state, not just "not ready yet"
- **Plain definition:** most apps treat `session == null` as "still loading"
  or "must log in" — a transient/error state. Here it's a legitimate,
  supported tier: guests get a real (if limited) view of the app.
- **Why it shows up here:** the new access model is Guest → Authority →
  Admin, and Guest has no login step at all. The `AuthContext` shape didn't
  need new fields for this — `session`/`profile` being `null` already meant
  "not logged in"; the only change was in *how routes interpret* that null
  (P0-10/P0-13), not in the context itself.

## 5. How it was approached
Removed `updateHomeLocation` in the same edit rather than leaving it dead —
its only caller (`MyArea.tsx`) is deleted in the very next task (P0-06), so
keeping an unused method around would just be clutter with no safety
benefit (nothing else could call it after P0-06 anyway).

## 6. Where it got stuck
No real snags. This task deliberately leaves the app red (unresolved
imports elsewhere still reference the removed `citizen` role/method) until
P0-05 and P0-06 land in the same sitting — see those reports.

## 7. How to verify it yourself
Verification is deferred to P0-06's report (the first point where the whole
app compiles again).
