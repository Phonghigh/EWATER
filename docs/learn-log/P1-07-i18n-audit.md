# P1-07 — i18n `dash.*` đầy đủ + check-i18n sạch + LangToggle test

**Date:** 2026-07-22 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Audit pass closing out Phase 1: confirmed every `dash.*` string across
P1-02/P1-03/P1-05/P1-06 has a matching vi/en pair and nothing is hardcoded
outside `t()` — no code changes needed.

## 2. Where it fits
- Last task of Phase 1 (Dashboard, Tab 1) in [tasks/INDEX.md](../../tasks/INDEX.md).
  Closes the phase; Phase 2 (Bản đồ GIS) is next.

## 3. The problem
Not really a problem — a verification task. The risk it guards against is
drift: five separate tasks (P1-02, P1-03, P1-05, P1-06) each added `dash.*`
strings over the course of a session; without an explicit audit, it's easy
for one language block to silently fall behind the other, especially since
`t()`'s fallback (`STRINGS[lang][key] ?? STRINGS.en[key] ?? key`) hides
missing-`vi`-key bugs at runtime (see root `CLAUDE.md`'s i18n section on
this exact failure mode).

## 4. Concepts introduced
None new — this task exercises the discipline every prior Phase 1 task
already followed (add both `vi`/`en` keys in the same edit as the code using
them), rather than introducing a new pattern.

## 5. How it was approached
- Grepped every Dashboard component (`Dashboard.tsx`, `FloodMapPreview.tsx`,
  `WeatherForecastCard.tsx`, `ForecastChartsRow.tsx`) for quoted string
  literals not going through `t()`, filtering out CSS class names, MapLibre/
  recharts internal identifiers (layer ids, `type: "raster"`, etc.), and
  unit literals (`"mm"`/`"m"`/`"H"` — units aren't translated app-wide,
  established since P1-02's `unit` prop on `StatCard`). Nothing found.
- Diffed the `vi`/`en` key sets programmatically (not just trusting
  `check-i18n.mjs`'s count-based pass) via a small Python script comparing
  the two `Record<string,string>` blocks in `strings.ts` — confirmed
  identical key sets, 25 `dash.*` keys on both sides.
- Ran `node scripts/check-i18n.mjs` from repo root: "OK - 55 keys, vi/en in
  sync."

## 6. Where it got stuck (if anywhere)
No real snags — clean audit, as expected given every prior task's discipline.

## 7. How to verify it yourself
```bash
node scripts/check-i18n.mjs   # run from repo root
cd web && npx tsc --noEmit
cd web && npm run build
cd web && npm run dev         # visit /, toggle LangToggle (🇻🇳/🇬🇧),
                               # confirm every dash.* label switches:
                               # 6 stat-cards, map card, weather card +
                               # hourly strip, both chart titles
```
Expected: `check-i18n.mjs` reports 55 keys in sync; `tsc`/`build` clean; no
label left in the other language after toggling.

## 8. Gotchas / things to remember
- This audit only covers `dash.*` and the components that use it — it isn't
  a whole-app i18n sweep. The same "same-edit" discipline should continue
  per-task in later phases rather than deferring to a big audit at the end.
