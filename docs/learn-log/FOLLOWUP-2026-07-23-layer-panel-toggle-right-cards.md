# Follow-up — Collapsible left layer panel, smaller checkboxes, right panel split into cards

**Date:** 2026-07-23 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Made the left "Lớp dữ liệu" panel collapsible (hidden by default, toggled by
a new slim rail button) to give the map more screen space, shrank its
checkbox/row sizing, and split the right panel's one tall card into 3
independent auto-height cards to remove the empty space that showed up
below the minimap.

## 2. Where it fits
- Fourth round of user feedback on `/gis-map` in this session, following the
  minimap/legend/icons follow-up.
- Directly from a screenshot the user sent of the right panel showing dead
  space below the minimap, plus a complaint that the left panel's checkbox
  rows were too large for how little map area was left.

## 3. The problem
Two unrelated layout issues from the same review pass:
1. **Right panel dead space**: `GisRightPanel.tsx` rendered all 3 sections
   (selected-layer, stats, minimap) inside one `.gis-right-panel` card. That
   card was a flex item in `.gis-body`, a row container with the default
   `align-items: stretch` — so the card's height matched
   `.gis-main-area`'s (560px, from the map canvas's `min-height`), even
   though its actual content was much shorter. The leftover height showed as
   blank white space at the bottom of the card.
2. **Left panel taking too much width/height** with no way to reclaim that
   space for the map, and checkboxes sized for a first-pass layout rather
   than a dense settings list.

## 4. Concepts introduced

### A flex row's default `align-items: stretch` forces siblings to match the tallest one's height
- **Plain definition:** in a `display: flex` row, every child defaults to
  stretching to the row's height (set by whichever child is tallest,
  directly or via its own children), even if that child's own content is
  much shorter.
- **Why it shows up here:** `.gis-main-area`'s map canvas has a real
  `min-height: 560px`; `.gis-right-panel`'s 3 short sections had no way to
  opt out of matching that height once they were one shared flex item. The
  fix is `align-items: flex-start` on `.gis-body` plus splitting the single
  card into `.gis-right-card` (one per section) — each card now sizes to
  its own content instead of inheriting a height driven by an unrelated
  sibling.

### A hide-by-default panel needs a toggle that's visible regardless of the panel's own state
- **Plain definition:** the control that shows a hidden panel can't live
  *inside* that panel — it has to sit outside it, in a spot that's always
  rendered.
- **Why it shows up here:** `showLayerPanel` in `GisMap.tsx` now defaults to
  `false` and the toggle button is a sibling of `GisLayerPanel` in
  `.gis-body` (a slim always-visible rail with a `layers`/`chevron-left`
  icon), not something rendered by `GisLayerPanel` itself — otherwise
  there'd be no way to bring the panel back once it's hidden.

## 5. How it was approached
- Kept `GisLayerPanel`'s own internal structure/state untouched — this is
  purely a visibility + sizing change at the call site (`GisMap.tsx`) and in
  CSS, not a rewrite of the panel's checkbox logic.
- For the right panel, reused the existing 3 sections' JSX almost verbatim,
  just renaming the wrapping `.gis-right-section` → `.gis-right-card` (now
  the bordered box) and turning `.gis-right-panel` into a plain flex column
  with no border/background of its own.
- Chose `layers`/`chevron-left`/`chevron-right` from the already-installed
  `@material-symbols/svg-400` package (same per-glyph-import pattern as
  every other icon in `Icon.tsx`) rather than reusing an unrelated existing
  glyph, since none of the existing icons read as "toggle a panel."

## 6. Where it got stuck (if anywhere)
No real snags — both changes follow patterns already established elsewhere
in this file (`Icon.tsx`'s per-glyph import list, conditional rendering
gated on local state).

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs
cd web && npm run build
```
Expected: all three clean; i18n key count 111 (up from 109 — 2 new keys for
the toggle button's title, `gis.layer.showPanel`/`gis.layer.hidePanel`).
Manually: `npm run dev`, open `/gis-map` — the left layer panel should be
hidden on first load with a slim rail button visible; clicking it opens/
closes the panel; open it and confirm the checkboxes/icons read as more
compact than before; check the right panel's 3 sections now render as
separate bordered cards with no dead space below the minimap card.

## 8. Gotchas / things to remember
- `showLayerPanel` is local `useState` in `GisMap.tsx`, not persisted —
  every fresh page load starts hidden again, which is the intended
  behavior (not a bug to "fix" with localStorage later unless asked).
- `.gis-right-panel` no longer has its own border/background — if a new
  right-panel section is added later, wrap it in `.gis-right-card`, not
  directly inside `.gis-right-panel`, or it'll render without a box.
