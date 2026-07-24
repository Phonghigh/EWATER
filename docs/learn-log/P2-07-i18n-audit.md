# P2-07 — i18n `gis.*` audit (closes Phase 2)

**Date:** 2026-07-23 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Pure audit task — swept every `gis.*`-touching file from P2-01..P2-06 for
un-translated strings and confirmed `vi`/`en` key sets are identical (108
keys each side), closing Phase 2 (Bản đồ GIS).

## 2. Where it fits
- Last task of Phase 2 in [tasks/INDEX.md](../../tasks/INDEX.md), following
  the same audit-only pattern P1-07 used to close Phase 1.
- After this task, `/gis-map` is done per the 2026-07-23 revised spec:
  top bar, layer panel, interactive map, right panel, bottom row — all
  bilingual, no follow-up i18n work owed.

## 3. The problem
Nothing to build — the risk with an audit task is trusting
`check-i18n.mjs`'s key *count* alone, which can't catch a coincidental
same-count mismatch (e.g. one key present in `vi` but missing in `en`,
offset by a different extra key in `en`). Also had to check for strings
that never went through `t()` at all — those wouldn't show up as a
`vi`/`en` mismatch, since they're not keys in `strings.ts` in the first
place.

## 4. Concepts introduced
None — audit only, same as [P1-07](P1-07-i18n-audit.md).

## 5. How it was approached
- Grepped every component under `web/src/components/gis/` plus
  `GisMap.tsx`/`Dashboard.tsx` for JSX text nodes and `title`/`placeholder`/
  `aria-label` attributes containing literal Vietnamese/Latin text — 0
  matches beyond a source comment (not user-facing).
- Didn't trust `check-i18n.mjs`'s "108 keys, vi/en in sync" message alone —
  wrote a throwaway Node script to independently parse both `vi`/`en`
  blocks of `strings.ts` and diff their key sets directly (same
  independent-verification move P1-07 used): both sides came back with
  exactly the same 108 keys, `onlyInVi`/`onlyInEn` both empty.
- Re-ran `tsc`/`build` one more time as a final Phase-2-wide sanity check,
  even though no files changed.

## 6. Where it got stuck (if anywhere)
No snags — every `gis.*` string added across P2-01..P2-05 already went
through `t()`/`useT()` from the start (established pattern, not something
that needed fixing here).

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs
cd web && npm run build
```
Expected: all three clean (108 keys, vi/en in sync). Manually: `npm run
dev`, open `/gis-map`, click the 🇻🇳/🇬🇧 `LangToggle` — every label across
the top bar, layer panel, map toolbar/legend/corner buttons, right panel,
and bottom row should flip language with nothing left in the other
language. No headless browser in this environment (longstanding gap noted
since P0-10) — this visual click-through is still owed to a manual check by
the user, same as every prior UI task in this phase.

## 8. Gotchas / things to remember
- Units (`mm`, `m`, `km²`, `ha`, `%`) are deliberately not translated
  app-wide (established since P1-02) — don't flag those as missing i18n
  coverage.
- `gis.exportMapMock`'s "(demo)" suffix and `gis.comingSoonInline`'s
  "(sắp có)"/" (coming soon)" are intentional inline qualifiers, not
  leftover debug text.
