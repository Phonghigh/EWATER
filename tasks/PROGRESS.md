# Progress log

Append-only. Newest at the bottom. One section per completed task.
Written per [ROUTINE.md](ROUTINE.md) step 7.

Format:

```
## <YYYY-MM-DD> — <task-id> <title>
- changed: <what>
- files: <key paths>
- verify: <tsc/check-i18n/build result>
- follow-up: <anything noticed, or none>
```

---

<!-- entries below -->

## 2026-07-20 — P0-14 Scaffold tasks/ + docs/learn-log/
- changed: created the XmindClone-style task system for the web redesign: `tasks/{README,ROUTINE,INDEX,PROGRESS,BLOCKERS,_TEMPLATE}.md`, `tasks/backlog/phase-0.md`, and `docs/LEARNING_LOG.md` + `docs/learn-log/{README,_TEMPLATE}.md`. Adapted from `D:\project\XmindClone`'s `tasks/`/`docs/learn-log/` pattern, scoped to this web-redesign backlog only (no new test framework introduced — verify steps use the repo's actual tooling: tsc, `check-i18n.mjs`, `npm run build`).
- files: `tasks/README.md`, `tasks/ROUTINE.md`, `tasks/INDEX.md`, `tasks/PROGRESS.md`, `tasks/BLOCKERS.md`, `tasks/_TEMPLATE.md`, `tasks/backlog/phase-0.md`, `docs/LEARNING_LOG.md`, `docs/learn-log/README.md`, `docs/learn-log/_TEMPLATE.md`
- verify: files created and readable; no code changed yet so no tsc/build/check-i18n to run.
- follow-up: none.

## 2026-07-20 — P0-15 Point root CLAUDE.md/PLAN.md at tasks/
- changed: appended a "Task system & learn-log" section to root `CLAUDE.md` (after the existing i18n rules, untouched) explaining the backlog/routine/learn-log pointers and the per-task learn-log rule. Appended a "§9 Web redesign in progress" section to root `PLAN.md` noting the redesign supersedes the old FRMIS page structure (§4-5) and pointing at `tasks/`.
- files: `D:\EWATER\CLAUDE.md`, `D:\EWATER\PLAN.md`
- verify: manual read-through; existing sections in both files unchanged.
- follow-up: none.

## 2026-07-20 — P0-01 Extend types.ts
- changed: added a new-page domain type block to `types.ts` (forecast, what-if, works, impact, report, admin-mock) plus two shared helpers, `DeltaStat` (a value + its Δ vs. a reference reading) and `ScenarioImpactResult` (the 4-metric flood-impact summary reused by forecastService/whatifService/impactService). Existing types (`AppData`, `Simulation`, `Topology`, `LayerKey`, `Selection`, `TraceResult`, etc.) untouched.
- files: `web/src/types.ts`
- verify: `cd web && npx tsc --noEmit` — clean, no errors.
- follow-up: none.

## 2026-07-20 — P0-02 data/ service layer skeleton
- changed: added `web/src/data/{monitoringService,forecastService,whatifService,worksService,impactService,reportService,adminService}.ts`. `monitoringService` is a real thin async wrapper around the existing `monitoring/stations.ts` `buildMonitoring` (pages should still prefer the memoized `useMonitoring()` hook inside components); the other six export typed `async` function signatures that `throw new Error("not implemented yet (task Pn-01)")` until their phase lands.
- files: `web/src/data/*.ts` (7 new files)
- verify: `cd web && npx tsc --noEmit` — clean.
- follow-up: none.

## 2026-07-20 — P0-03 Rewrite i18n/strings.ts foundation namespaces
- changed: rewrote `strings.ts` for the new sidebar UI. Removed old-page-only keys (`myArea.*`, `role.citizen`/`role.leadership`, `portal.*`, old `dash.*`/`db.*`/`report.*` FRMIS-dashboard/database/report keys). Added `nav.*` (9 sidebar items + brand title/subtitle), `role.guest`/`role.authority`/`role.admin`, `login.systemTitle`/`login.username`. Kept `app.*`, `col.*`, `common.close`, and `map.*`/`feature.*`/`search.*`/`sim.*`/`area.*`/`gate.*`/`monitor.*` since the ported map engine + panels still reference them until Phase 2/3 fold them into `gis.*`/`mon.*`.
- files: `web/src/i18n/strings.ts`
- verify: `node scripts/check-i18n.mjs` — "OK - 114 keys, vi/en in sync"; `cd web && npx tsc --noEmit` — clean.
- follow-up: old pages (Portal/MyArea/Dashboard/Monitor/Report/Database, deleted in P0-06) still reference some removed keys until that deletion lands — harmless (unused-key fallback, not a compile error) but worth deleting together in the same sitting.

## 2026-07-20 — P0-04 Simplify AuthContext.tsx to 2 roles
- changed: `Role` union narrowed from `"citizen" | "authority" | "leadership"` to `"authority" | "admin"`; removed `updateHomeLocation` (its only caller, `MyArea.tsx`, is deleted in P0-06). `Profile.home_lng`/`home_lat` fields left as-is (still valid DB columns, just unused now). `session == null` is now a documented "guest" state, not just "loading".
- files: `web/src/context/AuthContext.tsx`
- verify: not run yet — `MyArea.tsx`/`TopNav.tsx`/`RequireRole.tsx` still reference `"citizen"`/`updateHomeLocation` until P0-05/P0-06 land in this same sitting; `tsc` will be checked once those are done.
- follow-up: none (expected transient red state, by design — see tasks/backlog/phase-0.md P0-06).

## 2026-07-20 — P0-05 RequireRole (2 roles) + new RequireGuestOrRole
- changed: `RequireRole.tsx` redirect target simplified to always `/` (was `/my-area` for citizens — that branch no longer exists). Added `RequireGuestOrRole.tsx`, a documentation-purpose passthrough for the one route guests can see.
- files: `web/src/components/RequireRole.tsx`, `web/src/components/RequireGuestOrRole.tsx`
- verify: not run yet — same transient-red state as P0-04, resolves after P0-06.
- follow-up: none.

## 2026-07-20 — P0-06 Delete old-design files
- changed: deleted `pages/{Portal,MyArea,Dashboard,Monitor,MapPage,Report,Database}.tsx`, `components/TopNav.tsx`, `map/PickLocationMap.tsx`, `network/nearest.ts`.
- files: 10 files removed
- verify: `cd web && npx tsc --noEmit` now shows the *expected* errors, all confined to `App.tsx` (stale imports of the deleted files + old 3-role checks) — no errors anywhere else in the tree, confirming the deletion was clean. App.tsx gets rewritten in P0-10.
- follow-up: App.tsx stays red until P0-07..P0-10 land in this sitting.

## 2026-07-20 — P0-07 Sidebar.tsx
- changed: added `components/layout/Sidebar.tsx` — brand header + 9-item nav list, filtered to hide "Quản trị hệ thống" for non-admins. Extended `Icon.tsx` with 8 new glyphs (`cloud-rain`, `sliders`, `alert-triangle`, `settings`, `bell`, `help-circle`, `user`, `menu`) needed by the sidebar now and TopBar next.
- files: `web/src/components/layout/Sidebar.tsx`, `web/src/components/Icon.tsx`
- verify: `cd web && npx tsc --noEmit` — no new errors beyond the already-expected `App.tsx` ones (confirmed via `grep -v App.tsx`, only wrapped continuation lines of the same pre-existing errors remained).
- follow-up: not yet mounted anywhere (App.tsx/AppShell wire it up in P0-10); default sub-tab route slugs (`/monitoring/overview` etc.) chosen now, must match the index-redirects P0-10/later phases add. Also revised the plan mid-flight: Sidebar is now **always** mounted (guests included) rather than hidden for guests — simpler than a separate no-shell layout, and clicking a locked item just bounces to /login via the existing RequireAuth, same as any normal app.

## 2026-07-20 — P0-08 TopBar.tsx
- changed: added `components/layout/TopBar.tsx` — date, static mock weather chip, bell/help icon buttons (inert for now), `LangToggle`, and a user chip (name + role badge + logout) that falls back to a "Khách"/Guest badge when `profile == null`.
- files: `web/src/components/layout/TopBar.tsx`
- verify: `cd web && npx tsc --noEmit` — no new errors.
- follow-up: bell/help buttons have no dropdown content yet (noted as a possible later nice-to-have, not required); real weather API intentionally not wired (flagged as a simplification, not silently added).

## 2026-07-20 — P0-09 PageHeader.tsx
- changed: added `components/layout/PageHeader.tsx` — generic `title` + optional `tabs`/`right` presentational header, reused by every page from Phase 1 onward (single-page layouts just omit `tabs`).
- files: `web/src/components/layout/PageHeader.tsx`
- verify: `cd web && npx tsc --noEmit` — no new errors.
- follow-up: none.

## 2026-07-20 — P0-10 AppShell.tsx + new App.tsx router
- changed: added `components/layout/AppShell.tsx` (Sidebar+TopBar+`<Outlet/>`) and `pages/ComingSoon.tsx` (shared placeholder for routes not yet built, using new `common.comingSoon` i18n key). Rewrote `App.tsx`: `/` is wrapped in `RequireGuestOrRole` (not `RequireAuth`) so guests see it; every other route nests under `RequireAuth`→`RequireRole`; `/admin/*` requires `admin` specifically; `/monitoring`, `/forecast`, `/works`, `/impact`, `/reports`, `/admin` each redirect to their `.../overview` sub-tab. All 8 non-Dashboard pages currently render `<ComingSoon title=.../>` until their phase lands.
- files: `web/src/App.tsx`, `web/src/components/layout/AppShell.tsx`, `web/src/pages/ComingSoon.tsx`, `web/src/i18n/strings.ts` (+`common.comingSoon`)
- verify: `cd web && npx tsc --noEmit` clean; `npm run build` clean (95 modules, `dist/` output produced); dev server (`npm run dev`) responded `200` at `/` via `curl`. Browser-driven visual/console verification (chromium-cli / Playwright) is **not available in this environment** — deferred to after P0-11/P0-12 land, when the shell actually has styling worth screenshotting; tsc+build+curl are the verification signal for this task, consistent with the "no Playwright in this repo" note in tasks/README.md.
- follow-up: real visual check still owed before Phase 0 is considered fully verified (P0-13).

## 2026-07-20 — P0-11 Rewrite styles.css
- changed: removed all FRMIS-era, now-dead CSS (`.app`/`.page-root`/`.topbar`/`.about-btn`, `.topnav*`, `.content-page`/`.page-head`/`.subtabs*`, `.mini-table`/`.quick-links`, `.portal-*`, `.report-controls`/`.report-summary`/`.report-chart`, `.map-page`/`.map-topbar`/`.map-main`, `.user-chip`, `.pick-map`/`.my-area-*`/`.change-location-btn`). Added the new shell: `.shell`/`.shell-main`, `.sidebar*` (navy `--navy` token, brand header, nav links w/ active state), `.topbar2*` (date/weather/icon-btn/user chip), `.page-header2*`/`.page-subtabs2*`, `.content-page2`, reskinned `.login-*` (gradient using the new CSS custom properties). Kept everything the ported map engine/panels/`DataTable`/`Cards`/`ChartModal`/`StepControl` still reference (`.panel` family, `.datatable`/`.dt-*`, `.card`/`.stat-*`, `.chart-modal*`, `.status-pill`, `.demo-badge`, `.lang-toggle`, `.role-badge`/`.logout-btn`).
- files: `web/src/styles.css`
- verify: `cd web && npx tsc --noEmit` clean; `npm run build` clean (CSS bundle 12.67 kB, down from the old 15.65 kB despite adding the new shell — net removal of dead rules outweighed additions); grepped `web/src` for any remaining JSX reference to a deleted class name (`app`, `page-root`, `topbar`, `topnav`, `content-page`, `page-head`, `subtabs`, `mini-table`, `quick-links`, `portal-`, `report-controls`, `map-page`, `map-topbar`, `user-chip`, `pick-map`, `my-area`, `change-location-btn`, `about-btn`) — only false-positive substring matches from new class names (`content-page2`, `page-root2`, `topbar2`, `page-header2-top`) found, confirming no dead references remain.
- follow-up: real browser screenshot still owed (P0-13) — same environment limitation noted in P0-10.

## 2026-07-20 — P0-12 Reskin Login.tsx
- changed: restyled the login card (brand icon + `login.systemTitle` in place of the old plain `app.title`, `login-footer` credit line) using the new `.login-*` CSS from P0-11. Kept the field labeled/typed as email (not "Tên đăng nhập" per the source mockup) since the real Supabase auth requires an actual email address — a deliberate deviation from the mockup for correctness, not an oversight. Removed the stale comment referencing the deleted `RoleHome`/citizen redirect logic. Removed an unused `login.username` key added speculatively in P0-03 (never ended up needed).
- files: `web/src/pages/Login.tsx`, `web/src/i18n/strings.ts` (removed unused key)
- verify: `node scripts/check-i18n.mjs` OK (114 keys); `cd web && npx tsc --noEmit` clean; `npm run build` clean.
- follow-up: none.

## 2026-07-20 — P0-13 Route guard matrix verification (closes Phase 0)
- changed: no code changes except a small polish catch — `web/index.html`'s `<title>` still said "Vĩnh Long FRMIS" (stale branding from the old portal); updated it, then the user adjusted the wording further by hand to "Vĩnh Long FRIMS" while this session was running — left as the user set it.
- files: `web/index.html`
- verify: **static code-trace** through `App.tsx`/`RequireAuth.tsx`/`RequireRole.tsx`/`RequireGuestOrRole.tsx` for all matrix cells: (1) guest→`/` renders (RequireGuestOrRole passthrough); (2) guest→any other route redirects to `/login` (RequireAuth); (3) authority→staff routes render, →`/admin/*` redirects to `/` (RequireRole roles mismatch); (4) admin→everything renders; (5) signed-in user visiting `/login` redirects to `/` (Login.tsx's own `session` check); (6) unknown path→`/` (catch-all route). All six trace correctly against the access matrix. Also smoke-tested via `curl` against the dev server for `/`, `/login`, `/gis-map`, `/monitoring/overview`, `/admin/overview`, `/xyz` — all `200` (expected for a client-routed SPA; proves no server crash, doesn't exercise the client-side auth logic). **No headless-browser tool available in this environment** (`chromium-cli`/Playwright absent, confirmed via `ToolSearch` and a filesystem search) — real interactive/visual verification (does the sidebar actually render correctly, does clicking a locked nav item actually redirect, does sign-in/sign-out actually flip the guest/authority view) is a genuine gap, not silently skipped.
- follow-up: **recommend a manual browser check by the user** before treating Phase 0 as fully proven — open `npm run dev`, try the guest/authority/admin paths by hand. If a `chromium-cli`/Playwright-capable environment becomes available later, redo this task's verification for real.

**Phase 0 (Nền tảng) complete: 15/15 tasks done.** `npm run dev`/`npm run build`/`node scripts/check-i18n.mjs` all clean throughout. Phase 1 (Dashboard) is next.

## 2026-07-20 — P0-16 Delete all currently-unused code, reverse the "port/pre-scaffold" policy
- changed: user explicitly asked to delete every file in `web/src` not currently used by the live app, with no exception for things kept "for future reuse" — they want to write everything themselves to fully own the codebase going forward. This **reverses** Phase 0's original architecture decision (the "port nguyên vẹn" list and the `data/` service-skeleton pattern from P0-02).
  - Deleted entirely: `map/` (MapView.tsx, layers.ts, mapRegistry.ts), `monitoring/` (rng/stations/aggregate/windows/useMonitoring.ts), `network/trace.ts`, `panels/` (FeatureInfo/LayerPanel/SearchBox/SimulationPanel.tsx), `sim/simEngine.ts`, `state/store.ts`, `data/` (all 7 service stub files from P0-02), and unused components `Cards.tsx`, `ChartModal.tsx`, `DataTable.tsx`, `DemoBadge.tsx`, `RainTideChart.tsx`, `StepControl.tsx`, `csv.ts`.
  - Verified each deletion candidate by grep for real import sites first (not by guessing) — confirmed zero live references before removing anything.
  - Pruned `types.ts` back to just `AppData` + its structural sub-types (still genuinely used by `loadData.ts`); removed `LayerKey`/`Selection`/`TraceResult` (map-engine-only) and the whole P0-01 forecast/whatif/works/impact/report/admin domain-type block (only consumed by the now-deleted `data/*.ts` stubs).
  - Pruned `i18n/strings.ts` from 114 keys down to 26 — removed every namespace tied to deleted code (`monitor.*`, `col.*`, `area.*`, `gate.*`, `map.*`, `feature.*`, `search.*`, `sim.*`, `dash.*`, `common.close`), kept only what the live Sidebar/TopBar/Login/ComingSoon tree calls.
  - Pruned `Icon.tsx` from 24 icon defs down to 14 (only the ones actually rendered anywhere).
  - Rewrote `styles.css` down to just the shell/sidebar/topbar/page-header/login/empty-state/lang-toggle/role-badge rules — dropped the whole `.panel`/`.datatable`/`.card`/`.chart-modal`/`.sim-bar`/`.modal` family that was being kept "because the ported engine needs it," since that engine is now gone too.
  - Found and fixed a real latent bug while investigating bundle size: `vite.config.ts` had a `manualChunks: { maplibre: [...], recharts: [...] }` that was still forcing a genuine ~141 KB `recharts` chunk into the shipped build even though nothing imported it anymore (confirmed via a from-scratch build with `node_modules/.vite` + `dist` cleared, then grepping the output for recharts' CSS-class-prefix strings before/after removing the config — 0 matches after). Removed the manualChunks block entirely.
- files: `web/src/{map,monitoring,network,panels,sim,state,data}/*` (deleted), `web/src/components/{Cards,ChartModal,DataTable,DemoBadge,RainTideChart,StepControl,csv}.ts(x)` (deleted), `web/src/types.ts`, `web/src/i18n/strings.ts`, `web/src/components/Icon.tsx`, `web/src/styles.css`, `web/vite.config.ts`
- verify: `node scripts/check-i18n.mjs` → "OK - 26 keys, vi/en in sync"; `cd web && npx tsc --noEmit` clean; `npm run build` clean after a full cache clear (`rm -rf node_modules/.vite dist`) — single `index-*.js` chunk (394 KB / 114 KB gzip, confirmed via grep to be React+ReactDOM+react-router-dom+@supabase/supabase-js only, no recharts/maplibre strings present) + a small lazy `Login.js` chunk + a 4.9 KB CSS bundle (down from the old FRMIS-era 15.65 KB).
- **Policy change for all remaining phases (recorded here, not just this task):** no more "port for later" or pre-built service skeletons. `tasks/INDEX.md` P1-01/P4-01/P5-01/P6-01/P7-01/P8-01/P9-01 had their `deps: P0-02` removed (P0-02 no longer exists) and now say "viết mới hoàn toàn" (write fully from scratch) even where the same *logic* existed before deletion (e.g. Phase 3's rain-station derivation from manholes+simulation, Phase 2's MapLibre setup) — later phases will re-derive these from the raw `shared/data/*` files themselves rather than reusing anything from this session's now-deleted first pass.
- follow-up: none — this is the new steady-state policy, not a one-off.

## 2026-07-20 — P1-01 dashboardService aggregate (opens Phase 1)
- changed: added `web/src/data/dashboardService.ts`, a framework-free data module computing the 6 Dashboard headline stats from `AppData` + a simulation step index: `floodPointCount`/`floodedRouteCount` (manholes/links at/above the `surcharge` fill threshold) + deltas vs. the 06:00 snapshot (step 24), `maxRainfallMm` (trailing 24h sum of the area-average rainfall series — no per-station breakdown exists in source data, so no station name is attributed), `maxWaterLevel` (derived per-manhole from `invertLevel + fill*(groundLevel-invertLevel)`, intentionally allowed to exceed `groundLevel` when `fill > 1.0` — that's flood depth above ground, not a bug), and `pumpsAndGates` (documented placeholder: `outlets.geojson` has no type field, so pump/gate is a deterministic muid-parity split, active/closed a function of current rainfall intensity — flagged inline for replacement once Phase 6's real asset registry lands). Also created `tasks/backlog/phase-1.md` (didn't exist yet) with the full P1-01..P1-07 spec, deriving detail from the Dashboard mockup (`doc/template/Demo.pdf - Page 1 of 17.png`) and the actual `shared/data/` schema.
- files: `web/src/data/dashboardService.ts`, `tasks/backlog/phase-1.md`
- verify: `cd web && npx tsc --noEmit` clean; `node scripts/check-i18n.mjs` OK (26 keys, unaffected — no UI/strings touched); `cd web && npm run build` clean. Sanity-checked real numbers with a throwaway `node -e` script against `shared/data/*.json`: step 40 (storm peak) → 120 flood points / 213 flooded routes vs. 0 at dry steps 0/24/60/96, matching the rainfall hydrograph shape.
- follow-up: no UI yet — P1-02 (header + 6 stat-cards) consumes this service next.

## 2026-07-20 — P0-17/P0-18/P0-19 Chuyển FE sang đọc Supabase, bỏ mock JSON tĩnh
- changed: người dùng yêu cầu (sau khi cùng rà audit dữ liệu tĩnh/động và migrate/import dữ liệu thật lên Supabase trong phiên) chuyển toàn bộ FE sang đọc dữ liệu qua Supabase, không còn bundle `shared/data/*.json`. Đã chốt kiến trúc: gọi thẳng Supabase qua `supabase-js` (không dựng backend riêng), đổ nguyên trạng dữ liệu động mock hiện có vào DB (nội dung vẫn demo, chỉ đổi nơi lưu), áp dụng cho toàn bộ roadmap P1–P9. Kế hoạch đầy đủ: `C:\Users\22521\.claude\plans\quay-l-i-log-c-a-bright-snail.md`.
  - **P0-17**: migration `20260720170000_expose_for_client.sql` (tạo view `*_geojson` cho mọi bảng có cột `geom`, dùng `ST_AsGeoJSON`) + `20260720171500_fix_geojson_view_aliases.sql` (sửa alias cột về đúng camelCase mà `dashboardService.ts` đã viết sẵn — `fromNode`/`toNode`/`invertLevel`/`groundLevel`/`topoId`/`riverName`/`nodes`, thay vì snake_case gốc của Postgres). Phát hiện quan trọng: role `anon`/`authenticated` đang có cả INSERT/UPDATE/DELETE/TRUNCATE trên mọi bảng GIS/simulation (lỗ hổng thật từ cấu hình auto-expose cũ) — đã `REVOKE`, chỉ giữ SELECT; verify bằng anon key: SELECT view OK, INSERT bị từ chối (401/permission denied). Sinh `web/src/lib/database.types.ts` bằng `supabase gen types typescript`.
  - **P0-18**: `data-pipeline/import_dynamic_data.py` (mới) đổ `simulation.json`→`simulation_runs`(1)+`simulation_node_fill`(834), `rain-forecast.json`→`rain_forecasts`(1)+`rain_forecast_points`(72), `tide-demo.json`→`tide_scenarios`(1)+`tide_levels`(72), `flood-zones.geojson`→`flood_zones`(2, gắn `run_id`). Số dòng khớp 100% nguồn.
  - **P0-19**: viết lại `web/src/loadData.ts` — query Supabase (view `*_geojson` + bảng `simulation_runs`/`rain_forecasts`/`tide_scenarios` và bảng con) thay vì `fetch()` JSON tĩnh; giữ nguyên `AppData`/`AppDataContext`/`dashboardService.ts` (không sửa 1 dòng logic tính toán). `topology` (trước là file riêng) nay tính lại client-side từ `network_links` — đúng như migration DB đã ghi chú (suy ra được, không lưu riêng). `web/scripts/sync-data.mjs` bỏ phần copy `shared/data/` (chỉ còn `shared/config/`), xóa `web/public/data/` (build artifact cũ, đã gitignore). Xoá dòng note cũ trong `tasks/backlog/phase-1.md`/learn-log P1-01 nói data là "mock JSON" — thêm addendum giải thích nguồn đã đổi, logic không đổi.
  - `tasks/INDEX.md`: mở lại rồi đóng lại P1-01 (logic không đổi, chỉ nguồn đổi qua P0-19); cập nhật mọi dòng `-01` của P4–P9 + P2-03/P3-02 sang "đọc Supabase, không mock JSON". `tasks/ROUTINE.md` bước 4 cập nhật chính sách chung (thay đoạn "port list" đã lỗi thời từ Phase 0 cũ).
- files: `web/supabase/migrations/20260720170000_expose_for_client.sql`, `20260720171500_fix_geojson_view_aliases.sql`, `web/src/lib/database.types.ts` (mới), `data-pipeline/import_dynamic_data.py` (mới), `web/src/loadData.ts`, `web/scripts/sync-data.mjs`, `tasks/INDEX.md`, `tasks/ROUTINE.md`, `tasks/backlog/phase-1.md`, `docs/learn-log/P1-01-dashboard-service.md`
- verify: `cd web && npx tsc --noEmit` clean; `npm run build` clean; `node scripts/check-i18n.mjs` OK (26 keys, không đổi); `npm run dev` → `curl localhost:5173/` 200; verify trực tiếp qua REST: view trả đúng GeoJSON, INSERT bằng anon key bị từ chối quyền.
- follow-up: chưa có UI nào thật sự render dữ liệu Supabase qua browser thật (P1-02 trở đi mới có UI để test bằng mắt — môi trường này không có trình duyệt headless, đã ghi nhận nhiều lần trong PROGRESS.md). `node_id_crosswalk`/ý nghĩa 44 outlet/đơn vị rainfall vẫn treo như `tasks/BLOCKERS.md` REAL-DATA-01 đã ghi — không liên quan tới việc chuyển sang Supabase, là gap dữ liệu độc lập.

## 2026-07-20 — Fix: thiếu RLS policy chặn hết truy cập Supabase từ FE
- changed: chạy thử ngay sau P0-19, người dùng báo lỗi `PGRST116`/406 "Cannot coerce the result to a single JSON object" khi FE gọi Supabase. Nguyên nhân: RLS đã bật sẵn theo mặc định trên toàn bộ bảng mới (`relrowsecurity=true`) nhưng **0 policy nào tồn tại** — RLS không có policy nghĩa là deny-all cho mọi role kể cả sau khi đã GRANT SELECT ở P0-17. Test P0-17 lúc đó chỉ query qua view `_geojson` (owner có quyền bypass RLS nên "qua mặt" được), không phát hiện ra gap này vì `loadData.ts` cũng query thẳng vào bảng gốc (`simulation_runs`, `rain_forecasts`, `tide_scenarios` và các bảng con) — chỗ đó mới lộ lỗi.
  - Thêm migration `20260720173000_add_select_policies.sql`: tạo policy `"public read access" ... for select to anon, authenticated using (true)` trên toàn bộ 19 bảng GIS/simulation (dữ liệu tham chiếu công khai, không nhạy cảm — ghi/sửa vẫn bị chặn từ REVOKE ở P0-17, chỉ mở SELECT).
- files: `web/supabase/migrations/20260720173000_add_select_policies.sql`
- verify: lặp lại đúng request đã lỗi (`simulation_runs` với `Accept: application/vnd.pgrst.object+json`) — nay trả 200 kèm dữ liệu đúng; kiểm tra thêm `simulation_node_fill`, `network_nodes`, `rain_forecasts`, `rain_forecast_points`, `tide_scenarios`, `tide_levels` bằng anon key — tất cả 200.
- follow-up: bài học ghi vào learn-log riêng nếu có task UI nào sau này đụng lại vấn đề RLS — nhắc rằng test qua view không đủ để xác nhận quyền trên bảng gốc.
