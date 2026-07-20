# P0-08 — TopBar.tsx

**Date:** 2026-07-20 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

## 1. In one sentence
Built the top bar: date, a static mock weather chip, bell/help buttons, the
language toggle, and a user chip that shows "Khách"/Guest when nobody's
signed in.

## 5. How it was approached
Rejected wiring a real weather API — the old app had a working Open-Meteo
rainfall-forecast integration for a *different* feature (the FRMIS dashboard
chart), but a generic "current weather chip" in the top bar is new scope, not
a straight port. Kept it as an explicit static mock rather than silently
adding a new external dependency without it being asked for or reviewed.

## 6. Where it got stuck
No real snags — this also prompted revisiting a decision from P0-07: rather
than hiding the whole `Sidebar` for guests (as first sketched in that task's
comment), the simpler design is to always show it and let clicking a locked
item redirect to `/login` via the existing `RequireAuth`, same as a normal
app's nav. Updated `Sidebar.tsx`'s doc comment to match. Both this task's
`TopBar` and P0-07's `Sidebar` are now consistently "always mounted."

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
```
Expected: no new errors. Visual check comes once `AppShell` mounts it (P0-10).
