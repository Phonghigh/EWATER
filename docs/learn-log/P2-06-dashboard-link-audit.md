# P2-06 — Confirm Dashboard → `/gis-map` link (audit only)

**Date:** 2026-07-23 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Pure audit task — confirmed the Dashboard "Xem chi tiết bản đồ →" link
(built in P1-03) and the sidebar's "Bản đồ GIS" nav item still point at a
real, working `/gis-map` page after P2-01..P2-05 changed that page's scope
significantly from the original plan.

## 2. Where it fits
- Closes the "Nối link Dashboard → `/gis-map`" line in
  [tasks/INDEX.md](../../tasks/INDEX.md) — the link itself was never broken
  (`FloodMapPreview.tsx` has pointed at `/gis-map` since P1-03, before
  `/gis-map` even had a real page behind it), this task just verifies it
  still resolves to something real now that it does.

## 3. The problem
Nothing to build — `App.tsx`'s `/gis-map` route already renders `<GisMap
/>` (swapped in during P2-01), and `FloodMapPreview.tsx`/`navItems.ts`
already pointed there. The only real question was "did any of the 5 tasks
since then (P2-01..P2-05) accidentally break the route or the link," which
required checking, not assuming.

## 4. Concepts introduced
None — this is bookkeeping/verification, no new code or pattern.

## 5. How it was approached
- Grepped the whole `web/src` tree for `gis-map` to enumerate every
  reference: `App.tsx`'s route, `navItems.ts`'s sidebar entry,
  `FloodMapPreview.tsx`'s `<Link>`. All 3 still agree on the same path.
- Re-ran the full verify suite (`tsc`, `check-i18n`, `build`) even though no
  files changed, plus a dev-server `curl` smoke test on both `/` and
  `/gis-map` — belt-and-suspenders confirmation rather than trusting the
  grep alone.

## 6. Where it got stuck (if anywhere)
No snags — nothing was broken.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
node scripts/check-i18n.mjs
cd web && npm run build
```
Expected: all three clean (unchanged from P2-05). Manually: `npm run dev`,
sign in as authority/admin, click "Xem chi tiết bản đồ →" on the Dashboard's
flood-map card — lands on the real `/gis-map` page (top bar, layer panel,
map, right panel, bottom row), not `ComingSoon`.

## 8. Gotchas / things to remember
None new.
