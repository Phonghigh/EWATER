# P0-11 — Rewrite styles.css

**Date:** 2026-07-20 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

## 1. In one sentence
Deleted every CSS rule that only the now-gone FRMIS pages used, and added the
new sidebar-shell styling (sidebar/topbar/page-header), while leaving the
map-engine and generic-component CSS (tables, cards, modals) untouched.

## 4. Concepts introduced

### CSS custom properties as a tiny design-token layer
- **Plain definition:** `:root { --navy: #0f2a43; }` defines a named value
  once; `var(--navy)` reads it anywhere in the stylesheet.
- **Why it shows up here:** the same navy blue and accent blue are reused
  across the sidebar, top bar, buttons, and login gradient. Four named
  tokens (`--navy`, `--navy-light`, `--accent`, `--accent-light`) mean a
  future rebrand is a 4-line edit instead of a find-and-replace across the
  file — small-scale version of the "design tokens" idea without pulling in
  a real token-build tool (still plain CSS, per the project's "no new
  framework" decision).

## 5. How it was approached
Deleted-vs-kept was decided by *who still imports the component*, not by
"is this page-specific-looking CSS" — e.g. `.step-control`/`.datatable`/
`.card` all *look* dashboard-specific but are kept because `StepControl.tsx`/
`DataTable.tsx`/`Cards.tsx` are still live, ported components that Phase 1+
will keep using. Verified the cut list with a grep for each deleted
class name across `web/src` (see PROGRESS.md) rather than trusting the "this
looks unused" instinct — real evidence, since JSX className strings aren't
typechecked and a stale reference wouldn't show up as a `tsc` error.

## 6. Where it got stuck
No real snags. One quiet win worth noting: the shipped CSS bundle actually
got *smaller* (12.67 kB vs. the old 15.65 kB) despite this task adding a
whole new shell system — the FRMIS-era dead weight (topnav, portal hero,
report controls, my-area) outweighed what was added.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit && npm run build
```
Expected: clean typecheck, successful build. (No automated visual check
available in this environment — see P0-10's report for why.)
