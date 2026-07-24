# Follow-up (2026-07-24, round 2) — GIS node hover chart, focus-fit, opacity removal

**Date:** 2026-07-24 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Three GIS follow-ups: removed the flood-opacity slider, made Focus Mode stop
pushing the search bar off-screen, and replaced the manhole click popup (+ its
"Theo dõi trạm này" button) with a **hover** popup that shows the node's
water-level **detail chart**.

## 2. Where it fits
Continuation of the same-day GIS UX pass ([situation-banner report](FOLLOWUP-2026-07-24-gis-ux-situation-banner.md)).
After it, hovering any water-level node shows its 24h level trend inline; the
map fills the viewport without hiding the controls; the right panel is just the
flood stats.

## 3. The problem
- Focus Mode sized the map with `vh` units, but the map sits *below* a fixed
  52px global topbar and *above* the search/time control bar — so `90vh`
  overshot the visible area and the controls slid below the fold.
- MapLibre popups render **raw HTML, not React**, so a normal chart component
  can't go inside one. The "detail chart" had to be drawn as an inline SVG
  string.

## 4. Concepts introduced

### `calc()` layout instead of `vh` when there's fixed chrome
- **Plain definition:** `min-height: calc(100vh - 200px)` means "viewport
  height minus a fixed reserve," vs `vh` which is a raw fraction of the whole
  window.
- **Why here:** the map isn't the whole window — a 52px topbar sits above it and
  a ~70px control bar below it (plus page padding). Reserving ~200px keeps the
  control bar on-screen while the map still grows to fill the rest.

### Inline-SVG chart inside a raw-HTML map popup
- **Plain definition:** building an `<svg>…</svg>` string by hand (path `d`
  commands computed from the data) instead of rendering a chart component.
- **Why here:** MapLibre popup content is set via `setHTML()` — no React lives
  in there. `nodeLevelChartSVG()` maps the node's per-step fill series to
  level(m), scales it into a viewBox, and emits a `<path>` line + area, a red
  dashed surcharge line, and a dot at the current step.

### Non-interactive hover popup (`pointer-events: none`)
- **Plain definition:** a popup the mouse passes straight through.
- **Why here:** a hover popup anchored near the node can sit under the cursor;
  if it captured pointer events it would fire the node's `mouseleave` and
  flicker open/closed. `pointer-events: none` (class `gis-hover-popup`) plus one
  reusable `Popup` instance (added on `mouseenter`, removed on `mouseleave`)
  keeps it stable.

## 5. How it was approached
- **Hover, not click:** manhole details moved from a `click` handler to
  `mouseenter`/`mouseleave`; pump/gate stay click-based (no series to chart).
  The reused trend/severity helpers stayed; only the popup HTML changed (chart
  in, focus button out).
- **Removed, not hidden:** the `onFocusStation` prop chain, its ref, and the
  focus button were deleted (the button was its only trigger); the opacity
  slider + its state (`floodOpacity` is now a fixed constant) went too.
- **Pruned i18n:** dropped `gis.popup.focusStation`, `gis.right.panelTitle`,
  `gis.right.opacity` (both languages); added `gis.popup.levelChart`.

## 6. Where it got stuck (if anywhere)
No real snags. The one thing to get right up front: anchoring the hover popup to
the node's own coordinates (not the cursor) + `pointer-events: none` to avoid
flicker.

## 7. How to verify it yourself
```bash
node scripts/check-i18n.mjs
cd web && npx tsc --noEmit -p . && npx vite build
```
Expected: `161 keys, vi/en in sync`, no `tsc` output, `✓ built`. In the app
(GIS tab): the right panel shows only "Thống kê ngập hiện tại"; entering Focus
Mode keeps the search/time bar visible; hovering a node pops a card with a small
water-level chart (red dashed surcharge line + current-step dot) and no "Theo
dõi trạm này" button.

## 8. Gotchas / things to remember
- Hover popups must be `pointer-events: none` + anchored to the feature, or they
  flicker.
- Raw-HTML popups can't host React — draw charts as SVG strings (`?raw` icons
  and hand-built `<path>` are the toolkit here).
- `vh` ignores fixed chrome; use `calc(100vh - <reserve>)` when the element
  isn't the whole viewport.
- The flood heatmap opacity is now a fixed constant (`DEFAULT_FLOOD_OPACITY`);
  if a user control is ever wanted again, re-lift it to state.
