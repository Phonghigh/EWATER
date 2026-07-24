# Follow-up (2026-07-24) — GIS UX refinement pass + Situation Banner

**Date:** 2026-07-24 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
A design-review pass over the GIS flood map (Tab 2): map-first defaults, a
readable time controller, a fixed hover bug, a decluttered right panel,
alert-aware markers + legend counts, disciplined motion, and a new
exception-driven **Situation Banner** that surfaces critical flooding without
the operator having to hunt for it.

## 2. Where it fits
Phase 2 (Bản đồ GIS) polish, driven by user feedback rather than a numbered
INDEX task. After it, the GIS page opens with the map at full height, the
water-level marker pills signal severity by themselves, the legend shows live
per-band counts, and a red banner appears whenever any node is at the critical
(surcharge) threshold — one click flies to the worst point.

## 3. The problem
Two items needed real thought rather than rote CSS:
1. The "Chạy mô phỏng" button went **white-on-white on hover** — an invisible
   label. The cause wasn't obvious from the markup; it was a CSS *specificity*
   collision.
2. "Exception-driven UI" — the map shouldn't make an operator scan hundreds of
   nodes to notice a problem; the system should announce it. That needed a new
   component wired to real severity data, plus a way to jump to the worst node
   reusing existing machinery (not new map code).

## 4. Concepts introduced

### CSS specificity tie-break (the hover bug)
- **Plain definition:** when two CSS rules both match an element, the one with
  higher *specificity* wins; on an exact tie, the rule that appears **later**
  in the file wins.
- **Why it shows up here:** `.gis-topbar-icon-btn:hover:not(:disabled)`
  (specificity 0,3,0 — `:not(:disabled)` counts its inner `:disabled`) beat the
  primary button's `.gis-topbar-icon-btn--primary:hover` (0,2,0). So on hover
  the base rule's near-white `#eef4fa` background applied while the primary
  button's white text persisted → invisible. Fix: give the primary hover rule
  the same `:not(:disabled)` so it reaches 0,3,0 *and* comes later, winning the
  tie — and re-assert `color:#fff` so text stays white on the blue hover.

### Exception-driven UI
- **Plain definition:** a design principle where the interface proactively
  highlights the few things that need action instead of showing everything
  equally and making the user find the anomaly.
- **Why it shows up here:** the Situation Banner only renders when
  `manholeStateCounts(...).surcharge > 0`; the rest of the time it's absent.
  It reuses the *existing* `flyTarget` prop path (top-bar search already flies
  the map + opens a popup on change) — "Xem ngay" just pushes a `StationHit`
  built from the deepest node, so no new map-mutation code was needed.

### `prefers-reduced-motion`
- **Plain definition:** an OS accessibility setting, readable in CSS via
  `@media (prefers-reduced-motion: reduce)`, saying "this user doesn't want
  animation."
- **Why it shows up here:** Government-GIS restraint means minimal, meaningful
  motion — only the *critical* marker pulses, and the media query drops that
  pulse, the banner fade, and the popup scale to instant when asked.

## 5. How it was approached
- **Reused, not rebuilt:** the banner's "fly to node" leans entirely on the
  existing `flyTarget`/`setFlyTarget` state in [GisMap.tsx](../../web/src/pages/GisMap.tsx)
  and the fly-to effect in [GisMapCanvas.tsx](../../web/src/components/gis/GisMapCanvas.tsx);
  severity classification is centralized in a new `manholeState()` helper in
  [gisService.ts](../../web/src/data/gisService.ts) so labels, legend counts,
  and banner all read one rule instead of copies (the map's own `fillState()`
  already used the same thresholds).
- **Marker severity via a shape cue, not color alone:** each pill gets a status
  dot + colored left border keyed to `WaterLevelNode.state` (newly added to the
  service return), satisfying the "don't rely on color only" accessibility rule.
- **Bottom panel:** the collapse state + CSS class already existed (P2-18); this
  only flipped the default to collapsed — a one-token change, no new mechanism.
- **Popup animation caveat:** scaled `.maplibregl-popup-content` (the inner box)
  rather than `.maplibregl-popup` (the outer element MapLibre positions with its
  own `transform`) — animating the outer transform would fight MapLibre's
  placement mid-animation.

## 6. Where it got stuck (if anywhere)
No real snags. The one trap avoided by inspection: not animating the popup's
positioned outer element (see §5).

## 7. How to verify it yourself
```bash
node scripts/check-i18n.mjs
cd web && npx tsc --noEmit -p .
```
Expected: `i18n check OK - 163 keys, vi/en in sync.` and no `tsc` output.
Then in the app (GIS tab): bottom row starts collapsed; hovering "Chạy mô
phỏng" keeps white text on blue; the legend shows live counts; stepping to a
flooded time shows the red banner and a pulsing critical marker; "Xem ngay"
flies to the deepest node. Toggle 🇻🇳/🇬🇧 to check the 4 new strings.

## 8. Gotchas / things to remember
- CSS ties break by **source order** — when a modifier rule "loses" to a base
  rule at equal specificity, matching the base's pseudo-classes (and placing it
  later) is the clean fix, not `!important`.
- MapLibre owns `transform` on `.maplibregl-popup`; only animate the inner
  `-content`.
- `manholeStateCounts` / `topWaterLevelNodes` recompute per render — fine at
  ~834 nodes, single pass; keep it that way (no premature memo needed, but
  don't add per-node work inside the loop).
- New strings must land in **both** `vi` and `en` in the same edit; trimmed the
  now-unused `gis.time.preset.h4/h5/h24` and `gis.right.selectedLayer/opacityHint`
  keys to keep the dictionary pruned to live usage.
