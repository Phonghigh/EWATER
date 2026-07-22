# Follow-up — Login glass-card polish + Dashboard readability pass

**Date:** 2026-07-22 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
User-driven UX polish on two already-shipped pages (P0-12 Login, P1-02/05/06
Dashboard) based on two external UI/UX reviews pasted into the session —
no new page or backlog task, just refinement of existing ones.

## 2. Where it fits
- Login: touches P0-12 (Phase 0). Dashboard: touches P1-02/P1-05/P1-06 (Phase 1).
  Both phases are already `[x]` in `INDEX.md` — this is maintenance, not new scope.
- After this: Login's glass card has better contrast/brightness and a
  brighter logo plate; Dashboard's KPI cards visually separate "primary"
  (flood points/routes/water level) from "secondary" (rain/pumps/gates),
  and text/charts/sidebar are sized for an older, non-power-user audience
  (per a government-GIS-specific review, not a generic SaaS one).

## 3. The problem
Two rounds of user-reported visual bugs during iteration, both non-obvious
from reading the CSS alone — needed the actual rendered page (via a headless
Chrome screenshot, since no Playwright/chromium-cli exists in this repo) to
diagnose.

## 4. Concepts introduced

### Stacking order of `position: absolute` siblings without explicit `z-index`
- **Plain definition:** an absolutely-positioned element paints *after*
  (i.e. on top of) its non-positioned in-flow siblings, by default — but
  once you give *either* sibling an explicit `z-index`, that default no
  longer applies and you own the ordering yourself.
- **Why it shows up here:** the login field's mail/lock icon (`position:
  absolute`) was meant to sit visually above the `<input>`. Adding
  `z-index: 1` to the input (to fix an unrelated caret-visibility worry)
  flipped the stacking and made the icon disappear under the input's own
  (semi-opaque-on-focus) background — a regression introduced by a "fix"
  aimed at the wrong layer. Correct fix: give the **icon** the higher
  `z-index`, not the input.

### `mix-blend-mode: multiply` is backdrop-dependent
- **Plain definition:** `multiply` darkens a layer based on what's rendered
  *underneath* it — it has no fixed output color of its own.
- **Why it shows up here:** the login logo used `multiply` to blend its
  white PNG background into the page. That worked over a plain light page,
  but once the logo sits over a translucent, blurred photo backdrop (the
  glass card), the result became unpredictably dim depending on which part
  of the photo showed through. Fix: stop relying on blend-mode compositing
  for a logo that needs to look consistent — give it its own small opaque
  "plate" (a white circle) instead, so its brightness no longer depends on
  whatever's behind the card.

## 5. How it was approached
- Options considered for logo brightness: (a) increase blur/opacity so less
  of the backdrop shows through `multiply`, (b) remove `multiply` and add an
  opaque backing plate. Chose (b) — deterministic across any backdrop,
  rather than tuning blur values to work "well enough" for one background.
- Reused the existing headless-Chrome screenshot approach from the Login
  session (`chrome.exe --headless --screenshot=...`) to actually see the
  rendered page before believing a CSS fix worked — caught the z-index
  regression this way, which reading the CSS diff alone would have missed.

## 6. Where it got stuck
- **Symptom:** email icon invisible while input focused, but the padding
  reserved for it still there (visible dead space).
  **Cause:** my own prior turn's fix (`input { z-index: 1 }`) painted the
  input's near-opaque focus background over the icon.
  **Fix:** swap so the icon (`z-index: 1`) sits above the input
  (`z-index: 0`) — caret visibility (the original worry) doesn't depend on
  this ordering at all, since the caret is intrinsic to the input's own
  paint, not a separate layer that can be occluded by a sibling.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs
cd web && npm run build
```
Expected: all three clean. Visual: `npm run dev`, open `/login` — mail/lock
icons visible and vertically centered inside their fields at all times,
including while focused; logo sits on a bright white circle regardless of
the background photo. Open `/` — the 3 "primary" stat cards (red/orange
tone) read heavier than the 3 "secondary" ones (rain/pumps/gates, now on a
flat `#f8fafc` background with no shadow).

## 8. Gotchas / things to remember
- Never add `z-index` to fix a "my element is invisible" bug without first
  checking whether a *sibling* now also has one — the bug is almost always
  in the relative ordering, not either element in isolation.
- `mix-blend-mode` on a logo/icon is a trap the moment the parent's
  background stops being a flat, known color (glassmorphism, photo
  backdrops). Prefer an opaque backing shape instead.
