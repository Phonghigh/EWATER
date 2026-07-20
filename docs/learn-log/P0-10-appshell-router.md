# P0-10 — AppShell.tsx + new App.tsx router

**Date:** 2026-07-20 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

## 1. In one sentence
Rebuilt the router so the new sidebar shell wraps every page (guest included)
while a separate, independently-nestable auth gate still protects everything
except the Dashboard.

## 2. Where it fits
Closes out the routing half of Phase 0. After this, `npm run dev` serves a
real (if unstyled/placeholder) app again — the first point since P0-06's
deletions that the whole tree compiles and runs.

## 3. The problem
The old app had exactly two states: logged-in-with-a-role, or redirect to
`/login`. The new access model has three: Guest (sees Dashboard, nothing
else), Authority, Admin (Authority + `/admin/*`). Guest isn't "not logged in
yet" — it's a real, permanent, supported state. That meant the *shell*
(sidebar/topbar) and the *auth gate* could no longer be the same routing
layer, the way the old app's `<RequireAuth/>` used to double as both.

## 4. Concepts introduced

### Two independent nested layout routes doing two different jobs
- **Plain definition:** React Router lets you nest a `<Route>` whose
  `element` renders `<Outlet/>` inside another one — each layer adds its own
  wrapper/gate around whatever's beneath it.
- **Why it shows up here:** `AppShell` (renders Sidebar+TopBar+`<Outlet/>`)
  is the *outer* layer — it wraps literally everything, `/` included.
  `RequireAuth` (renders `<Outlet/>` or redirects to `/login`) is nested
  *inside* `AppShell`, but **only** around the routes that need it — `/` sits
  as a sibling route directly under `AppShell`, not under `RequireAuth`. Two
  separate concerns (layout vs. access) that used to be conflated in one
  wrapper are now two independent, composable layers.

### A "no-op" component making implicit behavior explicit (continued from P0-05)
`RequireGuestOrRole` wrapping the `/` route's element does nothing at
runtime — its only job is to make "yes, deliberately open to guests" visible
next to the one route that skips `RequireAuth`, so a future reader doesn't
mistake the missing gate for a bug.

## 5. How it was approached
Considered keeping the old single-wrapper shape and just special-casing `/`
inside it (e.g. `if (path === "/") return children` inside `RequireAuth`
itself) — rejected because it couples a layout concern (what renders) to a
routing concern (which path this is), and doesn't extend cleanly if a second
guest-visible route were ever added. The two-independent-layers shape scales
to that case for free (just don't nest the new route under `RequireAuth`).

## 6. Where it got stuck
No real snags — `tsc`/`npm run build` were clean on the first pass. The one
thing worth recording: **browser-driven verification wasn't possible in this
environment** (no `chromium-cli`/Playwright installed, `find` for either
turned up nothing). Fell back to `tsc` + `npm run build` + a `curl` 200-check
against the dev server — real but weaker evidence than a screenshot. Flagged
explicitly in PROGRESS.md rather than silently skipping the check.

## 7. How to verify it yourself
```bash
cd web
npx tsc --noEmit
npm run build
npm run dev &
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/
```
Expected: no tsc errors, a successful `dist/` build, and `200` from curl.

## 8. Gotchas / things to remember
- If you add a new page that should be guest-visible, do **not** nest it
  under the `<Route element={<RequireAuth />}>` block — add it as a sibling
  directly under `<Route element={<AppShell />}>`, same as `/`.
- `/admin/:tab` uses `roles={["admin"]}`, not the shared `STAFF_ROLES`
  constant — don't accidentally widen it to authority when copy-pasting a
  route block for a new admin-only page.
