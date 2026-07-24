# Learn-Log — teach-back reports for the web redesign

While `tasks/` builds the new Urban Flood Digital Twin web UI one task at a
time, this folder collects a short report per task explaining *what the
problem was, how it was solved, and what concept it introduces* — in plainer
language than a terse progress-log entry.

| File | What it is | Who it's for |
|---|---|---|
| [tasks/PROGRESS.md](../../tasks/PROGRESS.md) | Terse build ledger (changed / files / verify) | Tracking build state |
| **`docs/learn-log/<task>.md`** (this folder) | A short lesson per task | Understanding *why*, not just *what* |
| [docs/LEARNING_LOG.md](../LEARNING_LOG.md) | Concept-mastery tracker + mind map | Tracking what's been covered |

## How it works

1. After a task's code is done and verified (per [tasks/ROUTINE.md](../../tasks/ROUTINE.md)
   step 5), copy [`_TEMPLATE.md`](_TEMPLATE.md) to
   `docs/learn-log/<task-id>-<slug>.md` and fill it in — grounded in the actual
   diff and the `PROGRESS.md` entry for that task, not a generic explainer.
2. Add a row to the [Index](#index) below and update the concept tracker in
   [LEARNING_LOG.md](../LEARNING_LOG.md).

Unlike XmindClone (the pattern this is adapted from), there's no automated
research-trail capture or Stop-hook enforcement here — reports are written by
hand as part of finishing each task, scaled to how much the task actually
introduced (a one-line i18n-key task can say "Nothing new here"; a new
data-service pattern or layout mechanism gets the fuller treatment).

## Reading a report

Each report follows [`_TEMPLATE.md`](_TEMPLATE.md): one-sentence summary → why
it matters → the problem → concepts involved → how it was approached → where
(if anywhere) it got stuck → how to verify → gotchas.

## Index

Newest at the top. One row per task report.

| Task | Report | Notes |
|---|---|---|
| Follow-up | [Draw the Vĩnh Long province boundary](FOLLOWUP-2026-07-24-province-boundary.md) | A `type:"line"` layer over a (Multi)Polygon source renders just its outline; the data was already loaded (`data.provinceBoundary`) and only needed a layer; drawn below point markers so it never covers a clickable node |
| Follow-up | [GIS node hover chart, focus-fit, opacity removal](FOLLOWUP-2026-07-24-gis-hover-chart-focus-fit.md) | Hover popup (anchored + `pointer-events:none`) instead of click, replacing the "Theo dõi trạm" button; a per-node water-level chart drawn as an inline SVG string because MapLibre popups are raw HTML; `calc(100vh - reserve)` instead of `vh` so the map fills the viewport without hiding fixed chrome |
| Follow-up | [GIS UX refinement + Situation Banner](FOLLOWUP-2026-07-24-gis-ux-situation-banner.md) | CSS specificity tie broken by source order (the white-on-white hover bug); exception-driven UI reusing the existing `flyTarget` path instead of new map code; one shared `manholeState()` rule for labels/legend/banner; `prefers-reduced-motion` gating a critical-only pulse; only animate `.maplibregl-popup-content`, never the outer element MapLibre positions |
| Follow-up | [GIS search autocomplete, floating analytics toggle, basemap cleanup](FOLLOWUP-2026-07-24-gis-search-toggle-basemap.md) | Custom autocomplete replacing native `<datalist>` (styleable, typed rows, keyboard ARIA); `pointerdown`-not-`click` so an option commits before the close-on-outside handler; prop-driven `map.flyTo` instead of an imperative ref; `?raw` SVG imports aren't existence-checked by `tsc` (wrong glyph fails only at Vite resolve) |
| P2-08..P2-20 | [GIS map UX redesign for older operations staff](P2-08-P2-20-ux-redesign-cognitive-load.md) | Reusing the mount-once-effect ref guard a 3rd time; raw-SVG-in-template-string for MapLibre popups (can't use the React `Icon` component there); conditional non-rendering vs. CSS-hiding for Focus Mode; native `<datalist>` as honest, zero-dependency search groundwork |
| Follow-up | [Right info panel also floats over the map](FOLLOWUP-2026-07-23-right-panel-overlay.md) | Same `children`-overlay mechanism applied a 2nd time on the opposite corner, confirming it was the right generalization rather than a one-off hack for the left panel |
| Follow-up | [Map-first /gis-map layout: no page title, shorter search, floating layer panel, minimap removed](FOLLOWUP-2026-07-23-map-first-layout.md) | A component can host a caller's floating UI via `children` without knowing what it is (`GisMapCanvas`'s new `children` prop, rendered inside its own positioning context); removing a feature can be the right answer when a design doesn't match the user's mental model, not just redesigning it |
| Follow-up | [Collapsible left layer panel, smaller checkboxes, right panel split into cards](FOLLOWUP-2026-07-23-layer-panel-toggle-right-cards.md) | A flex row's default `align-items: stretch` forces siblings to match the tallest one's height — fix is `align-items: flex-start` + splitting one tall card into per-section auto-height cards; a hide-by-default panel's toggle must live outside the panel it controls |
| Follow-up | [Live minimap viewport, legend thresholds, pump/gate icons](FOLLOWUP-2026-07-23-minimap-legend-icons.md) | Cross-sibling live data needs lift-state-up, not a shared map instance; rasterizing a DOM icon for a WebGL map layer (CSS `fill:currentColor` doesn't survive rasterization); a legend's numbers must read from the same source as what they describe |
| Follow-up | [Real wall-clock time for "Hiện tại" + playback](FOLLOWUP-2026-07-23-live-now-time.md) | Mapping a real dateless clock onto a data array that has no dates (real lookup, not a fabricated value); a live value must decide who owns re-triggering it — Dashboard binds directly, `/gis-map` only seeds initial state |
| Follow-up | [Blank-map fix](FOLLOWUP-2026-07-23-blank-gis-map-fix.md) | A map needs a real `style` before `load` will ever fire — omitting it entirely (not just an empty style) silently breaks everything downstream |
| Follow-up | [Flood heatmap + water-level labels + cluster warnings](FOLLOWUP-2026-07-23-flood-heatmap.md) | Native heatmap layer as an honest way to visualize sparse real point data densely, without inventing a fake fine grid; 2 color languages (severity vs. extent) must stay visually separate; demoting a layer instead of deleting it |
| P2-07 | [i18n `gis.*` audit (closes Phase 2)](P2-07-i18n-audit.md) | Pure audit, no code change — programmatic vi/en key-set diff instead of trusting `check-i18n.mjs`'s count alone, same move as P1-07 |
| P2-06 | [Confirm Dashboard → /gis-map link (audit)](P2-06-dashboard-link-audit.md) | Pure audit, no code change — link/route already agreed before P2-01..P2-05 landed, just re-verified after |
| P2-05 | [GIS map bottom panel: reused charts + camera placeholder](P2-05-gis-bottom-panel.md) | Reusing a component across 2 unrelated pages unchanged (confirms it was already page-agnostic); a placeholder that names *why*, not just *when* |
| P2-04 | [GIS map right panel: opacity, flood stats, minimap](P2-04-gis-right-panel.md) | Deriving zone area from geometry + a step-gated severity flag (static shape, dynamic "is it currently flooded"); reusing an existing depth formula instead of inventing a second one; a live-controlled paint property vs. a static default (P2-03's `floodOpacity` seam paying off) |
| P3 | [Quan trắc thời gian thực (single-tab)](P3-monitoring-single-tab.md) | Array-per-row `numeric[]` time series (mirrors `simulation_node_fill`); wall-clock→step anchoring at 10-min; graceful degradation for not-yet-seeded additive data; first recharts multi-series (lines + grouped bars); MapLibre DOM markers to skip glyph setup |
| P2-03 | [GIS map: real interactive canvas + floating tools](P2-03-gis-map-canvas.md) | Pre-add both basemap raster layers and toggle visibility instead of `setStyle()` (which would drop custom layers); client-side haversine/shoelace math instead of a new mapping dependency; a layer checkbox can exist honestly with nothing rendered behind it yet |
| P2-02 | [GIS map "Lớp dữ liệu" panel](P2-02-gis-layer-panel.md) | UI state can be honestly ahead of its data source (no Google tiles/light basemap exist yet — flagged inline, not faked); grouped checkbox state vs. exclusive radio state in one component |
| P2-01 | [GIS map top bar: search + playback](P2-01-gis-topbar-playback.md) | Local per-page step state instead of reviving a global store; `setInterval` cleanup inside `useEffect`; hour-jumps as a step-grid conversion, not a fixed step count |
| Follow-up | [Material Symbols icon system + Inter font](FOLLOWUP-2026-07-22-icon-font-system.md) | Variable icon-fonts bundle every glyph (~4MB) regardless of usage — per-glyph SVG imports (`?raw`) are dramatically smaller for a small icon set; a clean build doesn't mean a reasonably-sized one |
| Follow-up | [Login glass-card + Dashboard readability polish](FOLLOWUP-2026-07-22-login-dashboard-polish.md) | Absolute-sibling `z-index` stacking gotcha; `mix-blend-mode` breaks over non-flat backdrops — use an opaque backing shape instead |
| P1-07 | [i18n audit (closes Phase 1)](P1-07-i18n-audit.md) | Pure audit, no code change — programmatic vi/en key-set diff instead of trusting `check-i18n.mjs`'s count alone |
| P1-06 | [Forecast charts (rain + water level)](P1-06-forecast-charts.md) | Reusing a "dead" dependency (`recharts`) instead of adding a new one; treating documented-synthetic tide data as real for UI purposes |
| P1-05 | [Weather forecast card](P1-05-weather-forecast-card.md) | Treating a static demo series as self-referential (no wall-clock alignment); replacing a fabricated probability with a real derived count |
| P1-03 | [Flood map preview card](P1-03-flood-map-preview.md) | `interactive: false` as a deliberate scope boundary vs. P2-03's full map; deriving map paint from already-loaded `AppData`, not a new query |
| P1-02 | [Header + 6 stat-card](P1-02-dashboard-header-stats.md) | Deriving "current time" from a step index; placeholder step until P2-01's playback lands; `t()` has no string interpolation |
| P1-01 | [dashboardService aggregate](P1-01-dashboard-service.md) | Surcharge ratio (>1.0) as flood depth above ground, not a bug to clamp; deterministic vs. random mock for untyped source fields |
| P0-16 | [Delete unused code, reverse pre-scaffold policy](P0-16-delete-unused-reverse-scaffold-policy.md) | YAGNI applied to your own recent scaffolding; verify bundle content by a library's own literal strings |
| P0-13 | [Route guard matrix verification](P0-13-route-guard-verification.md) | Static code-trace as a verification method, and its limits |
| P0-12 | [Reskin Login.tsx](P0-12-login-reskin.md) | Deviated from the mockup's field label for backend correctness |
| P0-11 | [Rewrite styles.css](P0-11-styles-rewrite.md) | CSS custom properties as a tiny design-token layer; verify-by-grep instead of instinct |
| P0-10 | [AppShell.tsx + new App.tsx router](P0-10-appshell-router.md) | Two independent nested layout routes (shell vs. auth gate) |
| P0-09 | [PageHeader.tsx](P0-09-pageheader.md) | Same slot-composition shape as the existing `Card` component |
| P0-08 | [TopBar.tsx](P0-08-topbar.md) | Design revision: sidebar always mounted, not hidden for guests |
| P0-07 | [Sidebar.tsx](P0-07-sidebar.md) | Filter a static config array by role instead of inline conditionals |
| P0-06 | [Delete old-design files](P0-06-delete-old-design-files.md) | Pure deletion — sequencing note only |
| P0-05 | [RequireRole (2 roles) + RequireGuestOrRole](P0-05-require-role-guards.md) | "Documentation component" that renders unconditionally on purpose |
| P0-04 | [Simplify AuthContext to 2 roles](P0-04-auth-2-roles.md) | "No session" as a real supported state (guest), not just loading |
| P0-03 | [Rewrite i18n strings foundation](P0-03-strings-foundation.md) | Bookkeeping only — no new concept |
| P0-02 | [data/ service layer skeleton](P0-02-data-service-skeleton.md) | The mock/real "service seam" pattern |
| P0-01 | [Extend types.ts](P0-01-extend-types.md) | Shared `DeltaStat`/`ScenarioImpactResult` reuse pattern |
