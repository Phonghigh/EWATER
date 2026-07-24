# Follow-up — Map-first `/gis-map` layout: no page title, shorter search, floating layer panel, minimap removed

**Date:** 2026-07-23 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Made `/gis-map` prioritize map real-estate over everything else: dropped
the redundant page-title header, shrank the search bar, turned the "Lớp dữ
liệu" panel from a layout-affecting sidebar into a floating overlay on the
map itself, and removed the minimap outright (a plan-mode alternative was
offered — sync the minimap's own view to the main map instead of the fixed
viewport rectangle — but the user chose deletion over building it).

## 2. Where it fits
- Fifth round of user feedback on `/gis-map` in this session, directly
  following the layer-panel-collapse/right-panel-cards follow-up — the
  panel collapse wasn't enough; the user wanted the map to dominate the
  screen at all times, not just when the panel happens to be closed.

## 3. The problem
Four related complaints in one message, all pointing the same direction
("ưu tiên show map nhiều nhất, lớn nhất có thể" — prioritize showing the
map as much/large as possible):
1. `PageHeader`'s "Bản đồ GIS" title duplicated the sidebar's already-active
   "Bản đồ GIS" nav item — pure vertical space cost, no new information.
2. The topbar's search input had `flex: 1 1 240px` (`flex-grow: 1`), so it
   stretched to fill whatever row space was left — wider than it needed to
   be for typing a short search term.
3. Even collapsed-by-default, opening the previous follow-up's layer panel
   still shrank the map's width (it was a flex sibling in `.gis-body`) —
   the user wanted it to never affect map size, open or closed.
4. The minimap's viewport-rectangle-over-a-static-background design (fixed
   in the previous follow-up so the rectangle actually tracks pan/zoom) was
   still the wrong mental model for what the user wanted: a "radar" view
   where the background moves and a fixed center frame stays put. Rather
   than build that alternate design, the user asked to just remove the
   minimap.

## 4. Concepts introduced

### A component can host a caller's floating UI via `children`, without knowing what it is
- **Plain definition:** `GisMapCanvas` now accepts an optional `children`
  prop, rendered as a plain sibling of the map `<div>` inside
  `.gis-canvas-wrapper` (which is already `position: relative`, the
  positioning context every other floating control — tools, corner
  buttons, legend — already anchors to). The caller (`GisMap.tsx`) decides
  what to render there and how to position it via CSS; `GisMapCanvas`
  itself doesn't know or care that it's a layer-panel toggle.
- **Why it shows up here:** the layer panel's state (`layerState`,
  `showLayerPanel`) already lived in `GisMap.tsx`, one level above
  `GisMapCanvas` — reaching *into* `GisMapCanvas`'s own JSX to add the
  panel there would have meant either lifting that state again or drilling
  more props through a component that has no other reason to know about
  it. `children` keeps the ownership boundary exactly where it already was.

### Removing a feature can be the right answer to "the current design doesn't match what I pictured"
- **Plain definition:** when a `plan mode` design doesn't match the user's
  mental model, the two paths are "redesign it" or "cut it" — both are
  legitimate outcomes, not just the former.
- **Why it shows up here:** offered to rebuild the minimap around a
  moving-background/fixed-frame design (matching what the user described),
  but the user's answer to the clarifying question was to drop the minimap
  entirely instead — simpler, and the floating layer-panel overlay made the
  right panel's remaining space feel less essential to fill with a 3rd
  feature anyway.

## 5. How it was approached
- Asked one clarifying question before touching layout code: whether the
  layer panel should move below the map (still part of the flex flow, just
  a different row) or become a floating overlay (out of the flex flow
  entirely, map always full-width). The user picked the overlay **and**
  volunteered to drop the minimap in the same answer — both acted on
  together rather than a second round-trip.
- Positioned the new `.gis-layer-overlay` bottom-left of the canvas
  (top-left is already `.gis-canvas-tools`, top-right is
  `.gis-canvas-corner`) so it doesn't collide with existing floating
  controls; the panel grows upward from its toggle button when opened
  (`flex-direction: column`, panel JSX before the button).
- Removed `onBoundsChange`/`viewBounds` end-to-end (`GisMapCanvas.tsx` →
  `GisMap.tsx` → `GisRightPanel.tsx`) rather than leaving dead plumbing
  behind "in case the minimap comes back" — matches this project's
  established "delete unused code" policy from P0-16.

## 6. Where it got stuck (if anywhere)
No real snags. The `children`-prop pattern is standard React; the only
judgment call was where to anchor the floating overlay to avoid colliding
with `GisMapCanvas`'s other floating controls, resolved by picking the one
corner (bottom-left) nothing else already occupies.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs
cd web && npm run build
```
Expected: all three clean; i18n key count 110 (109 → +2 toggle-button keys
from the prior follow-up, −1 now-dead `gis.right.minimap` key removed here).
Manually: `npm run dev`, open `/gis-map` — no "Bản đồ GIS" title above the
top toolbar; the search box reads noticeably narrower/more balanced; the
"Lớp dữ liệu" panel toggle floats at the map's bottom-left and opening it
never changes the map's width; the right panel now shows only 2 cards
(selected-layer, stats) with no minimap section.

## 8. Gotchas / things to remember
- `GisMapCanvas`'s `children` are rendered *inside* `.gis-canvas-wrapper`,
  which is `position: relative` and fills the available height — any new
  floating child needs its own `position: absolute` + explicit corner, or
  it'll render inline and push the canvas down instead of floating over it.
- `.gis-layer-panel` is no longer a `.gis-body` flex item — its width is
  now a fixed `210px` set directly on the class (previously a `flex: 0 0
  210px` basis), and it has its own `max-height: 360px` + `overflow-y:
  auto` since nothing constrains its height for it anymore.
