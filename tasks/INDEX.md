# Backlog — atomic tasks (single source of truth for status)

One task per iteration. Status: `- [ ]` todo · `- [x]` done · `- [!]` blocked.
Pick the **first `- [ ]` whose `deps` are all done** (see [ROUTINE.md](ROUTINE.md)).
Each line: **id** — title · *deps:* … · *done:* acceptance criterion.

Legend of phases: **P0** Nền tảng · **P1** Dashboard (Tab 1) · **P2** Bản đồ GIS
(Tab 2) · **P3** Quan trắc thời gian thực (Tab 3) · **P4** Dự báo (Tab 4) ·
**P5** What-if Analysis (Tab 5) · **P6** Công trình & Vận hành (Tab 6) ·
**P7** Thiệt hại & Tác động (Tab 7) · **P8** Báo cáo (Tab 9) · **P9** Quản trị
hệ thống (Tab 12) · **P10** Dọn dẹp & kiểm tra.

Scope, decisions, and the per-page UI-block breakdown this backlog is derived
from live in the redesign plan this backlog was generated from (per-phase
sections mirror `tasks/backlog/phase-N.md` 1:1).

---

## Phase 0 — Nền tảng
- [x] **P0-14** — Scaffold `tasks/` + `docs/learn-log/` (this file and its siblings) · *deps:* none · *done:* files exist matching the XmindClone-style layout.
- [x] **P0-15** — Cập nhật `CLAUDE.md` gốc + `PLAN.md` gốc trỏ tới `tasks/` · *deps:* P0-14 · *done:* 2 file có mục trỏ tới, không phá nội dung cũ.
- [x] **P0-01** — Mở rộng `web/src/types.ts` cho domain forecast/whatif/works/impact/report/admin · *deps:* none · *done:* biên dịch sạch, không xóa type cũ đang dùng.
- [x] ~~**P0-02** — Khung `web/src/data/` service layer: 7 file stub~~ **REVERTED ở P0-16** — người dùng yêu cầu không pre-scaffold cho tương lai; mỗi phase tự dựng service file của mình khi thật sự cần (xem P0-16 + note trong plan).
- [x] **P0-03** — Viết lại `web/src/i18n/strings.ts` (namespace `nav.*`/`common.*`/`login.*`/`role.*`; namespace theo trang thêm dần ở phase dùng tới) · *deps:* none · *done:* `node scripts/check-i18n.mjs` sạch.
- [x] **P0-04** — Đơn giản hóa `AuthContext.tsx` còn 2 role (`authority`,`admin`), không session = guest · *deps:* none · *done:* tsc sạch, hết tham chiếu `citizen` (tsc sẽ đỏ tạm cho tới khi P0-06 xóa file phụ thuộc `updateHomeLocation`/`citizen` — xem note P0-06).
- [x] **P0-05** — Sửa `RequireRole.tsx` (2 role) + `RequireGuestOrRole.tsx` mới · *deps:* P0-04 · *done:* dùng được trong router.
- [x] **P0-06** — Xóa file thiết kế cũ (`pages/{Portal,MyArea,Dashboard,Monitor,MapPage,Report,Database}.tsx`, `TopNav.tsx`, `PickLocationMap.tsx`, `nearest.ts`) · *deps:* P0-04, P0-05 · *done:* xóa xong (app tạm đỏ, sẽ xanh lại ở P0-10).
- [x] **P0-07** — `components/layout/Sidebar.tsx` (9 mục, role-aware) · *deps:* P0-05 · *done:* render đúng theo role.
- [x] **P0-08** — `components/layout/TopBar.tsx` · *deps:* none · *done:* hiển thị đúng, dùng `useAuth`/`useI18n`.
- [x] **P0-09** — `components/layout/PageHeader.tsx` (tiêu đề + sub-tabs dùng chung) · *deps:* none · *done:* tái dùng được nhiều trang.
- [x] **P0-10** — `components/layout/AppShell.tsx` + `App.tsx` router mới (ma trận route) · *deps:* P0-06, P0-07, P0-08, P0-09 · *done:* `npm run dev` chạy, điều hướng cơ bản không crash.
- [x] **P0-11** — Viết lại `styles.css` (design tokens + xóa block cũ) · *deps:* P0-10 · *done:* shell đúng bố cục.
- [x] **P0-12** — Reskin `pages/Login.tsx` theo `page_login.png` · *deps:* P0-11 · *done:* đăng nhập/đăng xuất hoạt động.
- [x] **P0-13** — Route guard đúng ma trận (guest/authority/admin) · *deps:* P0-10, P0-12 · *done:* test thủ công 3 cấp đúng (xác minh bằng code-trace tĩnh, xem note trong PROGRESS.md — không có trình duyệt headless trong môi trường này để test tương tác thật).
- [x] **P0-16** — Xóa toàn bộ code cũ/không dùng trong `web/src` (map/monitoring/network/panels/sim/state, các component không dùng, khung `data/` service, phần type/i18n/CSS/icon không còn tham chiếu) + gỡ `manualChunks` maplibre/recharts khỏi `vite.config.ts` · *deps:* P0-13 · *done:* `tsc`/`build`/`check-i18n` sạch, không còn import/class/key nào trỏ tới file đã xóa. **Đảo ngược chính sách "port nguyên vẹn"/pre-scaffold của Phase 0 ban đầu** — từ nay không giữ code cũ hay dựng khung sẵn cho tương lai; mỗi phase tự viết mới hoàn toàn khi thật sự cần, kể cả phải viết lại logic đã có trước đó (map engine, monitoring station derivation, sim step helpers, v.v.) — xem PROGRESS.md.
- [x] **P0-17** — Chuẩn bị Supabase để FE đọc trực tiếp: view `*_geojson` (ST_AsGeoJSON cho mọi bảng có cột `geom`), REVOKE insert/update/delete/truncate khỏi `anon`/`authenticated` (chỉ giữ SELECT — đã phát hiện quyền cũ quá rộng), sinh `web/src/lib/database.types.ts` · *deps:* none · *done:* query view bằng anon key trả đúng GeoJSON; INSERT bằng anon key bị từ chối quyền.
- [x] **P0-18** — Import dữ liệu động mock (`simulation.json`, `rain-forecast.json`, `tide-demo.json`, `flood-zones.geojson`) vào Supabase (`data-pipeline/import_dynamic_data.py`) — nội dung vẫn là demo/giả lập, chỉ đổi nơi lưu trữ · *deps:* P0-17 · *done:* số dòng khớp nguồn (834 `simulation_node_fill`, 2 `flood_zones`...).
- [x] **P0-19** — Viết lại `web/src/loadData.ts` để đọc Supabase (qua `supabase-js`) thay vì `fetch()` `shared/data/*.json` tĩnh — giữ nguyên shape `AppData`/`AppDataContext`, bỏ `predev`/`prebuild` sync data (chỉ còn sync `config/`), `topology` tính lại client-side từ `network_links` (không lưu riêng) · *deps:* P0-18 · *done:* `tsc`/`build`/`check-i18n` sạch, `npm run dev` load `/` OK, không còn `fetch` `/data/*.json`.

## Phase 1 — Dashboard (Tab 1)
- [x] **P1-01** — `dashboardService`/aggregate (điểm ngập, tuyến ngập, mưa/mực nước max, cống/bơm) — đọc dữ liệu qua `AppData` (nay bắt nguồn từ Supabase qua P0-19, không còn mock JSON tĩnh); hàm tính toán trong `dashboardService.ts` giữ nguyên, không cần sửa lại · *deps:* P0-19 · *done:* hàm trả đúng type, dữ liệu đến từ Supabase thật (đã verify qua P0-17/18/19).
- [ ] **P1-02** — Header + 6 stat-card · *deps:* P1-01, P0-13 · *done:* `/` hiển thị đúng số liệu thật.
- [ ] **P1-03** — Card bản đồ ngập hiện tại + link `/gis-map` · *deps:* P1-02 · *done:* bản đồ render, điều hướng đúng.
- [ ] **P1-04** — Card "Cảnh báo đang hoạt động" · *deps:* P1-02 · *done:* render từ mock.
- [ ] **P1-05** — Card "Dự báo thời tiết" · *deps:* P1-02 · *done:* render theo mock.
- [ ] **P1-06** — 4 card dưới (mưa/mực nước chart, khuyến nghị AI, tóm tắt ảnh hưởng) · *deps:* P1-02 · *done:* chart + toggle hoạt động.
- [ ] **P1-07** — i18n `dash.*` đầy đủ + check-i18n sạch + LangToggle test · *deps:* P1-02…P1-06 · *done:* sạch.

## Phase 2 — Bản đồ GIS (Tab 2)
- [ ] **P2-01** — Thanh trên: search + dải thời gian (dùng `store.currentStep`) + play/step/tốc độ · *deps:* P0-13 · *done:* playback đổi step đúng.
- [ ] **P2-02** — Panel trái "Lớp dữ liệu" (checkbox nhóm + nền bản đồ + bookmark mock) · *deps:* P2-01 · *done:* toggle lớp hoạt động.
- [ ] **P2-03** — Bản đồ chính (dựng mới bằng MapLibre GL, viết lại từ đầu — không tái dùng `MapView.tsx` cũ đã xóa) + toolbar đo/vẽ đơn giản + minimap · *deps:* P2-02, P0-19 · *done:* marker/lớp lấy từ Supabase (`network_nodes_geojson`/`network_links_geojson`/`rivers_geojson` — đã có dữ liệu thật, không cần tự suy diễn lại từ đầu như ghi chú cũ P0-16).
- [ ] **P2-04** — Panel phải: thông tin lớp chọn + thống kê ngập + công cụ phân tích · *deps:* P2-03 · *done:* số liệu đúng theo step hiện tại.
- [ ] **P2-05** — Panel dưới: biểu đồ/thông tin trạm/thông tin công trình + camera placeholder · *deps:* P2-04 · *done:* chọn trạm cập nhật đúng panel.
- [ ] **P2-06** — Nối link Dashboard → `/gis-map` (đóng P1-03) · *deps:* P2-01 · *done:* điều hướng đúng vị trí.
- [ ] **P2-07** — i18n `gis.*` đầy đủ + check-i18n sạch + LangToggle test · *deps:* P2-01…P2-06 · *done:* sạch.

## Phase 3 — Quan trắc thời gian thực (Tab 3)
- [ ] **P3-01** — Route `/monitoring/:tab` + `PageHeader` 9 sub-tab · *deps:* P0-13 · *done:* điều hướng ok.
- [ ] **P3-02** — Sub-tab Mưa: bản đồ trạm + bảng số liệu — đọc từ Supabase (`network_nodes_geojson` + `simulation_node_fill`/`rain_forecast_points`), không tái dùng `monitoring/stations.ts` cũ đã xóa và không cần tự suy diễn từ mock JSON như ghi chú cũ P0-16 (dữ liệu node/rain giờ có thật) · *deps:* P3-01, P0-19 · *done:* dữ liệu thật.
- [ ] **P3-03** — Sub-tab Mưa: thống kê + cảnh báo mưa · *deps:* P3-02 · *done:* toggle 24h/7ngày/30ngày đúng.
- [ ] **P3-04** — Sub-tab Mưa: biểu đồ diễn biến + top 10 + phân bố khung giờ · *deps:* P3-02 · *done:* 3 chart đúng.
- [ ] **P3-05** — Sub-tab Mưa: trạng thái/thông tin trạm/lịch sử/xu hướng/tải dữ liệu (CSV thật) · *deps:* P3-03, P3-04 · *done:* export CSV thật.
- [ ] **P3-06** — Sub-tab Mực nước · *deps:* P3-05 · *done:* tương tự Mưa (thu gọn).
- [ ] **P3-07** — Sub-tab Trạm bơm + Cống · *deps:* P3-06 · *done:* 2 sub-tab đúng.
- [ ] **P3-08** — Sub-tab Camera/Radar/Chất lượng nước/Cảm biến IoT (placeholder) · *deps:* P3-01 · *done:* 4 sub-tab nhất quán.
- [ ] **P3-09** — Sub-tab Tổng quan (tóm tắt 4 domain) · *deps:* P3-05, P3-06, P3-07 · *done:* hiển thị đúng.
- [ ] **P3-10** — i18n `mon.*` đầy đủ + check-i18n sạch + LangToggle test · *deps:* P3-01…P3-09 · *done:* sạch.

## Phase 4 — Dự báo (Tab 4)
- [ ] **P4-01** — `forecastService` (mưa/mực nước/ngập/triều) — đọc từ Supabase (`rain_forecasts`/`tide_scenarios`; nếu cần bảng riêng cho kịch bản dự báo thì tự thiết kế migration cùng kỷ luật đã dùng cho GIS/simulation — không mock JSON) · *deps:* P0-19 · *done:* type đúng, giá trị hợp lý, dữ liệu từ Supabase thật.
- [ ] **P4-02** — Route `/forecast/:tab` + `PageHeader` 6 sub-tab · *deps:* P0-13 · *done:* điều hướng ok.
- [ ] **P4-03** — Sub-tab Tổng quan: quy trình dự báo + thời gian/kịch bản + nút chạy mô phỏng (mock) · *deps:* P4-01, P4-02 · *done:* đổi kịch bản cập nhật panel.
- [ ] **P4-04** — Sub-tab Tổng quan: dự báo mưa (4 heatmap) + mực nước tại trạm (BD1/2/3) · *deps:* P4-03 · *done:* đúng mock.
- [ ] **P4-05** — Sub-tab Tổng quan: dự báo ngập lụt (3 tab bản đồ) + xem animation (modal ảnh tĩnh) · *deps:* P4-03 · *done:* hoạt động đúng.
- [ ] **P4-06** — Sub-tab Tổng quan: thủy triều + tổng hợp cảnh báo + độ tin cậy · *deps:* P4-03 · *done:* đúng mock.
- [ ] **P4-07** — 5 sub-tab con (view rút gọn trích từ P4-04…P4-06) · *deps:* P4-04, P4-05, P4-06 · *done:* đúng phần tương ứng.
- [ ] **P4-08** — i18n `fc.*` đầy đủ + check-i18n sạch + LangToggle test · *deps:* P4-01…P4-07 · *done:* sạch.

## Phase 5 — What-if Analysis (Tab 5)
- [ ] **P5-01** — `whatifService` (biến đổi tuyến tính trên `simulation_node_fill` đọc từ Supabase, ghi rõ giới hạn) — không mock JSON, tự thiết kế bảng lưu kịch bản nếu cần lưu server-side · *deps:* P0-19 · *done:* kết quả hợp lý theo chiều tăng/giảm.
- [ ] **P5-02** — Route `/whatif` + 3 panel trên + sidebar kịch bản đã lưu (localStorage) · *deps:* P5-01, P0-13 · *done:* slider đổi state.
- [ ] **P5-03** — Bản đồ ngập kịch bản hiện tại · *deps:* P5-02 · *done:* cập nhật theo slider.
- [ ] **P5-04** — So sánh kết quả kịch bản (delta card + chart 3 series) · *deps:* P5-03 · *done:* đổi kịch bản so sánh đúng.
- [ ] **P5-05** — So sánh độ sâu ngập mặt cắt + xem trước animation (placeholder) · *deps:* P5-04 · *done:* 2 khối đúng.
- [ ] **P5-06** — Kết quả & khuyến nghị + nút Lưu/Xuất/Áp dụng (mock) · *deps:* P5-05 · *done:* hoạt động, không điều khiển thật.
- [ ] **P5-07** — i18n `whatif.*` đầy đủ + check-i18n sạch + LangToggle test · *deps:* P5-01…P5-06 · *done:* sạch.

## Phase 6 — Công trình & Vận hành (Tab 6)
- [ ] **P6-01** — `worksService` (danh mục công trình từ `network_nodes`/`swmm_outfalls` trên Supabase + synthetic cho phần chưa rõ loại — xem `tasks/BLOCKERS.md` REAL-DATA-01 về 44 outlet chưa xác định) — không mock JSON · *deps:* P0-19 · *done:* đủ 7 loại.
- [ ] **P6-02** — Route `/works/:tab` + `PageHeader` 7 sub-tab + 7 stat-card · *deps:* P6-01, P0-13 · *done:* số liệu đúng.
- [ ] **P6-03** — Bản đồ công trình (icon theo loại + legend) · *deps:* P6-02 · *done:* marker đúng.
- [ ] **P6-04** — Danh sách & trạng thái vận hành (DataTable + tab lọc) · *deps:* P6-02 · *done:* lọc/sort ok.
- [ ] **P6-05** — Điều khiển công trình (mock, đổi state + toast) · *deps:* P6-04 · *done:* hoạt động, ghi rõ mock.
- [ ] **P6-06** — Trạng thái trạm bơm (donut) + mặt cắt dọc mực nước · *deps:* P6-02 · *done:* 2 khối đúng.
- [ ] **P6-07** — 6 sub-tab con (DataTable+minimap lọc theo loại) · *deps:* P6-04 · *done:* đúng (Camera = placeholder).
- [ ] **P6-08** — i18n `works.*` đầy đủ + check-i18n sạch + LangToggle test · *deps:* P6-01…P6-07 · *done:* sạch.

## Phase 7 — Thiệt hại & Tác động (Tab 7)
- [ ] **P7-01** — `impactService` (theo phường tĩnh + theo ngành + lịch sử) — đọc/thiết kế bảng trên Supabase, không mock JSON · *deps:* P0-19 · *done:* dữ liệu hợp lý.
- [ ] **P7-02** — Route `/impact/:tab` + `PageHeader` 6 sub-tab + chọn kịch bản (liên kết `whatifService`) + 6 stat-card · *deps:* P7-01, P5-01, P0-13 · *done:* đổi kịch bản cập nhật số liệu.
- [ ] **P7-03** — Bản đồ tác động tổng hợp · *deps:* P7-02 · *done:* đổi chỉ số cập nhật màu.
- [ ] **P7-04** — Phân bố phường/xã + thiệt hại theo ngành · *deps:* P7-02 · *done:* đúng.
- [ ] **P7-05** — Thiệt hại kinh tế theo ngày + tác động dân cư · *deps:* P7-02 · *done:* đúng.
- [ ] **P7-06** — Tác động giao thông + cơ sở hạ tầng · *deps:* P7-02 · *done:* đúng.
- [ ] **P7-07** — Lịch sử tác động các đợt ngập lớn + khu vực nguy cơ cao · *deps:* P7-02 · *done:* đúng.
- [ ] **P7-08** — 5 sub-tab con (view rút gọn) · *deps:* P7-04, P7-05, P7-06, P7-07 · *done:* đúng.
- [ ] **P7-09** — i18n `impact.*` đầy đủ + check-i18n sạch + LangToggle test · *deps:* P7-01…P7-08 · *done:* sạch.

## Phase 8 — Báo cáo (Tab 9)
- [ ] **P8-01** — `reportService` (danh mục báo cáo lưu trên Supabase + hàm "tạo báo cáo") — không mock JSON · *deps:* P0-19 · *done:* hoạt động đúng.
- [ ] **P8-02** — Route `/reports/:tab` + `PageHeader` 6 sub-tab + 5 stat-card · *deps:* P8-01, P0-13 · *done:* đúng.
- [ ] **P8-03** — Thống kê theo tháng + phân loại (donut) · *deps:* P8-02 · *done:* đúng.
- [ ] **P8-04** — Báo cáo gần đây + mẫu báo cáo (nút tạo mock) · *deps:* P8-02 · *done:* tạo mock thêm dòng.
- [ ] **P8-05** — Danh sách báo cáo (DataTable + filter + phân trang + export CSV thật) · *deps:* P8-04 · *done:* export thật.
- [ ] **P8-06** — 5 sub-tab con (view rút gọn) · *deps:* P8-05 · *done:* đúng.
- [ ] **P8-07** — i18n `report.*` đầy đủ + check-i18n sạch + LangToggle test · *deps:* P8-01…P8-06 · *done:* sạch.

## Phase 9 — Quản trị hệ thống (Tab 12, chỉ Admin)
- [ ] **P9-01** — `adminService` (Supabase `profiles` thật cho Người dùng + bảng tự thiết kế cho phần còn lại — không mock JSON) · *deps:* P0-19 · *done:* query thật trả đúng.
- [ ] **P9-02** — Route `/admin/:tab` (admin-only) + `PageHeader` 7 sub-tab + 6 stat-card · *deps:* P9-01, P0-13 · *done:* authority bị chặn.
- [ ] **P9-03** — Trạng thái hệ thống (mock) + phiên đăng nhập hiện tại (Supabase thật) · *deps:* P9-02 · *done:* đúng.
- [ ] **P9-04** — Nhật ký hệ thống (mock) + cấu hình hệ thống (mock, đổi state) · *deps:* P9-02 · *done:* đúng.
- [ ] **P9-05** — Sao lưu & phục hồi (mock) + thông báo + giấy phép (mock) · *deps:* P9-02 · *done:* đúng.
- [ ] **P9-06** — Sub-tab Người dùng (DataTable Supabase thật) · *deps:* P9-01 · *done:* đúng 2 tài khoản seed.
- [ ] **P9-07** — Sub-tab Vai trò & Phân quyền + Cấu hình/Nhật ký/Sao lưu/Giám sát (phóng to mock) · *deps:* P9-03, P9-04, P9-05 · *done:* đúng.
- [ ] **P9-08** — i18n `admin.*` đầy đủ + check-i18n sạch + LangToggle test · *deps:* P9-01…P9-07 · *done:* sạch.

## Phase 10 — Dọn dẹp & kiểm tra
- [ ] **P10-01** — `check-i18n.mjs` + `tsc --noEmit` + `npm run build` sạch xuyên suốt · *deps:* P9-08 · *done:* 3 lệnh sạch.
- [ ] **P10-02** — Test thủ công 3 cấp truy cập đúng ma trận route · *deps:* P10-01 · *done:* checklist pass.
- [ ] **P10-03** — Cập nhật memory dự án (`ewater-vinh-long-demo.md`) · *deps:* P10-02 · *done:* memory phản ánh đúng kiến trúc/role mới.
- [ ] **P10-04** — Rà `README.md`/`PLAN.md` gốc, đồng bộ với thực tế · *deps:* P10-02 · *done:* docs nhất quán.
