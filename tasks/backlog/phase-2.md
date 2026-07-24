# Phase 2 — Bản đồ GIS (Tab 2)

Nguồn tham chiếu bố cục: `doc/template/Demo.pdf - Page 2 of 17.png` (TAB 2.
BẢN ĐỒ GIS NGẬP LỤT) — thanh trên (search + thời gian), panel trái "Lớp dữ
liệu", bản đồ chính, panel phải (thông tin lớp/thống kê/công cụ), panel dưới
(biểu đồ/camera/thông tin trạm). Chia theo `tasks/INDEX.md` P2-01..P2-07,
mỗi task dựng 1 mảng, ghép dần vào `pages/GisMap.tsx`.

**Cập nhật 2026-07-23 (ghi chú thu gọn từ người dùng, áp dụng cho P2-02..
P2-05 bên dưới — đã điều chỉnh so với mockup gốc ở trên):** bỏ bookmark, bỏ
2 tab con "Danh sách lớp"/"Nhóm lớp" và nút "Quản lý lớp" ở panel trái, bỏ
khối "Công cụ phân tích" ở panel phải, đổi bộ nút nhảy giờ ở thanh trên,
panel dưới dùng lại 2 chart Dashboard thay vì bộ biểu đồ/trạm/công trình
3-tab của mockup gốc. Chi tiết từng điểm nằm trong mục task tương ứng.

---

### P2-01 — Thanh trên: search + dải thời gian + play/step/tốc độ

**Objective.** Dựng khung trang `/gis-map` (thay `ComingSoon`) với thanh công
cụ trên cùng: ô tìm kiếm (UI, chưa nối logic — chưa có panel/layer nào để
tìm trong tới P2-02/03) và bộ điều khiển thời gian mô phỏng (nhảy nhanh theo
giờ, play/pause, next/prev step, tốc độ phát) điều khiển một step-state cục
bộ của trang này.

**Depends on.** P0-13 (route guard đã có).

**Touches.** `web/src/pages/GisMap.tsx` (mới), `web/src/components/gis/GisTopBar.tsx`
(mới), `web/src/lib/simTime.ts` (mới — tách `stepTimeLabel` dùng chung với
`Dashboard.tsx`), `web/src/App.tsx`, `web/src/i18n/strings.ts` (`gis.*`),
`web/src/styles.css`.

**Steps.**
1. Tách hàm format giờ theo step (`start + step*stepMinutes`) từ
   `Dashboard.tsx` sang `web/src/lib/simTime.ts` (`stepTimeLabel`), import lại
   ở cả 2 nơi — tránh trùng logic thay vì copy lần 2.
2. `GisTopBar.tsx`: nhận `simulation: Simulation`, `step`, `onStepChange`,
   `playing`, `onTogglePlay`, `speed`, `onSpeedChange`. Render:
   - Ô tìm kiếm (input + icon `search`) — chỉ UI, `disabled` thực chất là
     không nối logic (không phải HTML `disabled` — vẫn gõ được, chỉ chưa lọc
     gì), có placeholder giải thích bằng i18n key, không tự bịa kết quả tìm
     kiếm giả.
   - Dải thời gian: các nút nhảy nhanh `-1h/-1h/+1h/+3h/+6h/+12h/+24h` (theo
     mockup) — quy đổi giờ → số step qua `simulation.stepMinutes`, `clamp`
     vào `[0, steps-1]`.
   - Nhãn ngày giờ hiện tại của step (dùng `stepTimeLabel` + `simulation.start`
     làm mốc ngày — `start` trong dữ liệu hiện chỉ là "HH:MM", không có ngày
     thật, nên chỉ hiển thị giờ:phút, không bịa ngày).
   - Nút play/pause (icon `play_arrow`/`pause`), prev/next step (`skip_previous`/
     `skip_next`), thanh trượt tốc độ (`speed`, 3 mức x1/x2/x4 — không làm
     slider liên tục vì mockup chỉ cần vài mức rời rạc).
3. `GisMap.tsx`: state cục bộ `step`/`playing`/`speed` (không dùng global
   store — `state/store.ts` đã xoá ở P0-16, chính sách hiện tại là mỗi trang
   tự quản lý state của nó cho tới khi có nhu cầu chia sẻ thật giữa nhiều
   trang). `playing` dùng `setInterval` (dọn bằng `clearInterval` khi unmount/
   đổi speed/pause) để tự tăng `step`, dừng lại (không loop về 0) khi chạm
   `steps-1`. Bên dưới thanh trên là `EmptyState` tạm thời cho các phần chưa
   xây (panel trái/bản đồ/panel phải/panel dưới — P2-02..P2-05), y hệt cách
   `ComingSoon.tsx` đang làm, để không che giấu việc trang chưa hoàn chỉnh.
4. `App.tsx`: thay `<ComingSoon title={t("nav.gisMap")} />` ở route `/gis-map`
   bằng `<GisMap />`.
5. Thêm `gis.*` i18n keys (cả `vi`/`en`) cho: tiêu đề trang, placeholder ô
   tìm kiếm, nhãn các nút nhảy giờ, tooltip play/pause/prev/next, nhãn tốc độ,
   thông báo "phần còn lại đang xây dựng".

**Done when.**
- Vào `/gis-map` (role authority/admin) thấy thanh trên với ô tìm kiếm +
  đầy đủ nút thời gian + play/pause hoạt động thật (step tăng dần theo
  `setInterval`, dừng đúng khi hết dữ liệu, không crash).
- Các nút nhảy giờ đổi đúng step (kiểm tra bằng tay: `+3h` với
  `stepMinutes=15` → step +12, `clamp` không vượt `steps-1`/dưới `0`).
- `cd web && npx tsc --noEmit` clean.
- `node scripts/check-i18n.mjs` clean.
- `npm run build` clean.

**Notes.** Đây chỉ là khung — bản đồ/panel thật thuộc P2-02..P2-05, đừng xây
lấn sang. Không có `store.currentStep` toàn cục nào tồn tại (khác với dòng
mô tả cũ trong `INDEX.md` viết từ trước khi P0-16 xoá `state/store.ts`) —
state thời gian của task này chỉ sống trong `GisMap.tsx`, sẽ cân nhắc nâng
lên context dùng chung nếu P2-02+ thật sự cần chia sẻ (không làm trước khi
cần).

**Cập nhật 2026-07-23 (follow-up, đã thực hiện).** Bộ nút nhảy giờ đổi từ
`-1h/-1h/+1h/+3h/+6h/+12h/+24h` (theo mockup gốc) sang **"Hiện tại" +1h +3h
+4h +5h +6h +12h +24h** theo yêu cầu người dùng. Đổi luôn ngữ nghĩa: mỗi nút
là **preset tuyệt đối tính từ baseline "Hiện tại" (`simulation.steps - 1`)**,
không phải cộng dồn từ step đang đứng — bấm `+3h` rồi `+1h` ra đúng
`baseline+1h`, không phải `+4h`. Nút đang khớp step hiện tại được highlight
(`active`) như các nhóm nút khác trong topbar. Đã sửa `GisTopBar.tsx` +
thêm key `gis.timeNow` (vi/en) trong cùng lượt viết lại spec này — xem
`tasks/PROGRESS.md` cùng ngày. Nút prev/next-step (`skip_previous`/
`skip_next`) giữ nguyên, vẫn đi từng step một, độc lập với các preset giờ.

---

### P2-02 — Panel trái "Lớp dữ liệu" (đơn giản hoá, bỏ tab/bookmark/Quản lý lớp)

**Objective.** Panel trái của `/gis-map`, 3 nhóm checkbox/radio phẳng điều
khiển state hiển thị lớp/nền bản đồ — không có 2 tab con "Danh sách lớp"/
"Nhóm lớp" và không có nút "Quản lý lớp"/bookmark như mockup gốc (theo ghi
chú thu gọn 2026-07-23 ở đầu file này).

**Depends on.** P2-01.

**Touches.** `web/src/pages/GisMap.tsx`, `web/src/components/gis/GisLayerPanel.tsx`
(mới), `web/src/i18n/strings.ts` (`gis.*`), `web/src/styles.css`.

**Steps.**
1. `GisLayerPanel.tsx`: nhận state lớp hiện tại + callback đổi, render 3
   khối:
   - **Quan trắc thời gian thực** (checkbox, bật/tắt độc lập từng cái):
     Trạm mưa, Mực nước, Trạm bơm, Cống.
   - **Dự báo & mô hình** (checkbox): Mưa dự báo, Mực nước dự báo, Ngập lụt
     dự báo.
   - **Nền bản đồ** (radio — chỉ chọn 1): Bản đồ nền sáng (mặc định), Ảnh vệ
     tinh, Google Satellite, OpenStreetMap. (Bỏ "Bản đồ nền tối" và
     "Địa hình DEM" khỏi mockup gốc — quyết định người dùng 2026-07-23.)
   - Không dựng tab switcher, không nút "Quản lý lớp", không mục Bookmark.
2. `GisMap.tsx`: state cục bộ mới (object `{ layers: Record<key, boolean>,
   basemap: string }`, cùng chỗ với `step`/`playing`/`speed` từ P2-01) —
   chưa có map thật để nối (P2-03), nên P2-02 chỉ cần state + UI đúng, chưa
   filter gì.
3. Thêm `gis.layer.*` i18n keys (nhãn 3 nhóm + 7 mục lớp + 4 basemap), cả
   vi/en trong cùng edit.

**Done when.**
- Panel trái render đúng 3 nhóm, không còn tab/nút Quản lý lớp/bookmark nào.
- Toggle checkbox/radio đổi state đúng (verify bằng cách log tạm hoặc test
  tay qua devtools state — chưa có map để thấy trực quan, việc đó thuộc
  P2-03).
- `cd web && npx tsc --noEmit` clean; `node scripts/check-i18n.mjs` clean;
  `npm run build` clean.

**Notes.** Basemap là radio (chọn 1 áp dụng ngay) khác hẳn 6 lớp còn lại là
checkbox (bật/tắt độc lập, có thể nhiều lớp cùng hiện). Đừng lẫn 2 kiểu
input.

---

### P2-03 — Bản đồ chính + thanh công cụ nổi trong map

**Objective.** Dựng MapLibre thật cho `/gis-map`, chiếm tối đa diện tích còn
lại (dưới thanh trên P2-01, bên phải panel trái P2-02) — không khung viền
ngoài, các control nổi trực tiếp trên canvas bản đồ, cùng convention với
`FloodMapPreview.tsx` (title chip/link nổi, không header bar riêng).

**Depends on.** P2-02, P0-19.

**Touches.** `web/src/components/gis/GisMapCanvas.tsx` (mới), `web/src/pages/GisMap.tsx`,
`web/src/i18n/strings.ts`, `web/src/styles.css`.

**Steps.**
1. Map MapLibre thật (không `interactive: false` như `FloodMapPreview` — đây
   là bản đồ tương tác chính), basemap theo lựa chọn P2-02, lớp
   `network_nodes_geojson`/`network_links_geojson`/`rivers_geojson`/flood
   zones lọc hiển thị theo checkbox P2-02, marker tô màu theo `nodeFill` tại
   `step` hiện tại (tái dùng logic `FloodMapPreview.tsx` đã có, không viết
   lại từ đầu).
2. Thanh công cụ trái nổi trong map — **chỉ 6 nút** (thu gọn từ ~14 nút của
   mockup gốc, theo ghi chú 2026-07-23): **Chọn** (con trỏ mặc định),
   **Di chuyển** (pan — MapLibre pan mặc định khi kéo), **Phóng to**/
   **Thu nhỏ** (zoom +/-), **Đo khoảng cách**, **Đo diện tích**. Bỏ hẳn: vẽ
   điểm/tuyến/vùng, xoá, lấy cao độ, Identify, so sánh.
3. Góc trên phải nổi trong map — **2 nút**: **Xuất bản đồ** (mock, chưa xuất
   file thật — chỉ toast/alert placeholder) và **Toàn màn hình** (thật, dùng
   Fullscreen API trên container bản đồ). Bỏ "Chia sẻ" và "In bản đồ" khỏi
   mockup gốc.
4. Legend góc dưới: "Chú giải độ sâu ngập (m)" + dải màu theo bucket —
   **tái dùng đúng** bảng màu/ngưỡng đang dùng ở `FloodMapPreview.tsx`/
   `config.simThresholds`/`config.colors`, không tự bịa thang màu/bucket
   mới khác với phần còn lại của app.
5. Thay `EmptyState` placeholder (P2-01) ở vùng bản đồ bằng `GisMapCanvas`
   thật.

**Done when.**
- Map render đúng lớp theo checkbox P2-02, marker đổi theo `step` (đồng bộ
  với play/pause P2-01).
- Đo khoảng cách/đo diện tích hoạt động thật trên bản đồ (cách đo cụ thể —
  MapLibre GL Draw hay tự viết — quyết định khi build task này, không quyết
  trước).
- Toàn màn hình hoạt động thật (Fullscreen API), Xuất bản đồ hiện rõ là mock.
- `cd web && npx tsc --noEmit` clean; `node scripts/check-i18n.mjs` clean;
  `npm run build` clean.

**Notes.** Đừng xây lấn sang panel phải/dưới (P2-04/P2-05) — chỉ bản đồ +
control nổi trong chính nó.

---

### P2-04 — Panel phải (bỏ "Công cụ phân tích")

**Objective.** Panel phải của `/gis-map`: thông tin lớp đang chọn + thống kê
ngập hiện tại + minimap — **không có khối "Công cụ phân tích"** như mockup
gốc (quyết định 2026-07-23 — 2 công cụ đo đã chuyển vào thanh công cụ trong
map ở P2-03, phần còn lại của mockup gốc — Lấy cao độ/Profile mặt cắt/Thống
kê vùng/Xuất dữ liệu — không làm).

**Depends on.** P2-03.

**Touches.** `web/src/components/gis/GisRightPanel.tsx` (mới), `web/src/pages/GisMap.tsx`,
`web/src/i18n/strings.ts`, `web/src/styles.css`.

**Steps.**
1. **Thông tin lớp đang chọn**: tên lớp "Vùng ngập hiện tại" + thanh trượt
   độ trong suốt (0–100%, có ô số % hiển thị kèm) điều khiển `paint-property`
   opacity của layer vùng ngập trên `GisMapCanvas` (P2-03).
2. **Thống kê ngập hiện tại**: Diện tích ngập, Độ sâu TB, Độ sâu lớn nhất —
   tính thật từ `AppData` tại `step` hiện tại (diện tích từ hình học
   `flood_zones`/`ST_Area`, độ sâu từ `nodeFill`×`groundLevel-invertLevel`
   như `dashboardService.ts` đã làm). Nếu 1 trong 3 số không có nguồn thật
   khả thi trong dữ liệu hiện có, ghi rõ giới hạn trong code + Notes, không
   bịa số.
3. **Bản đồ thu nhỏ (minimap)**: bản đồ tham chiếu nhỏ, tĩnh hoặc MapLibre
   thu nhỏ, có khung chữ nhật đánh dấu viewport hiện tại của map chính.
4. Không dựng khối "Công cụ phân tích".

**Done when.**
- Kéo thanh trượt đổi opacity thật trên map chính.
- 3 số thống kê khớp dữ liệu thật, đổi đúng theo `step`.
- Không còn UI/route/i18n key nào cho "Công cụ phân tích" trong code.
- `cd web && npx tsc --noEmit` clean; `node scripts/check-i18n.mjs` clean;
  `npm run build` clean.

---

### P2-05 — Panel dưới (dùng lại 2 chart Dashboard + camera coming-soon)

**Objective.** Panel dưới của `/gis-map` — **thay đổi so với dòng mô tả gốc
trong `tasks/INDEX.md`** (vốn ghi "biểu đồ/thông tin trạm/thông tin công
trình + camera placeholder", suy ra từ mockup gốc có 3 tab con "Biểu đồ"/
"Thông tin trạm"/"Thông tin công trình"): theo quyết định người dùng
2026-07-23, dùng lại nguyên `RainForecastChart`/`WaterLevelForecastChart`
(component đã có sẵn từ P1-06, dùng trên Dashboard) thay vì dựng bộ 3-tab
biểu đồ/trạm/công trình riêng cho trang này.

**Depends on.** P2-04.

**Touches.** `web/src/pages/GisMap.tsx`, `web/src/i18n/strings.ts` (nếu cần
label mới cho khối camera), `web/src/styles.css`.

**Steps.**
1. Chèn `RainForecastChart`/`WaterLevelForecastChart` (import thẳng từ
   `web/src/components/`, không viết lại logic) vào panel dưới của
   `GisMap.tsx`, cùng dữ liệu `data.rainForecast`/`data.tide` đã có sẵn
   trong `AppData`.
2. "Camera trực tiếp": 1 khối `EmptyState`/kiểu `ComingSoon` (dùng lại
   `common.comingSoon` hoặc key `gis.*` riêng nếu cần văn cảnh khác) — không
   giả lập luồng video/canvas nào.
3. Bố cục: chart + camera đặt cạnh nhau dưới bản đồ, không che diện tích map
   chính (P2-03) — theo đúng tiêu chí "map to nhất có thể" người dùng nêu.

**Done when.**
- 2 chart hiển thị đúng dữ liệu thật (không phải bản sao logic — cùng
  component với Dashboard).
- Khối camera hiển thị rõ ràng là "sắp ra mắt", không có gì trông giống dữ
  liệu thật.
- `cd web && npx tsc --noEmit` clean; `node scripts/check-i18n.mjs` clean;
  `npm run build` clean.

**Notes.** Đây là điểm khác lớn nhất so với mockup gốc — nếu sau này người
dùng muốn quay lại bộ 3-tab biểu đồ/trạm/công trình đầy đủ, đó là một quyết
định mới cần ghi lại tương tự cách ghi chú 2026-07-23 này, không tự ý làm
thêm.
