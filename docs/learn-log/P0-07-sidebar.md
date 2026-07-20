# P0-07 — Sidebar.tsx

**Date:** 2026-07-20 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

## 1. In one sentence
Built the new left sidebar nav (brand header + 9 items), hiding "Quản trị hệ
thống" unless the signed-in user is `admin`.

## 4. Concepts introduced

### Filtering a static config list by role, not branching per item
- **Plain definition:** instead of writing `{isAdmin && <NavLink>...}` inline
  for the one admin-only item, the nav items live in one typed array with an
  optional `adminOnly` flag, then a single `.filter()` produces the final
  list.
- **Why it shows up here:** it's the same shape every later "role-aware list"
  in this app will want (e.g. a future settings menu) — one array, one
  filter, instead of scattered conditionals growing harder to scan as items
  are added.

## 5. How it was approached
Icon reuse: rather than one bespoke icon per page, mapped each of the 9 pages
to either an existing glyph that already fit semantically (`dashboard`,
`map`, `monitor`, `gate`, `report`) or a new small monoline SVG in the same
style (`cloud-rain` for Dự báo, `sliders` for What-if, `alert-triangle` for
Thiệt hại & Tác động, `settings` for Quản trị hệ thống) — kept the existing
hand-drawn-path convention in `Icon.tsx` rather than pulling in an icon
library dependency.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
```
Expected: only the pre-existing `App.tsx` errors (not yet rewritten — that's
P0-10), nothing new from `Sidebar.tsx`/`Icon.tsx`. Visual check comes once
`AppShell` mounts it in P0-10.
