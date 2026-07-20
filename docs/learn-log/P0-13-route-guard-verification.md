# P0-13 — Route guard matrix verification (closes Phase 0)

**Date:** 2026-07-20 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

## 1. In one sentence
Traced every cell of the Guest/Authority/Admin × 9-route access matrix
through the actual guard components' code to confirm the logic is correct,
since no headless browser was available to click through it for real.

## 3. The problem
This task's whole job was **verification**, not new code. The interesting
part is *how* to verify routing/auth logic without a browser.

## 4. Concepts introduced

### Static code-trace as a verification method, and its limits
- **Plain definition:** instead of clicking through the app, follow each
  guard component's `if`/`return` branches by hand for every input
  (role × route), the way you'd hand-trace a small function to check its
  logic.
- **Why it shows up here:** with no `chromium-cli`/Playwright available in
  this environment, it's the only rigorous option left — better than "it
  compiles, ship it," worse than an actual click-through. It **proves the
  logic is internally consistent** (the right component returns the right
  `<Navigate>`/`<Outlet>` for each case) but it does **not** prove the
  browser actually renders what that logic implies, or that a real click
  fires the handler that triggers it. Both matter, and only one was checked
  here — said plainly in the report rather than blurring the line.

## 5. How it was approached
Confirmed no browser tool exists (not a guess): searched `ToolSearch` for
"chromium browser screenshot" (nothing), and a filesystem search for
`chromium-cli`/`playwright` found nothing installed. Rejected quietly
lowering the bar to "tsc passed" — that was already true *before* this task
and doesn't touch the actual question (does the access matrix hold).

## 6. Where it got stuck
No real snags in the trace itself. One incidental find while reading through
`web/index.html` for unrelated reasons: its `<title>` still read the old
FRMIS-era branding — fixed it, then the user tweaked the wording further by
hand mid-session (their call, left as-is).

## 7. How to verify it yourself
The six traced cases (see PROGRESS.md for the full list) are re-checkable by
reading `App.tsx` + `RequireAuth.tsx` + `RequireRole.tsx` +
`RequireGuestOrRole.tsx` together. To go further than this task did, run:
```bash
cd web && npm run dev
```
and manually try: no login → `/`; no login → `/gis-map` (expect redirect to
`/login`); sign in as the `authority` demo account → `/admin/overview`
(expect redirect to `/`); sign in as `admin` → same route (expect it loads).

## 8. Gotchas / things to remember
- **A green `tsc`/`build` is not proof the router logic is correct** — it
  only proves the code is well-typed and bundles. This task's trace is the
  actual evidence for the access matrix; don't conflate the two in future
  reports.
- If a browser-automation tool becomes available later, this task should be
  redone for real rather than assumed still valid — the trace is a stand-in,
  not a permanent substitute.
