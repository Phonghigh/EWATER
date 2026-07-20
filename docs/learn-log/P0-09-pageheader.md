# P0-09 — PageHeader.tsx

**Date:** 2026-07-20 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

## 1. In one sentence
A generic "title + optional sub-tabs + optional right-side controls" header
component every one of the 9 pages will reuse.

## 3. The problem
Nothing new conceptually — this is the same `children`/slot-composition idea
already used elsewhere in the codebase (e.g. `Card` in `components/Cards.tsx`
takes a `title`/`right`/`children`). `PageHeader` follows the identical shape
so pages compose predictably.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
```
Expected: no new errors. Real visual verification happens once a page (Phase
1's Dashboard) actually uses it with real `tabs`.
