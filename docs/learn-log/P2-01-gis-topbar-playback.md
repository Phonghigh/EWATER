# P2-01 — GIS map top bar: search + playback

**Date:** 2026-07-23 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Built the `/gis-map` page shell and its top toolbar: a search box (UI only
so far) and a working time/playback control (quick-hour jumps, prev/next
step, play/pause, speed) driving a step counter local to this page.

## 2. Where it fits
- Opens Phase 2 (Bản đồ GIS, Tab 2) in [tasks/INDEX.md](../../tasks/INDEX.md).
- Before this task, `/gis-map` was just `ComingSoon`. After it, staff/admin
  users land on a real page with a functioning time control, even though the
  map/layers/panels underneath are still an `EmptyState` placeholder until
  P2-02..P2-05 land.

## 3. The problem
The old design (deleted in P0-16) had a global `state/store.ts` holding
`currentStep` that any component could read/write. That's gone, and the
current policy (recorded in P0-16's PROGRESS entry) is "don't rebuild things
ahead of need." So this task had to decide: does GIS-map step state belong
in a new global store, or does it live locally in the page that needs it
first? Chose local `useState` in `GisMap.tsx` — nothing else references step
state yet (Dashboard has its own, separate, `steps - 1` placeholder), so a
shared store would be speculative infrastructure for a consumer that doesn't
exist yet.

## 4. Concepts introduced

### Interval-driven playback with `setInterval` inside `useEffect`
- **Plain definition:** `useEffect` starts a repeating timer when `playing`
  becomes true, and the effect's cleanup function (`clearInterval`) stops it
  when `playing` flips back to false, `speed` changes, or the component
  unmounts — React re-runs the effect (and its cleanup) whenever a dependency
  changes.
- **Why it shows up here:** "Play" needs to auto-advance `step` every tick
  without a stray timer surviving after pause/unmount, which would silently
  keep bumping state on a page nobody's looking at (or worse, after a route
  change).

### Deriving step deltas from a fixed grid, not fixed step counts
- **Plain definition:** the `+3h` button doesn't mean "+3 steps" — it means
  "+3 hours," converted to steps via `60 / simulation.stepMinutes` (here,
  `stepMinutes = 15` → 4 steps/hour → `+3h` = +12 steps).
- **Why it shows up here:** the mockup's hour-jump buttons are a UX label,
  not a data-model concept; the data model only knows steps. Hardcoding
  "+3h = +12 steps" would silently break if `stepMinutes` ever changes.

## 5. How it was approached
- Reused `Dashboard.tsx`'s `stepTimeLabel` function instead of writing a
  second copy — pulled it out into `web/src/lib/simTime.ts` since two pages
  now need the exact same "step → clock time" math. Small, in-scope
  refactor (not a new abstraction for a hypothetical future need — two real
  call sites already exist).
- Rejected building the search box's actual filtering logic in this task:
  there's nothing to search yet (no layer panel, no map markers) until
  P2-02/P2-03 land — an input that pretends to search and finds nothing
  would be worse than an honestly-inert one.
- New icons (`search`, `play_arrow`, `pause`, `skip_next`, `skip_previous`)
  added to `Icon.tsx` the same way P1-03's icon additions did: verified each
  glyph file actually exists under `@material-symbols/svg-400/outlined/`
  before importing it, rather than guessing Google's naming.

## 6. Where it got stuck (if anywhere)
No real snags — this task follows patterns already established in Phase 0/1
(`PageHeader`, `EmptyState`, per-glyph icon imports, `t()`/`useT()`).

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs
cd web && npm run build
```
Expected: all three clean. Manually: `npm run dev`, sign in as `authority`/
`admin`, open `/gis-map` — top bar shows a search box + hour-jump buttons +
a play button that advances the clock every second and stops at the last
step instead of looping.

## 8. Gotchas / things to remember
- `step` here is **not** shared with `Dashboard.tsx`'s `step` — they're two
  independent local states that happen to both default to `steps - 1`. If a
  later phase needs them synced, that's a deliberate decision to make then,
  not something already wired.
- The search input is real HTML (not `disabled`), it just doesn't filter
  anything yet — don't mistake "no results ever" for a bug when testing it
  before P2-02/P2-03 land.
