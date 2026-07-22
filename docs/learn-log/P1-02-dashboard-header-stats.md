# P1-02 — Header + 6 stat-card

**Date:** 2026-07-22 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
First real page of the redesign: `/` now renders `Dashboard.tsx` (header + 6
headline stat-cards) instead of the `ComingSoon` placeholder, using P1-01's
`dashboardService` over real Supabase-backed `AppData`.

## 2. Where it fits
- Phase 1 (Dashboard, Tab 1) in [tasks/INDEX.md](../../tasks/INDEX.md), second
  task after P1-01.
- Before this task the whole app had zero pages rendering real data — every
  route was `ComingSoon`. Now signing in (or visiting as guest) shows actual
  flood/rainfall/pump numbers computed from live data.

## 3. The problem
`dashboardService.getDashboardOverview(data, step)` needs a `step` (index
into the simulation's time series), but no shared "current step" concept
exists yet in the app — that's what Phase 2's playback control (`P2-01`,
`store.currentStep`) will add. This page had to pick a reasonable stand-in
without inventing a fake data source or blocking on Phase 2.

## 4. Concepts introduced

### Derived "current time" from a step index
- **Plain definition:** the simulation stores a fixed array of time steps
  (`start` + `stepMinutes` × index), not wall-clock timestamps — so "what time
  is it now" has to be computed (`start + step*stepMinutes`), not read
  directly.
- **Why it shows up here:** the mockup's top-right "cập nhật lúc" (updated at)
  timestamp had to come from real simulation data, not `new Date()` (the
  simulated day isn't "today").

### Picking a placeholder over inventing a feature
- **Plain definition:** when a dependency (shared step control) doesn't exist
  yet, use the most defensible real value available (`steps - 1`, the last
  known step) rather than building a throwaway version of the missing
  feature.
- **Why it shows up here:** building even a minimal step-picker here would
  duplicate/preempt P2-01's real playback UI. Using the last step keeps the
  page honest (real latest data) without scope creep.

## 5. How it was approached
- Reused `PageHeader` (`components/layout/PageHeader.tsx`) unchanged — same
  "TAB N. Title" pattern every other page will use.
- Added 3 new monoline icons (`route`, `droplet`, `pump`) to
  `components/Icon.tsx` following the existing single-color-stroke SVG style,
  rather than pulling in an icon library for 3 glyphs.
- Card 3 (rainfall) and card 4 (water level) mockups show fake per-station
  names ("Trạm Vũng Liêm", "Sông Tiền (Cầu Mỹ Thuận)"). Source data has no
  per-station identity (documented back in P1-01/`REAL-DATA-01`), so those
  sub-labels were changed to "area average" / the real manhole `muid` instead
  of inventing station names — a deliberate, documented deviation from the
  mockup for correctness.

## 6. Where it got stuck (if anywhere)
No real snags. One correction mid-task: `dash.maxWaterLevel.sub` was first
written as `"Nút {muid}"` assuming `t()` supports placeholder interpolation —
checked `I18nContext.tsx` and confirmed `t(key)` takes no arguments, so the
key was simplified to a static "Nút"/"Node" label and the `muid` is
concatenated in the component instead.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs   # run from repo root
cd web && npm run build
cd web && npm run dev         # visit / as guest and signed-in, toggle LangToggle
```
Expected: all three commands clean; the 6 cards show non-negative numbers
pulled from Supabase; every card's text flips language with `LangToggle`
and nothing is left in the other language.

## 8. Gotchas / things to remember
- `step = data.simulation.steps - 1` is a documented placeholder — once
  P2-01 lands a shared step/playback source, this page should switch to
  reading that instead of recomputing its own "last step".
- `t()` has no string interpolation — any key needing a dynamic value must
  be split into a static label + value concatenated in the component, not a
  `{placeholder}` inside the string.
