# P0-03 — Rewrite i18n/strings.ts foundation namespaces

**Date:** 2026-07-20 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

## 1. In one sentence
Swapped the old FRMIS-portal string dictionary's page-specific keys for the
new sidebar UI's `nav.*`/`role.*`/`login.*`, keeping the reusable `app.*`/
`col.*` and the still-live map-engine namespaces.

## 3. The problem
Mostly bookkeeping. Nothing new here — this is a content edit to an existing
mechanism (the `t()`/`STRINGS` dictionary and its fallback chain), not a
new pattern. See [P0-01](P0-01-extend-types.md)/[P0-02](P0-02-data-service-skeleton.md)
if you want the two real new ideas so far in this phase.

## 7. How to verify it yourself
```bash
node scripts/check-i18n.mjs   # from repo root: "OK - 114 keys, vi/en in sync."
cd web && npx tsc --noEmit
```

## 8. Gotchas / things to remember
- `check-i18n.mjs` only checks vi/en key *parity*, not whether a key is
  actually used anywhere in code — deleting a key that a not-yet-deleted old
  page still calls `t()` with is harmless (falls back to showing the raw key
  string), not a build error. Worth cleaning up together with P0-06 anyway.
