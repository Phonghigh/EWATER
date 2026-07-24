# P2-08..P2-20 — GIS map UX redesign for older operations staff

**Date:** 2026-07-23 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence

Reworked the GIS map tab's UI (not its data/logic) against 18 concrete
usability points aimed at 50-60yo government staff — bigger touch targets,
plain-language time controls, richer popups, a collapsible bottom panel, and
a new "Focus Mode" that hides everything but the map.

## 2. Where it fits

- Closes out Phase 2 (`tasks/INDEX.md` P2-08..P2-20), a second pass on top
  of the already-complete P2-01..P2-07 build.
- After this, `/gis-map` reads as a tool for someone who isn't a GIS
  professional: every control names what it does in words, not just an icon
  or a `+Nh` shorthand.

## 3. The problem

Every earlier GIS task (P2-01..P2-07, plus the 2026-07-23 follow-ups) built
*correct* features — but correct isn't the same as *legible* to a 50-60yo
non-technical user. The user's own review named the gap precisely: "+5h là
gì?", "15:45 là dữ liệu hiện tại hay mô phỏng?" This batch is UI-only
(no new data, no new map layers) — the challenge was fitting 13 changes into
existing components without breaking the conventions those components
already established (floating-card visual language, `gis.*` i18n namespace,
the `children`-overlay mechanism, ref-guarded mount-once effects).

## 4. Concepts introduced

### Raw HTML popups can't use the app's React `Icon` component

- **Plain definition:** MapLibre `Popup.setHTML()` takes a literal HTML
  string rendered outside React's tree — no JSX, no component props.
- **Why it shows up here:** the enriched popup (P2-15) needed a trend arrow
  icon. The fix reuses the same trick `GisMapCanvas.tsx` already used for
  map markers (`warningIconRaw`, `pumpIconRaw`): import the SVG with Vite's
  `?raw` suffix and splice the raw markup directly into the template string,
  instead of trying to render `<Icon name="trend-up"/>` (which would just
  print as literal, non-functional JSX-looking text).

### The mount-once-effect ref guard, applied a 3rd time

- **Plain definition:** an event handler registered inside a `useEffect`
  with `[]` deps captures whatever values were in scope *at mount* — a
  "stale closure." The fix already used in this file (`tRef`, `modeRef`) is
  a `useRef` kept in sync every render, dereferenced (`.current`) instead of
  the captured variable, inside the handler.
- **Why it shows up here:** the popup's "Theo dõi trạm này" button and the
  trend calculation both need the *current* `step`/`onFocusStation`/`data`,
  but the click handlers were registered once in the mount-only `map.on("load", ...)`
  effect. Added `stepRef`, `dataRef`, `onFocusStationRef` following the
  exact same pattern already established — confirms it's a reusable house
  style, not a one-off fix.

### Conditional non-rendering vs. CSS-hiding for "Focus Mode"

- **Plain definition:** two ways to hide UI — `display:none`/similar CSS
  (element stays mounted, state preserved) vs. `{condition && <X/>}` (element
  unmounts entirely, state is destroyed unless lifted elsewhere).
- **Why it shows up here:** Focus Mode (P2-19) needed the layer panel/right
  panel/bottom row to disappear, but *not* lose their own state (e.g. which
  checkboxes were on, whether the bottom row was already collapsed). Since
  none of those components hold state that would be lost by unmounting (the
  state already lives in `GisMap.tsx`, one level up — `layerState`,
  `bottomCollapsed`), conditional rendering was safe and simpler than a CSS
  visibility toggle plus fighting z-index/pointer-events for 3 separate
  floating panels at once.

### Trend from adjacent simulation steps, not a separate "history" query

- **Plain definition:** the popup's rising/falling/stable indicator is
  computed by comparing `nodeFill[muid][step]` to `nodeFill[muid][step-1]` —
  both values already sit in memory (the same array every other per-step
  calculation in this file reads from).
- **Why it shows up here:** avoids a second data shape ("trend history") for
  something that's just a delta of two adjacent points in data that already
  exists. `step === 0` (no previous step) is treated as "stable" rather than
  computing a fake trend against nothing.

### Native `<datalist>` as honest, zero-dependency search groundwork

- **Plain definition:** `<input list="id">` + `<datalist id="id">` gives
  free browser-native autocomplete suggestions with no JS library.
- **Why it shows up here:** full location search needs a gazetteer this
  project doesn't have. Rather than building a fake search experience or
  skipping the feedback point entirely, P2-20 wires a `<datalist>` of real
  station muids — genuinely useful today (typing a known muid highlights it),
  honest about what it doesn't do (no place names, no map jump yet).

## 5. How it was approached

- Read every touched file in full before editing (`styles.css`,
  `GisLayerPanel/GisTopBar/GisMapCanvas/GisRightPanel/GisCameraCard.tsx`,
  `GisMap.tsx`, `Icon.tsx`, `strings.ts`) to match existing class-naming and
  comment conventions instead of inventing a new style within the same file.
- Existing code reused: the floating-card CSS treatment (blur + shadow +
  radius, already established since the 2026-07-23 follow-ups), the
  `tRef`/`modeRef` stale-closure guard pattern, the `children`-overlay
  mechanism (`GisMapCanvas`'s existing `children` prop), the `ResizeObserver`
  already watching `.gis-canvas-wrapper` (so P2-18's collapse toggle needed
  zero new resize-handling code), and `stepTimeLabel`/`floodStatsAtStep`
  (existing helpers, not reinvented).
- Rejected: merging the legend into the right panel (feedback's original
  ask) — the user confirmed keeping it separate, since a legend is a passive
  reference that should never be hidden by any future collapse/Focus Mode
  toggle, unlike the opacity/stats panel which the user opens on purpose.

## 6. Where it got stuck (if anywhere)

No real snags — this batch was almost entirely additive CSS/JSX on top of
components whose data-flow was already correct from P2-01..P2-07. The one
thing worth flagging: `stepTimeLabel` wasn't previously imported in
`GisMapCanvas.tsx` (only used in `GisTopBar.tsx`/`Dashboard.tsx`) — needed
for the popup's "updated at" line, added as a new import rather than
duplicating the formatting logic inline.

## 7. How to verify it yourself

```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs   # from repo root — "OK - 132 keys, vi/en in sync"
cd web && npm run build
npm run dev   # then open /gis-map by hand, toggle LangToggle, click a manhole marker
```
Expected: all 3 commands clean; visually, checkboxes are visibly bigger,
clicking a manhole shows a 4-line popup with a real trend arrow, the bottom
row has a collapse pill, and the new Focus Mode button (map's top-right
corner) hides the side panels and grows the map.

## 8. Gotchas / things to remember

- If a future task adds more popup content, keep using the `?raw` SVG +
  string-template approach for anything inside `showPopup()` — a stray
  `<Icon/>` JSX call inside a template string will render as literal text,
  not an icon, and won't error at compile time (it's just a string).
- Focus Mode and the bottom-panel collapse are two independent booleans
  (`focusMode`, `bottomCollapsed`) that both drive the same
  `.gis-bottom-collapsed` CSS class — don't conflate them into one state if
  a later task needs to distinguish "user manually collapsed" from "focus
  mode is temporarily hiding it," since exiting Focus Mode intentionally
  restores whatever `bottomCollapsed` already was rather than resetting it.
- No headless browser is available in this environment (a longstanding gap
  noted since P0-10) — every visual claim above is from code-level
  reasoning + `tsc`/build/i18n checks, not an actual screenshot. A manual
  `npm run dev` check by the user is still the way to catch anything a type
  checker can't (e.g. wrapping/overflow at 375px, CSS ordering surprises).
