# P0-16 — Delete all currently-unused code, reverse the pre-scaffold policy

**Date:** 2026-07-20 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

## 1. In one sentence
Deleted every file in `web/src` the running app doesn't actually import right
now — including code Phase 0 had deliberately *kept* for later phases to
reuse — because the user wants to write the rest of this app themselves and
doesn't want inherited code sitting in the tree.

## 2. Where it fits
Comes right after Phase 0 was marked "complete." It doesn't add a page; it
resets the foundation Phase 1+ builds on, and it changes a standing policy
recorded in `tasks/INDEX.md` for every phase that follows.

## 3. The problem
Phase 0's original plan explicitly *kept* things like `map/MapView.tsx`,
`monitoring/stations.ts`, and a `data/` service-skeleton (7 stub files) —
reasoning that they were either still-working engine code or useful seams for
future phases to fill in. The user's instruction directly contradicts that
premise: they don't want *any* file sitting in the repo that isn't doing
something right now, reused code included, because the whole point of this
project (for them) is to build it themselves and understand every line. Code
that's "there for later" is exactly the kind of thing that undermines that —
by the time Phase 2 gets to the map, is it really *their* map if half of it
was already sitting there from a previous session?

## 4. Concepts introduced

### YAGNI applied to your own recent work, not just old code
- **Plain definition:** "You Aren't Gonna Need It" usually means don't build
  a feature before it's asked for. Here it's the same idea turned on
  *infrastructure I had just built this session* — the `data/` service
  skeleton was authored *specifically* to be filled in later, which is
  exactly the pattern YAGNI warns against, just dressed up as "good
  architecture" instead of "a feature nobody asked for yet."
- **Why it shows up here:** it's tempting to treat your own forward-looking
  scaffolding as different from someone else's leftover code, because you
  understand *why* it's there. The user's instruction is a reminder that
  "I understand why it's unused" and "it's not unused" are different claims.

### Verify-by-grep before deleting, every time
- **Plain definition:** before removing a file, search the codebase for real
  import statements referencing it — don't delete based on "I'm pretty sure
  nothing uses this."
- **Why it shows up here:** used two grep passes — one for cross-directory
  imports (`from "../map/..."` etc.) and one narrower pass for same-folder
  imports (`from "./DemoBadge"`) that the first pattern would've missed.
  That second pass is what caught that `DemoBadge.tsx` was only used by two
  other files *also* being deleted in the same batch — worth confirming
  rather than assuming, since a same-directory relative import is easy to
  miss with an overly specific regex.

### A stale build config can outlive its reason for existing
- **Plain definition:** `vite.config.ts` had `manualChunks: { recharts: [...],
  maplibre: [...] }` — Rollup config that names specific packages to split
  into their own output files.
- **Why it shows up here:** even after every `recharts`-importing file was
  deleted, the *first* rebuild still produced a 141 KB `recharts` chunk with
  the exact same content hash as builds from many tasks earlier — a sign
  something was stale, not that recharts was somehow still reachable. A
  clean rebuild (`rm -rf node_modules/.vite dist` first) settled it: no
  separate chunk, and the main chunk grew by roughly the same 141 KB,
  meaning recharts genuinely *had* still been bundled, just merged into one
  file instead of split. Removing the manualChunks entry (nothing left to
  split) was the actual fix — not a quirk to work around, a leftover
  instruction to a bundler for packages that no longer exist in the graph.

## 5. How it was approached
Didn't rely on instinct for "is this bundle size right" — cross-checked with
a bundler-agnostic signal: recharts stamps a `recharts-` CSS class prefix
onto every DOM element it renders (`recharts-wrapper`, `recharts-surface`,
etc.), and those literal strings survive minification (they're runtime
string values, not identifiers a minifier can rename). Grepping the output
`.js` for `recharts-` gave a yes/no answer independent of chunk-splitting
config or content hashes. Considered trusting the file size number alone
first — rejected, because a single number can't distinguish "recharts is in
there" from "Supabase's realtime/gotrue/postgrest sub-clients are just
legitimately this large," and this app has the second, not the first.

## 6. Where it got stuck
The size investigation above **was** the "got stuck" moment — the arithmetic
coincidence (252.90 KB + 141.20 KB ≈ 394.1 KB, matching the post-cleanup
394.26 KB suspiciously closely) looked like proof recharts was still bundled,
right up until the `recharts-` string grep came back empty on the real
post-cache-clear build. The resolution was to stop reasoning from the
numbers and instead find a signal that couldn't be explained two ways.

## 7. How to verify it yourself
```bash
cd web
npx tsc --noEmit
node ../scripts/check-i18n.mjs
rm -rf node_modules/.vite dist && npm run build
grep -c "recharts-\|maplibregl-" dist/assets/index-*.js   # expect: 0
```
Expected: clean typecheck, "26 keys, vi/en in sync", a clean build with one
main JS chunk + a small Login chunk, and zero recharts/maplibre traces.

## 8. Gotchas / things to remember
- **This changes how every remaining phase in `tasks/INDEX.md` should be
  read.** Any task description that still says "tái dùng" (reuse) something
  from before this point is stale — check `tasks/PROGRESS.md`'s P0-16 entry
  for the specific rewordings already applied (P1-01, P2-03, P3-02, P4-01,
  P5-01, P6-01, P7-01, P8-01, P9-01).
- If a future task's build output looks larger than expected, don't assume
  the number itself is trustworthy — find a content-level signal (a
  library's own literal strings, like `recharts-`) before concluding
  anything about *what's* in a bundle.
- `shared/data/*` (the actual GeoJSON/topology/simulation files) were **not**
  touched by this cleanup — only `web/src` application code. The raw data
  every future phase will re-derive from is still there.
