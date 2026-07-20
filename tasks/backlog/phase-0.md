# Phase 0 — Nền tảng (detailed specs)

Foundation for the whole redesign: new type domains, mock data-service layer,
2-role auth (+guest), new sidebar layout, new routing, new design tokens, and
a reskinned login page. Nothing in Phase 1+ can start until the router/shell
(P0-10) and route guards (P0-13) are green.

---

### P0-14 — Scaffold `tasks/` + `docs/learn-log/`

**Objective.** Stand up the XmindClone-style task/progress/learn-log system so
the rest of this backlog is trackable and teachable.

**Depends on.** _none_.

**Touches.** `tasks/*.md`, `tasks/backlog/phase-0.md`, `docs/LEARNING_LOG.md`,
`docs/learn-log/*.md`.

**Steps.** Create each file per the approved plan's mapping table (XmindClone →
EWATER). No auto-trace capture (EWATER has no equivalent mechanism) — reports
are written by hand from `PROGRESS.md` + the actual diff.

**Done when.** All files exist and cross-link correctly; `tasks/INDEX.md` marks
this task `[x]`.

**Notes.** This is the only task with no code-change learn-log requirement
(it's process scaffolding, not product code) — still worth a short report
explaining the pattern, since it's new to this repo.

---

### P0-15 — Point root `CLAUDE.md` / `PLAN.md` at `tasks/`

**Objective.** Make the task system discoverable from the files every session
already loads, without disturbing existing content (the i18n rules in
`CLAUDE.md`, the data-pipeline/architecture description in `PLAN.md`).

**Depends on.** P0-14.

**Touches.** `D:\EWATER\CLAUDE.md`, `D:\EWATER\PLAN.md`.

**Steps.**
1. Append a short "## Task system & learn-log (web redesign)" section to
   `CLAUDE.md`: one paragraph pointing at `tasks/README.md`, plus a short
   "write a learn-log report for every `web/src/**` change" rule (mirroring
   XmindClone's Learn-Log Rule, but not framed as "the owner is a beginner" —
   keep it neutral: "explain new concepts introduced by the task").
2. Append a short pointer in `PLAN.md` (near the end, don't touch the existing
   sections) noting the web app is undergoing a UI redesign tracked in
   `tasks/`, with a one-line summary of the new stack decisions (still React +
   MapLibre + Supabase, no new framework).

**Done when.** Both files render correctly, existing content untouched, new
sections link to `tasks/README.md`.

---

### P0-01 — Extend `types.ts`

**Objective.** Add the type surface the new pages/services need, without
touching types already consumed by ported modules (`Simulation`, `Topology`,
`AppData`, `LayerKey`, `Selection`, `TraceResult`, etc.).

**Depends on.** _none_.

**Touches.** `web/src/types.ts`.

**Steps.**
1. Add domain types for: forecast (scenario, per-station forecast series,
   confidence table), what-if (scenario config, comparison delta), works
   (structure catalog entry, operating mode), impact (ward-level stat, sector
   breakdown, historical event), report (catalog entry), admin (system status
   row, session row — the parts that are mock; the real Supabase `Profile`
   type already exists in `AuthContext.tsx`, don't duplicate it here).
2. Keep every new type exported individually (no giant namespace object) so
   `data/*.ts` files can import narrowly.

**Done when.**
- `cd web && npx tsc --noEmit` clean.
- No existing type renamed/removed.

**Notes.** This task only adds types — no runtime code, no i18n, nothing to
manually check in the browser.

---

### P0-02 — `web/src/data/` service layer skeleton

**Objective.** Establish the swappable mock/real data-access seam described in
the approved plan: one file per domain, `async` functions, typed returns.

**Depends on.** P0-01.

**Touches.** `web/src/data/{monitoringService,forecastService,whatifService,worksService,impactService,reportService,adminService}.ts`.

**Steps.**
1. `monitoringService.ts` — thin async wrapper around the existing
   `monitoring/stations.ts` builders (`buildMonitoring`), so pages import from
   `data/` uniformly instead of reaching into `monitoring/` directly.
2. The other six files — export the function signatures each later phase will
   need (per `tasks/INDEX.md` deps), bodies can `throw new Error("not
   implemented")` or return an empty/default value until the phase that
   implements them (P4-01, P5-01, P6-01, P7-01, P8-01, P9-01 fill these in).
3. Every function is `async` even where the mock computation is synchronous —
   keeps the call sites future-proof for a real fetch.

**Done when.**
- `cd web && npx tsc --noEmit` clean.
- `monitoringService`'s functions return real data when called against the
  loaded `AppData` (sanity-checked manually, e.g. a temporary console.log
  during dev — remove before marking done).

**Notes.** Do not implement forecast/whatif/works/impact/report/admin logic
here — that's scope creep into later phases; this task is the skeleton only.

---

### P0-03 — Rewrite `i18n/strings.ts` (foundation namespaces)

**Objective.** Replace the old FRMIS-era string dictionary with the new
namespace set, keeping only what's still needed (shared `app.*`/`common.*`
keys, `col.*` table-header keys that many new tables will reuse).

**Depends on.** _none_.

**Touches.** `web/src/i18n/strings.ts`.

**Steps.**
1. Keep: `app.*` (title/subtitle/demo badge/loading/error), `col.*` (generic
   table column labels — reusable across the new DataTables), `common.close`.
2. Remove: `myArea.*`, `role.citizen`, `portal.*`, `dash.*` (old FRMIS
   dashboard keys — Phase 1 writes fresh `dash.*` keys matching the new
   design), `db.*`, `report.*` (old FRMIS report keys — Phase 8 writes fresh
   `report.*` keys).
3. Add now: `nav.*` (9 sidebar item labels), `login.*` (already mostly
   reusable — just update `login.subtitle` wording if needed), `role.*`
   (`role.authority`, `role.admin`, `role.guest`).
4. Leave a comment marking where page-specific namespaces (`dash.*`, `gis.*`,
   `mon.*`, `fc.*`, `whatif.*`, `works.*`, `impact.*`, `report.*`, `admin.*`)
   get added phase-by-phase.

**Done when.** `node scripts/check-i18n.mjs` reports no vi/en mismatch (every
key present in both blocks).

---

### P0-04 — Simplify `AuthContext.tsx` to 2 roles

**Objective.** Drop `citizen` from the `Role` union; `session == null` now
means "guest" rather than "not authenticated yet".

**Depends on.** _none_.

**Touches.** `web/src/context/AuthContext.tsx`.

**Steps.**
1. `export type Role = "authority" | "admin";` (was `"citizen" | "authority" |
   "leadership"`).
2. No other API changes — `signIn`/`signOut`/`session`/`profile`/`loading`
   stay the same shape; `updateHomeLocation` can be deleted (citizen-only,
   no longer needed) once P0-06 removes `MyArea.tsx`, its only caller.
3. The Supabase `profiles.role` column's check constraint (if any) may still
   list `citizen`/`leadership` in the DB — leave the DB schema alone for this
   task (out of scope; only the two seeded demo accounts are `authority`/
   `admin` already per project memory), just don't reference those values in
   TS.

**Done when.**
- `cd web && npx tsc --noEmit` clean.
- No remaining `"citizen"` or `"leadership"` string literal in `web/src`
  (grep check).

---

### P0-05 — `RequireRole.tsx` (2 roles) + `RequireGuestOrRole.tsx`

**Objective.** Route guards matching the new access matrix: most routes need
`authority` or `admin`; `/admin/*` needs `admin` only; `/` needs no role at
all (guest-visible).

**Depends on.** P0-04.

**Touches.** `web/src/components/RequireRole.tsx` (edit),
`web/src/components/RequireGuestOrRole.tsx` (new).

**Steps.**
1. `RequireRole`: same shape as today, just typed against the 2-role union;
   redirect target on rejection becomes `/` (was `/my-area` for citizens —
   that branch is gone).
2. `RequireGuestOrRole`: a thin passthrough — renders children whether
   `profile` is `null` (guest) or has any role. Exists mainly for readability
   at the `/` route in `App.tsx` (P0-10) rather than doing real gating.

**Done when.** Both components compile and are ready to wire into the router
in P0-10.

---

### P0-06 — Delete old-design files

**Objective.** Remove the FRMIS-era pages/components that the new sidebar UI
replaces, per the approved plan's "File bị xóa hẳn" list.

**Depends on.** P0-04, P0-05 (so nothing still imports the `citizen` role or
`updateHomeLocation` before deletion).

**Touches (delete).** `web/src/pages/Portal.tsx`, `web/src/pages/MyArea.tsx`,
`web/src/pages/Dashboard.tsx`, `web/src/pages/Monitor.tsx`,
`web/src/pages/MapPage.tsx`, `web/src/pages/Report.tsx`,
`web/src/pages/Database.tsx`, `web/src/components/TopNav.tsx`,
`web/src/map/PickLocationMap.tsx`, `web/src/network/nearest.ts`.

**Steps.** Delete the files. `App.tsx` will still reference some of them until
P0-10 rewrites it — that's expected; this task intentionally leaves the build
red between P0-06 and P0-10 (both happen in the same sitting in practice).

**Done when.** Files no longer exist. (Full green build is P0-10's job, not
this task's — don't block on tsc here if only `App.tsx`'s stale imports are
the failure.)

---

### P0-07 — `components/layout/Sidebar.tsx`

**Objective.** Left sidebar matching the mockup: brand header + 9 nav items
with icons, role-aware (hides "Quản trị hệ thống" unless `admin`).

**Depends on.** P0-05.

**Touches.** `web/src/components/layout/Sidebar.tsx` (new), `web/src/components/Icon.tsx` (add any missing icons: gis/monitor-realtime/forecast/whatif/works/impact/reports/admin — reuse existing `dashboard`/`map`/`monitor`/`report`/`database`/`chart` glyphs where they already fit rather than inventing near-duplicates).

**Steps.**
1. Static nav config: array of `{ to, labelKey, icon, minRole? }`.
2. Render `NavLink` per item; filter out `minRole: "admin"` items when
   `profile?.role !== "admin"`.
3. Brand header: small water-drop/home icon + "VĨNH LONG" + subtitle line
   (bilingual via `t()`), mirroring the mockup's top-left block — no new
   image asset, reuse the existing inline-SVG icon approach.

**Done when.** Sidebar renders the correct item set for guest (nothing, since
guest never sees the shell — see P0-10) / authority (8 items) / admin (9
items); active route highlighted.

---

### P0-08 — `components/layout/TopBar.tsx`

**Objective.** Top bar: date/time, mock weather chip, notification bell,
help, avatar + role badge, `LangToggle`.

**Depends on.** _none._

**Touches.** `web/src/components/layout/TopBar.tsx` (new).

**Steps.**
1. Date/time: `new Date()` formatted, no live-ticking clock needed (static per
   render is fine for a demo — a `setInterval` refresh is a nice-to-have, not
   required).
2. Weather chip: static mock (icon + °C + label) — real weather is out of
   scope (the old app's Open-Meteo integration was for a different feature
   and isn't being ported here; note this as a simplification, don't silently
   wire a new external API call without flagging it first).
3. Bell/help: icon buttons, can be inert (no dropdown content) for now — a
   later phase may wire the bell to Dashboard's alert list if time allows.
4. Avatar area: reuse the `user-chip`/`role-badge` pattern from the old
   `TopNav.tsx` (already deleted in P0-06, but the CSS classes are still fair
   game to reintroduce under new names in P0-11) — show nothing / a generic
   "Khách" label when `profile == null`.

**Done when.** Renders correctly for guest and logged-in states; `LangToggle`
still switches language app-wide.

---

### P0-09 — `components/layout/PageHeader.tsx`

**Objective.** Shared "TAB N. TÊN TRANG" header + optional sub-tab row, used
by every page from Phase 1 onward.

**Depends on.** _none._

**Touches.** `web/src/components/layout/PageHeader.tsx` (new).

**Steps.**
1. Props: `title: string`, `subtitle?: string`, `tabs?: { to: string; label:
   string }[]` (rendered as `NavLink`s when present), `right?: ReactNode` (for
   page-specific controls like date pickers or scenario dropdowns).
2. Keep it dumb/presentational — no data fetching.

**Done when.** Component compiles and is generic enough to cover both
single-page (Dashboard, GIS, What-if) and sub-tabbed (Monitoring, Forecast,
Works, Impact, Reports, Admin) layouts without per-page CSS overrides.

---

### P0-10 — `AppShell.tsx` + new `App.tsx` router

**Objective.** Wire Sidebar + TopBar + routed content together, and replace
the whole router with the new access matrix.

**Depends on.** P0-06, P0-07, P0-08, P0-09.

**Touches.** `web/src/components/layout/AppShell.tsx` (new), `web/src/App.tsx`
(rewrite).

**Steps.**
1. `AppShell`: `<div class="shell"><Sidebar/><div class="shell-main"><TopBar/><main class="page-root"><Outlet/></main></div></div>`.
2. Router: `/login` outside the shell (unchanged pattern); everything else
   inside a shell-wrapped layout route.
3. `/` — wrapped in `RequireGuestOrRole` only (no login required), renders
   `Dashboard` (still a placeholder page until Phase 1).
4. `/gis-map`, `/monitoring/:tab`, `/forecast/:tab`, `/whatif`, `/works/:tab`,
   `/impact/:tab`, `/reports/:tab` — wrapped in `RequireAuth` + `RequireRole
   roles={["authority","admin"]}`.
5. `/admin/:tab` — `RequireAuth` + `RequireRole roles={["admin"]}`.
6. All page components lazy-loaded (`React.lazy`), matching the existing
   pattern — even though most are still placeholders returning `<div>TODO
   Phase N</div>` until their phase lands.
7. `*` → `Navigate to="/"`.

**Done when.** `npm run dev` serves the app; every route in the matrix
resolves to *something* (placeholder or real) without a console error;
`RequireAuth`'s existing loading/redirect behavior still works.

---

### P0-11 — Rewrite `styles.css`

**Objective.** New design tokens (sidebar/topbar/stat-card/status-pill/
alert-list/weather-strip) replacing the FRMIS topnav/portal/my-area blocks,
while keeping the still-relevant map/panel/sim-bar/modal/datatable sections
(those aren't tied to the old page layout).

**Depends on.** P0-10.

**Touches.** `web/src/styles.css`.

**Steps.**
1. Delete: `.topnav*`, `.portal-*`, `.module-tile`, `.my-area-*`,
   `.pick-map`, `.change-location-btn` (all FRMIS/citizen-only, unreachable
   after P0-06).
2. Keep as-is: `.panel`/`.layer-panel`/`.feature-info`/`.sim-bar`/
   `.modal*`/`.datatable`/`.dt-*`/`.chart-btn`/`.status-pill`/`.chart-modal*`/
   `.step-control`/`.login-*` (login gets restyled in P0-12, not deleted
   here) — these serve the map engine, generic table, and chart components
   that are being ported, not the old page shell.
3. Add: `.shell`/`.shell-main`/`.sidebar`/`.sidebar-nav`/`.topbar2` (or rename
   in place if reusing `.topbar`), `.page-header`/`.page-subtabs`,
   `.stat-card2` (icon + value + trend arrow — extend rather than replace the
   existing `.stat-card` if the shape is compatible), `.alert-list`,
   `.weather-strip`, `.donut-card` (already covered by existing chart
   components, verify no duplicate).
4. Reuse `#0f2a43` as the sidebar/topbar base color (already the app's navy);
   introduce the flood-depth legend palette (light blue → dark navy/red) as a
   small named scale since multiple pages (Dashboard, GIS, Impact) reuse it.

**Done when.** `AppShell` renders with the new sidebar/topbar visually
distinct from the old horizontal nav; no dangling class references (grep for
deleted class names across `web/src`).

---

### P0-12 — Reskin `pages/Login.tsx`

**Objective.** Match `page_login.png`'s layout (full-bleed background,
centered translucent card, logo, title, username/password, submit, footer
credit line) with Vĩnh Long branding instead of the source image's
"Vfass/Đà Nẵng/WATEC" branding.

**Depends on.** P0-11.

**Touches.** `web/src/pages/Login.tsx`, `web/src/styles.css` (`.login-*`
section extended, not replaced).

**Steps.**
1. Keep the existing `signIn` wiring (email/password via Supabase) — only the
   visual shell changes.
2. Background: a gradient (reuse `.login-page`'s existing gradient, or swap
   in a CSS-only "cityscape" gradient — do **not** fetch/embed a real Vĩnh
   Long photo without the user supplying one; a gradient is the honest
   default here) instead of a photographic background.
3. Card: title "HỆ THỐNG GIÁM SÁT NGẬP LỤT TỈNH VĨNH LONG" (bilingual —
   add the English variant too), small water-drop icon (reuse `Icon`
   component, no new logo asset), username/password fields unchanged,
   submit button unchanged.
4. Remove any literal "Vfass"/"WATEC"/Đà Nẵng references — none should exist
   in code, this is just a reminder for the visual review step.

**Done when.** `/login` visually matches the new layout; sign-in/sign-out
still functions end-to-end against Supabase.

---

### P0-13 — Route guards match the access matrix

**Objective.** Final integration check for Phase 0: verify the 3-tier access
matrix from the plan holds for every route.

**Depends on.** P0-10, P0-12.

**Touches.** No new files — this is a verification task, though it may
surface small fixes in `App.tsx`/`RequireRole.tsx`/`RequireGuestOrRole.tsx`.

**Steps.** Manually test in `npm run dev`:
1. No session → `/` shows Dashboard placeholder; any other route → redirected
   to `/login`.
2. Sign in as `authority` → all routes except `/admin/*` load; `/admin/*` →
   redirected to `/`.
3. Sign in as `admin` → every route loads including `/admin/*`.
4. Sign out → back to guest state; `LangToggle` still works throughout.

**Done when.** All four checks pass. This closes out Phase 0 — Phase 1 tasks
can now start.
