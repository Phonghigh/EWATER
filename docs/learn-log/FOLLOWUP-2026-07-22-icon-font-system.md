# Follow-up — Material Symbols icon system + Inter font

**Date:** 2026-07-22 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Replaced the hand-drawn monoline SVG icon set (`components/Icon.tsx`) with
Google's Material Symbols (per-glyph SVG imports, not the variable-icon-font
approach — that bundled a ~4 MB font for ~20 icons), and switched the app's
base font from the system-font stack to a self-hosted Inter.

## 2. Where it fits
- Cross-cutting UI-system change, not tied to a single `INDEX.md` phase —
  touches every page via the shared `Icon` component and `body` font-family.
- User's explicit choice from a two-question decision: icon library
  (Material Symbols vs. Fluent UI System Icons) and font (Inter vs. SF Pro).

## 3. The problem
The obvious path — Google's official `material-symbols` npm package, which
ships one variable font containing *every* Material Symbols glyph (fill,
weight, grade, optical-size axes, thousands of icons) — produced a build
output with a single **3.96 MB** `.woff2` file, for an app that uses about 20
icon names total. Caught by actually reading `npm run build`'s asset-size
output, not by assuming the "official" package was automatically the right
choice.

## 4. Concepts introduced

### Variable font vs. per-glyph SVG for icon libraries
- **Plain definition:** a "variable font" icon package ships one file with
  every icon baked in, selected at render time by a ligature (typing the
  text `home` renders the home glyph via the font's `liga` OpenType
  feature). A "per-glyph SVG" package ships one small file *per icon*,
  which a bundler only includes if something actually imports it.
- **Why it shows up here:** the ligature-font approach is a network-request
  and simplicity win when you're using hundreds of a library's icons (no
  import bookkeeping) — but with ~20 icons, tree-shakeable individual
  imports (`@material-symbols/svg-400`) are dramatically smaller, and this
  app's whole design intent (see other learn-log entries this session) is
  "small footprint" already (self-hosted fonts, no CDN scripts).

### Vite's `?raw` import suffix
- **Plain definition:** appending `?raw` to any static-asset import path
  makes Vite return the file's contents as a plain string at build time,
  instead of the usual "resolve to a public URL" behavior for assets like
  `.svg`.
- **Why it shows up here:** each icon's raw `<svg>...</svg>` markup is
  imported as a string (`import home from ".../home.svg?raw"`) and injected
  via `dangerouslySetInnerHTML` — safe here specifically because the content
  is a fixed set of build-time imports from a trusted npm package, never
  runtime/user-supplied data.

### CSS presentation-attribute override for `fill`
- **Plain definition:** an SVG `<path>` with no explicit `fill` attribute
  defaults to black (SVG's initial value), but *any* CSS rule targeting it
  (even a low-specificity one in your own stylesheet) overrides that
  default — presentation attributes lose to CSS by spec, not by
  specificity math.
- **Why it shows up here:** none of `@material-symbols/svg-400`'s SVGs set
  `fill="currentColor"` themselves — `.icon svg { fill: currentColor }` in
  `styles.css` is what makes every icon inherit its container's text color
  for free, without editing the imported SVG strings.

## 5. How it was approached
- First attempt: `material-symbols` (ligature font) + Inter via
  `@fontsource/inter`, imported once in `main.tsx`. Passed `tsc`/build
  cleanly — the 3.96 MB font asset was only caught by reading the actual
  `npm run build` size output afterward, not by the build failing (it
  didn't; oversized-but-working assets don't error).
- Switched to `@material-symbols/svg-400` (rejected `material-symbols`
  entirely, uninstalled it) once the size problem was found — one `?raw`
  import per icon name actually used, mapped through the same semantic
  `IconName` union the old hand-drawn set already had, so every call site
  (`<Icon name="lock" />` etc.) needed zero changes.
- `Login.tsx` had its own bespoke inline SVGs for mail/lock/eye-toggle
  (predating the shared `Icon` component) — folded those into the same
  system (`mail`, `eye`, `eye-off` added to `IconName`) instead of running
  two parallel icon systems in the app.

## 6. Where it got stuck (if anywhere)
- **Symptom:** would have shipped a 3.96 MB font silently if not checked.
  **Cause:** `npm run build`'s console output lists every asset with its
  size, but nothing *fails* on an oversized font — Vite's chunk-size
  warning only fires for JS chunks over 500 kB, not font/asset files.
  **Fix:** actually read the asset list, not just "build succeeded" /
  `tsc` clean. General lesson, not specific to this task: a clean build
  proves the code compiles, not that what it produces is a reasonable size.
- Verified every Material Symbols glyph name used (`water_pump`, `gate`,
  `monitoring`, `rainy`, `inventory_2`, `route`, `water_drop`, plus the
  common ones) actually exists in Google's icon set via the published
  `.codepoints` file on GitHub *before* wiring them in — cheaper than
  discovering a typo'd glyph name renders nothing at runtime.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs   # run from repo root — unaffected, no string changes
cd web && npm run build       # read the asset list: no single font/JS
                               # asset should be multi-MB; Inter's per-weight
                               # woff2 files are ~20-40 kB each
```
Expected: all clean; visually, `npm run dev` — every icon across
Sidebar/TopBar/Dashboard/Login still renders (now as Material Symbols
outlined glyphs instead of the old hand-drawn strokes), and Login's
email/password fields + show/hide-password toggle still work.

## 8. Gotchas / things to remember
- If a new icon is ever needed, add its glyph name to `GLYPHS`... no —
  to `RAW` in `Icon.tsx` as a new `?raw` import + `IconName` union entry.
  Verify the exact Material Symbols name exists first (search
  `fonts.google.com/icons` or the `.codepoints` file) — a wrong name fails
  silently (Vite errors on a missing file import, which is at least loud,
  but a *renamed* existing icon a future Google update might not be caught
  by anything here).
- Don't reach for the `material-symbols` (or any "everything in one file")
  variable-font package again for a small, known icon set — always check
  `npm run build`'s asset sizes after adding an icon/font dependency, not
  just that the build succeeds.
