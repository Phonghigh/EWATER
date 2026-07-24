# Follow-up — Right info panel also floats over the map

**Date:** 2026-07-23 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Moved the last piece of `/gis-map` still taking up its own column —
`GisRightPanel`'s "Thông tin lớp đang chọn" + "Thống kê ngập hiện tại"
cards — into `GisMapCanvas`'s floating-overlay slot, mirroring the previous
follow-up's left "Lớp dữ liệu" panel, so the map now gets the full row
width unconditionally.

## 2. Where it fits
- Sixth round of user feedback on `/gis-map` this session, immediately
  following the map-first-layout follow-up — that round floated the left
  panel and dropped the minimap, but left the right panel as a `.gis-body`
  flex sibling still narrowing the map. The user pointed at exactly those 2
  remaining card titles and said to float them too.

## 3. The problem
`GisMap.tsx` still rendered `<GisRightPanel />` as a second child of
`.gis-body` (a flex row alongside `.gis-main-area`), so the map's available
width was always `100% - 240px` regardless of anything else changed in the
prior follow-up. `GisRightPanel`'s own CSS (`.gis-right-panel`,
`.gis-right-card`) was written for that flex-sibling context — a fixed flex
basis, solid opaque card backgrounds — not for floating over map imagery.

## 4. Concepts introduced
No new concept beyond what the immediately preceding follow-up already
established (`GisMapCanvas`'s `children` slot for floating caller UI,
`position: absolute` anchored to `.gis-canvas-wrapper`) — this task is that
same pattern applied a second time, to the opposite corner. Worth noting
explicitly because it validates the *design* from the last follow-up: once
one panel needed to float, the second one reusing the exact same mechanism
(rather than inventing a parallel one) confirms `children` was the right
generalization, not a one-off hack for the left panel specifically.

## 5. How it was approached
- Removed `.gis-main-area`'s wrapper `<div>` entirely from `GisMap.tsx` —
  with both side panels now floating, `.gis-body` has exactly one real
  child (`GisMapCanvas`), so the extra wrapper div was dead weight.
- Passed `<GisRightPanel />` as a second element inside `GisMapCanvas`'s
  children (alongside the existing `.gis-layer-overlay` div) rather than
  wrapping it in a new positioning `<div>` — `GisRightPanel`'s own
  top-level element already is `.gis-right-panel`, so `position: absolute`
  went directly on that class instead of adding an unnecessary wrapper.
- Anchored top-right, `top: 58px` (clearing the existing
  `.gis-canvas-corner` export/fullscreen buttons at `top: 12px`) rather
  than `top: 12px` directly, to avoid the 2 floating UI groups overlapping.
- Switched card backgrounds from solid `#fff` to the same translucent-blur
  treatment (`rgba(255,255,255,.97)` + `backdrop-filter: blur(4px)`) used
  by every other floating control on this map (tools, corner buttons,
  legend, the left layer panel) — consistency, and better legibility over
  moving map tiles than a fully opaque card would need to fight for.

## 6. Where it got stuck (if anywhere)
No real snags — this is a direct repeat of the previous follow-up's
mechanism on the other side of the map, not new territory.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs
cd web && npm run build
```
Expected: all three clean; i18n key count unchanged at 110 (no new strings,
pure layout/CSS change). Manually: `npm run dev`, open `/gis-map` — the
"Thông tin lớp đang chọn"/"Thống kê ngập hiện tại" cards should float in
the map's top-right corner, below the export/fullscreen buttons, and the
map canvas should visibly span the entire width of `.gis-body` regardless
of whether the left layer panel is open.

## 8. Gotchas / things to remember
- `.gis-right-panel`'s `max-height: calc(100% - 170px)` is a rough budget
  (58px top offset + ~112px reserved so it doesn't grow tall enough to
  collide with the bottom-left `.gis-layer-overlay` or bottom-right
  legend) — if a 3rd card is ever added here, re-check this doesn't get too
  tight on shorter map heights.
- Both floating panels (`.gis-layer-overlay`, `.gis-right-panel`) now
  depend on `.gis-canvas-wrapper` staying `position: relative` — if that
  wrapper's positioning is ever changed, both panels lose their anchor.
