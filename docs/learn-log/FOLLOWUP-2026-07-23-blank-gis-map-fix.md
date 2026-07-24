# Follow-up — Fix: `/gis-map`'s main canvas rendered completely blank

**Date:** 2026-07-23 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
`GisMapCanvas.tsx` (P2-03) constructed its MapLibre map without a `style`
option, so the map's `load` event never fired and nothing — not the
basemap, not flood zones, not manholes — was ever added; fixed by giving it
a minimal empty style up front, plus a `ResizeObserver` safety net added to
all 3 MapLibre components in the app.

## 2. Where it fits
- User-reported bug on `/gis-map` (P2-03/P2-04, shipped earlier today) —
  first real visual confirmation of any MapLibre component in this
  redesign, via a screenshot the user took themselves.
- Every prior map task's PROGRESS entry (P1-03, P2-03, P2-04) flagged
  "no headless browser in this environment — visual confirmation still
  owed to a manual check by the user" as a known gap. This is that gap
  closing, and it found a real bug the whole time.

## 3. The problem
The user reported the `/gis-map` canvas as a completely blank area (toolbar
and legend, which float independently via CSS `position: absolute`, still
rendered fine). Two hypotheses were tested in order:

1. **CSS layout collapse** (flex container 0-height at some point). Traced
   the whole flex chain (`.gis-body` → `.gis-main-area` → `.gis-canvas-wrapper`)
   and it looked structurally sound (`.gis-body` has an explicit
   `min-height: 560px`). Added a defensive `ResizeObserver` anyway, since
   "MapLibre only measures its container once at construction" is a real,
   separate risk in any flex/React layout regardless of whether it was
   *this* bug.
2. Testing that fix surfaced the real error in the browser console:
   `"There is no style added to the map."` — thrown by MapLibre when a
   method touches `map.style` before one was ever provided, not just
   "before the async style finished loading."

Comparing `GisMapCanvas.tsx` against the app's other 2 MapLibre call sites
(`FloodMapPreview.tsx`, `GisRightPanel.tsx`'s `MiniMap`) found the actual
gap: both of those pass a `style: {...}` object directly into the `Map`
constructor; `GisMapCanvas.tsx` didn't pass `style` at all, planning to add
everything via `addSource`/`addLayer` inside a `load` handler — except with
no style, MapLibre has nothing to load, so `load` never fires, so that
handler (which is where every single layer got added) never ran. The map
was never broken by layout — it simply had nothing to paint from the very
first frame.

## 4. Concepts introduced

### A map needs a style before it can have a `load` event
- **Plain definition:** MapLibre's `Map` constructor's `style` option isn't
  just "the visual theme" — it's the thing that makes the map have
  *any* style object at all. Without it, there's no async style-loading
  process to complete, so the `load` event this app relies on to safely
  add sources/layers (`map.on("load", () => { ...add stuff... })`) never
  fires.
- **Why it shows up here:** the other 2 map components in this app "get
  away with" always passing a real basemap raster as their initial style,
  which happens to also satisfy this requirement — so the pattern looked
  consistent everywhere except the one place someone (this session) built
  the style incrementally instead.

### A `ResizeObserver` as insurance against MapLibre's one-time size measurement
- **Plain definition:** MapLibre reads its container's pixel size once when
  the map is constructed; if a parent flex layout hasn't settled yet at
  that exact instant, the WebGL canvas can be born at 0×0 and never
  self-correct even after the container visually resizes. A
  `ResizeObserver` on the container calls `map.resize()` on every
  subsequent size change, closing that race regardless of layout timing.
- **Why it shows up here:** wasn't the actual bug this time (root cause was
  the missing style), but it's a real, independent risk present in all 3
  components' flex-nested containers — worth keeping as a fix even though
  it didn't turn out to be *the* fix.

## 5. How it was approached
- Investigated methodically rather than guessing blindly: asked the user 2
  rounds of targeted clarifying questions (which page, what exactly is
  shown) before touching any code, since this environment has no headless
  browser to reproduce the bug directly.
- Applied the (plausible, defensible, but ultimately not sufficient on its
  own) `ResizeObserver` fix first — it's correct to keep regardless, and
  testing it is what surfaced the real error message in the console, which
  the user then shared.
- Once the real error was visible, compared all 3 MapLibre call sites side
  by side rather than trying to reason about `GisMapCanvas.tsx` in
  isolation — the fix fell out immediately from noticing what the working
  ones did differently.

## 6. Where it got stuck (if anywhere)
The first fix attempt (`ResizeObserver` alone) was necessary but not
sufficient — it didn't cause any regression, but it also didn't fix the
reported symptom, since the real issue was upstream of anything size- or
layout-related. Worth remembering: a plausible-sounding first hypothesis
that doesn't fully match the reported symptom (toolbar/legend rendering
fine, only the canvas itself blank, with no error initially reported)
should stay a hypothesis, tested and falsifiable, not treated as done.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs
cd web && npm run build
```
Expected: all three clean. Manually confirmed by the user via a live
`npm run dev` session: basemap tiles, flood-zone fill, rivers, and manhole
markers all now render on `/gis-map`'s main canvas, with the toolbar/corner
buttons/legend still positioned correctly over it.

## 8. Gotchas / things to remember
- Any *new* MapLibre `Map(...)` construction in this codebase must always
  pass a real `style` (even a minimal `{ version: 8, sources: {}, layers:
  [] }` is enough) — never rely on adding sources/layers purely inside a
  `load` handler without first giving the map something to load.
- The `ResizeObserver` pattern added to all 3 map components
  (`GisMapCanvas.tsx`, `FloodMapPreview.tsx`, `GisRightPanel.tsx`'s
  `MiniMap`) is now the standard for any future map component in this
  app — copy it rather than re-deriving it.
