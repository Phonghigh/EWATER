# Follow-up (2026-07-24) — GIS search autocomplete, floating analytics toggle, basemap cleanup, docked layer panel

**Date:** 2026-07-24 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
> Four user-flagged UX fixes on `/gis-map`: replace the ugly native `<datalist>`
> search with a real filtered autocomplete that flies the map to the picked
> station, float the "Thu gọn phân tích" toggle over the map instead of giving
> it its own row, drop the two non-functional "(sắp có)" basemaps, and re-dock
> the left layer panel as a map-pushing sibling (it was a translucent overlay
> that covered the map and scrolled despite having few options).

## 2. Where it fits
Refines Phase 2's GIS map (supersedes P2-20's `<datalist>` groundwork and P2-18's
bottom-row toggle). After this: typing a muid shows a styled, keyboard-navigable
list of typed results; picking one moves the map there. The map keeps the vertical
space the collapse toggle used to occupy, and the basemap group only offers the two
basemaps that actually render.

## 3. The problem
A native `<datalist>` can't be styled and its down-arrow dumps all ~880 bare muids
at once — useless and ugly. The collapse toggle sat in its own centered row below
the map, permanently eating height even when collapsed. And two basemaps were shown
as selectable radios but had no tile source (labeled "(sắp có)"), with the *default*
even pointing at one of them.

## 4. Concepts introduced

### Custom autocomplete vs. native `<datalist>`
- **Plain definition:** instead of the browser's built-in suggestion dropdown, we
  render our own list of `<button>`s under the input and manage open/filter/highlight
  state ourselves.
- **Why it shows up here:** only a custom list can be styled, capped to 8 rows, show
  a *type label* per row, and be driven by keyboard (↑/↓/Enter/Esc) with proper
  `role="combobox"`/`listbox`/`option` ARIA — none of which `<datalist>` allows.

### `pointerdown` vs `click` for dropdown options
- **Plain definition:** `pointerdown` fires *before* the input loses focus; `click`
  fires after.
- **Why it shows up here:** the outside-pointer-down handler that closes the list
  would tear the option out of the DOM before a `click` could land, so options commit
  on `onPointerDown` (with `preventDefault` to keep focus) instead.

### Prop-driven map command (no imperative ref)
- **Plain definition:** to make the map fly somewhere, we set a `flyTarget` state in
  the page and pass it down; an effect keyed on that prop calls `map.flyTo`.
- **Why it shows up here:** it matches every other map mutation in `GisMapCanvas`
  (each is a `useEffect` guarded by `isStyleLoaded()`/`once("load")`), so we avoid
  introducing `forwardRef`/`useImperativeHandle` just for this one action.

### Docked panel (flex sibling) vs. floating overlay
- **Plain definition:** a docked panel is a real layout element beside the map that
  takes its own width; a floating overlay sits *on top* of the map, covering it.
- **Why it shows up here:** the layer panel had been a translucent overlay anchored
  bottom-left (2026-07-23), but the user found it covered the map and scrolled even
  with few options. Re-docking it as the first flex child of `.gis-body` means
  opening it *narrows the map* (which MapLibre's existing `ResizeObserver` handles)
  instead of hiding part of it — and a full-height solid sidebar comfortably fits all
  ~9 rows without scrolling. A docked panel needs an in-panel close control (its
  header's ✕), since the floating open-button only exists while it's closed.

## 5. How it was approached
- **Search:** new `GisSearchBox.tsx` (owns query/open/activeIndex + filtering);
  `GisMap.tsx` builds the `StationHit[]` index from the same `data.manholes`/
  `data.outlets` features the map already draws (coords straight off each Point
  geometry), typing outlets via the existing [`classifyOutlet`](../../web/src/data/dashboardService.ts).
  Selection lifts to `flyTarget` state → new effect in `GisMapCanvas.tsx`.
- **Toggle:** moved the button into `GisMapCanvas`'s `children` (same overlay
  mechanism the layer/right panels already use) as an absolutely-positioned pill;
  deleted `.gis-bottom-toggle-row`. Reused the existing `gis.bottomPanel.*` strings.
- **Basemap:** trimmed `BASEMAPS` to `["osm","satellite"]`, `BasemapKey` to those two,
  default `"light"→"osm"` (visually identical — `"light"` already resolved to osm),
  and removed the now-unused `gis.basemap.light`/`googleSatellite`/`comingSoonInline`
  i18n keys + swatch CSS. Added `chevron-up`/`chevron-down` to the icon set
  (`keyboard_arrow_up/down` glyphs) for the floating toggle.
- **Layer panel:** moved `<GisLayerPanel>` out of `GisMapCanvas`'s `children` back to a
  direct flex child of `.gis-body` (reversing the 2026-07-23 3rd-round float), gave it a
  header (title + close ✕) and an `onClose` prop, and restyled it from a translucent
  floating card to a solid full-height docked sidebar. The old floating open/close combo
  became a single labeled `.gis-layer-open-btn` pill shown only while closed. New key
  `gis.layer.panelTitle`.

## 6. Where it got stuck
- **Symptom:** dev server threw `Failed to resolve import ".../expand_less.svg?raw"`.
  **Cause:** that glyph name doesn't exist in `@material-symbols/svg-400`; `tsc`
  didn't catch it because `?raw` imports are typed loosely. **Fix:** used the real
  `keyboard_arrow_up`/`keyboard_arrow_down` files (verified by listing the package
  dir before importing).
- **Note:** live in-browser QA couldn't complete in the sandboxed preview browser —
  `loadAppData` fetches GeoJSON from the external backend, which that browser can't
  reach, so the app stays on its data loader. Verified via `tsc`, `check-i18n`, and
  module-serves-200 instead; visual QA to be done in a browser that reaches the backend.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit && node ../scripts/check-i18n.mjs
```
Expected: tsc exits 0; i18n prints "vi/en in sync". In a backend-connected browser:
type `246` in search → ≤8 styled rows, ↑/↓/Enter works, pick flies the map + popup;
collapse pill floats over the map's bottom edge (no separate row); basemap group shows
only OpenStreetMap + Ảnh vệ tinh.

## 8. Gotchas / things to remember
- `?raw` SVG imports are **not** type-checked for existence — a wrong glyph name only
  fails at Vite resolve time, so confirm the file exists in the package dir first.
- Dropdown options must commit on `pointerdown`, not `click`, when an outside-pointer
  handler closes the list.
- The floating toggle and the measure badge both want the map's bottom-center; the
  badge was nudged to `bottom: 56px` so they don't overlap while measuring.
