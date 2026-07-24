# Follow-up — Live minimap viewport, legend thresholds, pump/gate icons

**Date:** 2026-07-23 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Made the GIS map's minimap viewport rectangle actually track the main
map's pan/zoom instead of a frozen `config.bounds` box, added real
`simThresholds` percentages to the flood-severity legend, and gave pump/
gate outlet markers (+ the layer panel's checkboxes) real icons instead of
plain colored dots.

## 2. Where it fits
- Third round of user feedback on `/gis-map` after the blank-map fix,
  marker-interactivity fix, flood heatmap, and live-now-time follow-ups —
  all in the same session, on the same page.
- Directly retires a documented simplification from P2-04's original
  report ("does *not* live-sync to the main map's current pan/zoom... out
  of scope for this task").

## 3. The problem
Three independent, unrelated gaps in the same review pass:
1. **Minimap**: `GisRightPanel.tsx`'s `MiniMap` built its viewport
   rectangle once, from the static `config.bounds`, inside the `load`
   handler — nothing ever called `setData()` again, so the orange box
   never moved no matter what the main map did.
2. **Legend**: "Bình thường/Cảnh báo/Ngập nặng" had color swatches and
   labels but no numbers — a reader had no way to know what % fill each
   category actually meant.
3. **Icons**: pump and gate outlets were visually identical to each other
   and to manhole markers except for a subtle color difference (teal vs.
   green vs. traffic-light colors) — no icon distinguishing "this is a
   pump" from "this is a gate" from "this is a monitoring node."

## 4. Concepts introduced

### Cross-sibling live data needs a lift-state-up, not a shared map instance
- **Plain definition:** `GisMapCanvas` (the main map) and `GisRightPanel`
  (containing the minimap) are sibling components under `GisMap.tsx`, each
  owning its own independent MapLibre `Map` instance — there's no way for
  one to directly call methods on the other. The fix is the standard React
  pattern: the main map reports its bounds *up* to the shared parent via a
  callback prop (`onBoundsChange`), the parent holds it in state
  (`viewBounds`), and passes it back *down* to the minimap as a prop.
- **Why it shows up here:** it would be tempting to reach for a ref hack or
  a shared singleton map instance — lifting state up is simpler, matches
  how `floodOpacity` already flows between these same 2 siblings, and
  keeps each MapLibre instance fully independent (own lifecycle, own
  cleanup).

### Rasterizing a DOM icon for a WebGL map layer
- **Plain definition:** the app's existing `Icon` component colors SVGs via
  CSS (`fill: currentColor`, inherited from the DOM) — that trick doesn't
  exist once an SVG is rasterized into a static image for MapLibre's
  `icon-image`. The raw Material Symbols SVGs also have no `fill`
  attribute of their own (default black per the SVG spec). Getting a white
  icon onto the map means string-injecting `fill="#ffffff"` into the SVG
  *before* rasterizing it via a data-URI `Image()`, then `map.addImage()`.
- **Why it shows up here:** this is the first time this app puts one of its
  existing DOM icon assets onto the map canvas itself (previous map
  markers — warning triangle — used the DOM-based `maplibregl.Marker`
  path instead, where CSS `fill` still works). Native `symbol` layers
  don't have that luxury.

### A legend's numbers must come from the same source as what they describe
- **Plain definition:** the new `< 70% / 70–100% / ≥100%` legend labels
  read directly from `data.config.simThresholds.{warn,surcharge}` — the
  exact same object `fillState()` already uses to decide each marker's
  color — instead of a second hardcoded `70`/`100` typed into the JSX.
- **Why it shows up here:** a legend with its own copy of the thresholds
  would silently go stale the moment someone tuned `simThresholds` in
  Supabase config without remembering to also edit this JSX.

## 5. How it was approached
- Entered plan mode given the 3-part scope and 2 genuine open questions
  (how far to take "icon for Mực nước" given it's 834 points, whether
  "icon cho Trạm mưa" means a map marker or something else given rain
  stations have no real position data) — asked both before writing any
  code, since guessing wrong on either would mean redoing real work
  (834-point icon rendering is a real performance question, not a style
  preference).
- Kept the pump/gate color-coded circles (didn't replace them) and added
  the white icon as a second `symbol` layer on the *same* `outlets` source
  with the *same* filter — 2 layers, same coordinates, rather than trying
  to bake color + icon into one compositied image per feature.
- Deliberately left `manholes-circle` (834 points) and `FloodMapPreview.tsx`
  (Dashboard's small preview) untouched — both were explicitly scoped out
  by the user's answers, not overlooked.

## 6. Where it got stuck (if anywhere)
No real snags — the icon-rasterization technique was new to this codebase
but a well-known MapLibre pattern (data-URI `Image()` → `addImage()`), and
the minimap bounds-lifting followed an already-established sibling-prop
pattern (`floodOpacity`) rather than inventing a new one.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs
cd web && npm run build
```
Expected: all three clean, i18n key count unchanged at 109 (legend
percentages are computed numbers in JSX, not new translatable strings).
Manually: `npm run dev`, open `/gis-map` — pan/zoom the main map and watch
the minimap's orange rectangle follow; check the legend shows real `%`
ranges; zoom into a pump/gate marker and confirm a white pump/gate glyph
sits on top of the colored circle; check the left layer panel shows a
small icon next to each of the 4 realtime checkboxes.

## 8. Gotchas / things to remember
- `viewBounds` starts `null` and only becomes real after the main map's
  first `moveend` (which the init effect also fires once immediately on
  `load`, so it populates almost immediately on page load, not only after
  a user manually pans) — the minimap falls back to `config.bounds` in the
  brief window before that.
- The pump/gate icon images are cached on the map instance via
  `map.hasImage()` — safe to call `loadIconImage()` more than once, it
  won't re-add or flicker.
- `manholes-circle` and `FloodMapPreview.tsx` deliberately still use plain
  colored circles — not an oversight, a scoped decision (see §5).
