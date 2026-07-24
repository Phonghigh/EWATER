# Follow-up — Real wall-clock time for "Hiện tại" + simulation playback

**Date:** 2026-07-23 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Replaced the "no live now" placeholder used throughout Phase 1/2
(`step = simulation.steps - 1`, always the storm's final/peak state) with
a real mapping from the system clock's current hour:minute onto the
simulation's fixed 24-hour cycle — Dashboard and `/gis-map` now show
whatever the simulation looked like at the actual current time of day, and
`/gis-map`'s "Hiện tại"/`+Nh` playback controls finally anchor to something
real.

## 2. Where it fits
- Directly requested by the user after the flood-heatmap and time-preset
  bug-fix follow-ups: "Dùng thời gian thật hiện tại. Triển khai chức năng
  mô phỏng." (use the real current time; implement the simulation
  feature).
- Retires a placeholder documented since P1-02
  (`docs/learn-log/P1-02-dashboard-header-stats.md`) and referenced in
  nearly every Phase 1/2 learn-log since ("no live now" convention).

## 3. The problem
`simulation.nodeFill` (the flood dataset driving both Dashboard and
`/gis-map`) is a single fixed array — `start: "00:00"`, `stepMinutes: 15`,
`steps: 97` — with **no calendar date attached**. It's not "yesterday's
data" or "today's data," just one static 24-hour cycle. Every earlier task
sidestepped "what does 'now' mean" by picking a fixed array position
(`steps - 1`, the last/most dramatic step) and documenting it as a
placeholder. The user now wants a real answer, and the only one available
without inventing new data is: since the array *does* span exactly one full
day, today's real clock time always corresponds to a real, already-computed
step in it.

## 4. Concepts introduced

### Mapping a real, dateless clock onto a data array that has no dates
- **Plain definition:** `currentSimStep()` (`web/src/lib/simTime.ts`) takes
  `new Date()`, extracts just the hour:minute (ignoring the actual
  calendar date, which the simulation has no notion of), and finds the
  step whose `start + step*stepMinutes` clock label is closest to it,
  wrapping via `% 1440` in case `simulation.start` isn't exactly `"00:00"`.
- **Why it shows up here:** this is a genuinely different category of
  "real" than everything flagged as a placeholder before it — it doesn't
  invent a value, it looks up a real value using a real clock, at the cost
  of the answer repeating every 24 hours (there's no way to distinguish
  "today's storm" from "yesterday's storm" with this dataset — a real
  limitation, not hidden).

### A live value must decide who owns re-triggering it
- **Plain definition:** `useCurrentSimStep()` is a hook that recomputes
  `currentSimStep()` every 60 seconds via `setInterval` inside `useEffect`
  (same cleanup pattern as `/gis-map`'s existing playback timer) so its
  return value keeps drifting forward with the real clock — but Dashboard
  and `/gis-map` use it differently: Dashboard has no manual step control,
  so it binds `step` directly to the hook's live value; `/gis-map` has
  play/pause/scrub, so it only uses the hook's value to *seed*
  `useState`'s initial value once, and separately as a live `baselineStep`
  prop for the "Hiện tại" button — binding `/gis-map`'s actual `step`
  directly to the hook would silently yank the view out from under a user
  mid-scrub every minute.
- **Why it shows up here:** the same "live now" value has 2 legitimately
  different consumption patterns in this app, and conflating them (e.g.
  making `/gis-map`'s `step` itself live-bound) would break manual
  playback.

## 5. How it was approached
- Entered plan mode given the scope (a new shared utility + hook, touching
  3 files, retiring a convention referenced in many prior learn-logs) —
  wrote out the exact mapping formula and the Dashboard-vs-`/gis-map`
  consumption distinction *before* writing code, and got explicit approval,
  since silently changing what every page's "current" state means is the
  kind of decision worth confirming rather than assuming.
- Explicitly scoped out `rainForecast`/`tide` (the weather-forecast cards) —
  that data is a linear 72-hour snapshot generated from a fixed past date
  (`generatedAt: 2026-07-10`), not a repeating daily cycle like
  `simulation` — the same "map real time onto it" trick doesn't apply
  without a real live forecast API, so it stays on the old "no live now"
  convention, not silently extended to it.
- `GisTopBar.tsx`'s `baselineStep` moved from an internally-hardcoded
  constant (`0`, from the previous follow-up's stopgap fix) to a prop the
  parent computes — the exact "lift state to whoever can compute it live"
  move already used elsewhere in this app (e.g. `floodOpacity`).

## 6. Where it got stuck (if anywhere)
No real snags — verified the rounding/wrap math with a throwaway Node
script against both the real current time and 2 hand-picked edge cases
(14:35 → step 58, matching 14:30; 23:58 → step 96, correctly clamped at the
array's last index instead of wrapping to a nonexistent step 97).

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs
cd web && npm run build
```
Expected: all three clean, i18n key count unchanged (109 — no new
translatable strings). Manually: open `/` — the "Cập nhật lúc" time should
match the system clock's current hour:minute rounded to the nearest 15-min
step; open `/gis-map` — the top-bar clock should show the same, "Hiện tại"
should be the active/highlighted preset by default, and clicking it after
scrubbing elsewhere should jump back to whatever step matches the *current*
time (not whatever it was on page load).

## 8. Gotchas / things to remember
- This "now" repeats every 24 hours — running the app at the same
  hour:minute on two different real days shows the identical simulated
  state both times. That's an inherent property of the dataset (no
  calendar date), not a bug to chase.
- `/gis-map`'s `step` and `baselineStep` are 2 different values on
  purpose — don't merge them or the "Hiện tại" button loses meaning once a
  user has manually scrubbed elsewhere.
- `rainForecast`/`tide` still use the pre-existing "no live now" convention
  (index 0 = the series' own reference point) — this follow-up didn't
  touch them, on purpose.
