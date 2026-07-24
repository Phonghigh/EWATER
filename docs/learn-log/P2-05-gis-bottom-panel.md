# P2-05 — GIS map bottom panel: reused charts + camera placeholder

**Date:** 2026-07-23 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Added the bottom row of `/gis-map`: the exact same `RainForecastChart`/
`WaterLevelForecastChart` components Dashboard uses (P1-06), plus a
"Camera trực tiếp" placeholder — no new chart logic, no 3-tab biểu đồ/trạm/
công trình panel from the original mockup.

## 2. Where it fits
- Fifth task of Phase 2 in [tasks/INDEX.md](../../tasks/INDEX.md) — this
  closes out all of Phase 2's card/panel tasks; only P2-06 (confirm the
  Dashboard link) and P2-07 (i18n sweep) remain.
- `/gis-map` now has its full 2026-07-23-revised layout: top bar (P2-01) →
  layer panel + map + right panel (P2-02..P2-04) → bottom row (this task).

## 3. The problem
There wasn't really a technical problem to solve — the interesting part of
this task was **restraint**: the original mockup's bottom panel is a 3-tab
"Biểu đồ / Thông tin trạm / Thông tin công trình" block with its own chart
logic, station picker, and structure info cards. The 2026-07-23 user
decision (recorded in `tasks/backlog/phase-2.md` P2-05) replaced all of that
with "just reuse the 2 Dashboard charts" — so the actual work was making
sure nothing new got built beyond what was asked.

## 4. Concepts introduced

### Reusing a component across 2 unrelated pages unchanged
- **Plain definition:** `RainForecastChart`/`WaterLevelForecastChart` (built
  for Dashboard in P1-06) are imported into `GisMap.tsx` with zero
  modification — same props (`time`, `mm`/`levelM`), same internal window
  toggle, same styling classes (`.dash-chart-card` etc., which aren't
  Dashboard-specific despite the `dash-` prefix — they're just the generic
  "small chart card" style established there).
- **Why it shows up here:** confirms these components were already
  page-agnostic (they take raw data + render, no Dashboard-specific
  coupling) — nothing had to change to make them reusable, which wouldn't
  have been true if they'd reached into Dashboard-only context/state.

### A placeholder that names *why*, not just *when*
- **Plain definition:** `GisCameraCard`'s coming-soon message doesn't just
  say "sắp ra mắt" — it says camera data will exist once Phase 6's
  structures/operations registry lands, giving a concrete reason instead of
  a vague timeline.
- **Why it shows up here:** there's a real, identifiable reason this is
  missing (no camera asset table exists anywhere in the schema yet, and
  Phase 6 is explicitly where such a registry would be built per
  `tasks/INDEX.md` P6-01) — stating it costs nothing and is more honest than
  a generic "coming soon."

## 5. How it was approached
- No new data logic, no new chart component — literally just 2 import
  statements + a new tiny `GisCameraCard.tsx` (styled with the same
  `.dash-chart-card` class the reused charts already use, so all 3 bottom
  cards look consistent without new CSS beyond the grid row itself).
- Considered whether `GisCameraCard` even needed its own file (it's ~15
  lines) vs. inlining directly in `GisMap.tsx` — kept it as a separate file
  to match this codebase's established convention (`WeatherForecastCard`,
  `FloodMapPreview`, etc. are all their own files even when used once), not
  because the logic itself demanded it.

## 6. Where it got stuck (if anywhere)
No snags — this was the most mechanical task of Phase 2 so far, by design
(the interesting decisions were already made in the 2026-07-23 spec
revision, not during implementation).

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs
cd web && npm run build
```
Expected: all three clean. Manually: `npm run dev`, open `/gis-map`, scroll
to the bottom row — rain/water-level charts render with real data (same
numbers as Dashboard's equivalent cards at the same step data), camera card
shows the coming-soon message, not a broken image or empty box.

## 8. Gotchas / things to remember
- If Dashboard's rain/water-level charts change (props, styling, window
  options), `/gis-map`'s bottom row changes identically — they're the exact
  same component, not a fork. That's intentional per the 2026-07-23
  decision, not an accident to "fix" later.
- `GisCameraCard` has no camera-selection UI (unlike the mockup's dropdown)
  — there's nothing to select from yet.
