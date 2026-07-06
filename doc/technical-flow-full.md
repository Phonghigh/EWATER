# Flow kỹ thuật chi tiết: Hệ thống cảnh báo ngập vận hành thật (EWATER + eWM)

> Tài liệu này mô tả **toàn bộ luồng kỹ thuật** cần xây để hệ thống chạy thật (không phải demo): dữ liệu lấy từ đâu, convert qua các bước nào, chạy mô hình ra sao, và hiển thị lên web/mobile như thế nào. Ghép hai phần đã khảo sát:
> - `d:\EWATER` — tầng hiển thị (map, dashboard, mobile) hiện đang dùng dữ liệu tĩnh/mock.
> - `Phonghigh/weather` (dự án **eWM**) — tầng engine mô phỏng thủy lực thật (SWMM 1D + ITZI 2D + GRASS GIS), hiện là desktop app pitch, phần chạy engine thật còn đang stub.
>
> Mục tiêu: nối hai phần này thành **một pipeline production end-to-end**.

---

## 0. Sơ đồ tổng quan (end-to-end)

```
┌──────────────┐   ┌───────────────┐   ┌────────────────────┐   ┌───────────────┐   ┌──────────────────┐
│  NGUỒN DỮ     │──▶│  INGESTION &  │──▶│   MODEL ENGINE      │──▶│  POST-PROCESS │──▶│  SERVING & HIỂN   │
│  LIỆU THẬT    │   │  CHUẨN HOÁ    │   │  (SWMM+ITZI+GRASS)  │   │  & LƯU TRỮ    │   │  THỊ (web/mobile) │
└──────────────┘   └───────────────┘   └────────────────────┘   └───────────────┘   └──────────────────┘
   §1                  §2                    §3                     §4                   §5
```

Bên dưới đi chi tiết từng khối, với format dữ liệu cụ thể ở mỗi bước chuyển đổi.

---

## 1. Nguồn dữ liệu thật (Data Acquisition)

| # | Loại dữ liệu | Định dạng gốc | Tần suất | Nguồn thực tế |
|---|---|---|---|---|
| 1a | Mạng lưới thoát nước (hố ga, cống, outlet, lưu vực) | Shapefile MIKE URBAN (`.shp/.dbf/.prj`), CRS EPSG:32648 | Cập nhật khi có công trình mới (tháng/quý) | Đơn vị quản lý hạ tầng thoát nước / Sở Xây dựng |
| 1b | Địa hình (DEM) | GeoTIFF/raster, độ phân giải 1–10m | Cập nhật khi có khảo sát mới (năm) | LiDAR/ảnh vệ tinh/khảo sát flycam — **bắt buộc phải có** để chạy ITZI (mô phỏng 2D cần địa hình bề mặt, phần này project EWATER hiện **chưa có**) |
| 1c | Lớp phủ mặt đất (land use / hệ số thấm) | Raster hoặc polygon | Tĩnh, cập nhật hiếm | Ảnh vệ tinh phân loại hoặc bản đồ quy hoạch đô thị — cần cho tính hệ số dòng chảy bề mặt (runoff coefficient) từng lưu vực |
| 1d | Mưa thời gian thực | Chuỗi số theo trạm (mm/khoảng thời gian) | 5–15 phút | Trạm đo mưa tự động — mạng lưới Đài KTTV khu vực Nam Bộ, hoặc trạm IoT tự lắp |
| 1e | Mực nước biên hạ lưu (triều, sông) | Chuỗi số (m) | 15–60 phút | Trạm đo mực nước sông/kênh — cùng nguồn KTTV, hoặc cảm biến riêng tại outlet chính |
| 1f | Mực nước tại hố ga/kênh (để **hiệu chỉnh/kiểm định** mô hình, không phải input mô hình) | Chuỗi số (m) | 1–5 phút | Cảm biến siêu âm/radar lắp tại điểm trọng yếu |
| 1g | Trạng thái van/cống/bơm | Rời rạc (ON/OFF, %mở) | Sự kiện hoặc polling | SCADA/PLC của đơn vị vận hành |

**Điểm quan trọng dễ bị bỏ sót**: EWATER hiện tại (`shared/data/*.geojson`) chỉ có (1a). Muốn chạy mô hình thủy lực thật kiểu eWM (SWMM+ITZI), **bắt buộc phải bổ sung (1b) DEM và (1c) land use** — đây là input core của ITZI (2D raster hydrodynamics), hiện chưa tồn tại ở đâu trong cả hai repo.

---

## 2. Ingestion & Chuẩn hoá dữ liệu (Conversion pipeline)

Đây là phần "convert như nào" — chi tiết từng bước biến dữ liệu thô thành input mà engine SWMM/ITZI/GRASS hiểu được.

### 2a. Mạng lưới tĩnh → input SWMM (mở rộng từ `convert_shp.py` hiện có)

```
SHP (MIKE URBAN)
   │  convert_shp.py (đã có — dùng pyshp + pyproj, reproject EPSG:32648 → WGS84)
   ▼
GeoJSON (manholes/links/outlets/catchment)
   │  [BƯỚC MỚI CẦN XÂY] shp_to_swmm.py
   │    - Manholes  → SWMM [JUNCTIONS]  (invert elevation = invertLevel, max depth = groundLevel - invertLevel)
   │    - Links     → SWMM [CONDUITS]   (from/to node, length, roughness giả định theo vật liệu cống)
   │    - Outlets   → SWMM [OUTFALLS]   (loại FREE/TIDAL/TIMESERIES tuỳ có dữ liệu mực nước biên hay không)
   │    - Catchment → SWMM [SUBCATCHMENTS] (diện tích, %imperviousness từ land use raster, gán RAINGAGE)
   ▼
eWM_demo.inp – style file (.inp) — tham khảo cấu trúc trong sample_data/convert_inp.py của repo eWM
```

Đây chính là bước **chưa tồn tại** ở cả hai repo — `convert_shp.py` của EWATER dừng ở GeoJSON, còn `convert_inp.py` của eWM đi chiều ngược lại (từ file `.inp` mẫu có sẵn tạo demo, không phải từ GIS thật). Cần viết mới một script nối hai chiều này.

### 2b. DEM & land use → GRASS mapset (cho ITZI)

```
DEM raw (GeoTIFF, CRS bất kỳ)
   │  GRASS: r.in.gdal  (import + reproject vào GRASS location)
   │  g.region          (đặt vùng tính toán = extent DEM, resolution cố định vd 5m — khớp resolution ITZI cần)
   ▼
GRASS raster "elevation" trong mapset riêng theo từng lần chạy (vd urban_flood_2026/PERMANENT — pattern đã thấy trong log demo của eWM)
```

### 2c. Mưa trạm điểm → input mưa cho mô hình

Hai lựa chọn tuỳ độ chính xác cần:

- **Cho SWMM (1D)**: gán trực tiếp chuỗi mưa theo trạm gần nhất (Thiessen polygon) vào từng `SUBCATCHMENT` qua `RAINGAGE` — đơn giản, đủ cho input dòng chảy vào cống.
- **Cho ITZI (2D)**: cần mưa dạng **raster theo thời gian** (không phải điểm) — nội suy không gian (IDW hoặc Kriging) từ các trạm điểm ra lưới, import từng bước thời gian vào GRASS bằng `r.in.gdal` (đúng như log demo eWM: *"Importing rainfall raster rain_6h → mapset (r.in.gdal)"*). Nếu chỉ có 1-2 trạm mưa thật, độ chính xác nội suy sẽ thấp — đây là giới hạn thực tế cần lưu ý khi thiết kế mật độ trạm.

### 2d. Mực nước biên hạ lưu → biên SWMM

Chuỗi mực nước sông/triều tại outlet chính → gán làm `OUTFALL` loại `TIMESERIES` trong SWMM, để mô hình biết nước có bị "chặn" thoát ra do triều cường không (đúng logic "tidal backflow" mà code mock hiện tại đang giả lập bằng random).

---

## 3. Chạy mô hình (Model Engine — SWMM + ITZI + GRASS)

Đây là phần lõi mà eWM đang thiết kế (nhưng còn stub). Flow thật (theo `eWM-PROJECT-PLAN.md` §12 "Technical Deep Dive" và log giả lập trong `demo_data.py`):

```
1. Validate input (.inp hợp lệ, DEM phủ đủ extent mạng lưới)
2. Khởi tạo GRASS session (location + mapset riêng cho lần chạy)
3. Import DEM + rainfall raster vào mapset
4. Chạy SWMM engine (1D) — qua thư viện pyswmm hoặc swmm5 CLI
     → tính mực nước/lưu lượng từng node mỗi bước thời gian
     → khi node vượt quá công suất (surcharge) → sinh ra "flood volume" tại node đó
5. ITZI đọc flood volume từ SWMM tại mỗi bước thời gian (coupling 1D-2D)
     → lan truyền nước ngập trên bề mặt (GRASS raster, phương trình shallow-water 2D)
     → sinh raster độ sâu ngập (flood depth) cho từng bước thời gian
6. Ghi log từng bước (giống LOG_SCRIPT demo: "Initializing GRASS session...", "Starting ITZI engine...", "Step t=..., writing raster...")
7. Kết thúc: xuất toàn bộ raster theo thời gian + time-series theo node
```

**Chi phí tính toán thật** (khác hẳn demo — nơi `OutputTab` chỉ phát lại log giả bằng `QTimer` 340ms/step): một lần chạy ITZI+SWMM+GRASS cho vài trăm node và vài km² địa hình mất **từ vài chục giây đến vài phút thực tế**, tuỳ độ phân giải raster và số bước thời gian — đây chính là lý do không thể chạy lại toàn bộ mô hình mỗi khi có 1 điểm dữ liệu mưa mới (đã nêu ở báo cáo latency trước).

**Kiến trúc hoá engine (điều eWM hiện chưa làm vì là desktop app tương tác)**: để dùng cho hệ thống production, "Engine Orchestration Layer" (parse `.inp` bằng `swmm_api`, quản lý GRASS session, chạy ITZI subprocess) mô tả trong `eWM-PROJECT-PLAN.md` §4.2 cần được tách khỏi GUI PySide6, đóng gói thành **service chạy headless** (không cần màn hình), để backend gọi được qua hàng đợi tác vụ (Celery/RQ) thay vì người dùng bấm nút trên desktop.

---

## 4. Post-processing & Lưu trữ

Output thô của bước 3 không dùng trực tiếp được cho web map — cần convert tiếp:

| Output thô | Convert sang | Công cụ | Mục đích |
|---|---|---|---|
| Raster độ sâu ngập theo từng bước thời gian (GRASS raster) | GeoJSON polygon vùng ngập (giống `flood-zones.geojson` hiện tại nhưng là dữ liệu thật) | `r.contour`/`r.to.vect` (GRASS) → simplify → reproject WGS84 | Vẽ vùng ngập lên MapLibre dạng vector, nhẹ, style theo severity như code hiện có |
| Raster độ sâu ngập (khi cần chi tiết pixel, không chỉ ranh giới) | Ảnh tile (PNG/WebP pyramid) | `gdal2tiles`/`r.out.gdal` + tile server | Overlay tile màu theo độ sâu lên bản đồ, chi tiết hơn polygon nhưng nặng hơn |
| Time-series mực nước/lưu lượng/ngập theo node (CSV, giống `node_timeseries_demo.csv` của eWM) | Bản ghi time-series theo `(muid, timestamp)` | Nạp vào TimescaleDB/InfluxDB | Vẽ biểu đồ mực nước theo thời gian cho từng hố ga (giống chart hiện tại nhưng dữ liệu thật) |
| Metadata lần chạy (rainfall scenario, thời gian chạy, trạng thái) | Bản ghi trong bảng `runs` | PostgreSQL | Truy vết/audit — mỗi lần chạy mô hình là 1 "run" có ID riêng, xem lại được |

**Bảng ánh xạ ID bắt buộc phải có**: node ID trong SWMM (`.inp`, ví dụ "805", "812") ≠ `muid` trong GeoJSON của EWATER — cần một bảng mapping cố định `swmm_node_id ↔ muid`, join ở bước nạp time-series vào DB. Đây là điểm dễ vỡ nhất khi 2 hệ thống merge — nếu sai mapping, dữ liệu hiển thị sai vị trí trên bản đồ mà không có lỗi rõ ràng nào báo hiệu.

---

## 5. Serving & Hiển thị (đưa dữ liệu ra web/mobile)

```
                         ┌───────────────────────────┐
                         │   Backend API (mới)       │
                         │  - REST: /runs/{id}/...   │
                         │  - REST: /stations/latest │
                         │  - WebSocket: /live        │
                         └─────────────┬─────────────┘
             ┌─────────────────────────┼─────────────────────────┐
             ▼                         ▼                         ▼
   TimescaleDB (node series)   Object storage (tile/raster)   PostgreSQL (runs, mapping)
```

- **Web (`web/src/`)**: thay `loadData.ts` (hiện `fetch()` file tĩnh 1 lần) bằng: (a) load layer tĩnh (mạng lưới) như cũ qua REST, (b) subscribe WebSocket để nhận cập nhật `nodeFill`/severity theo thời gian thực, áp dụng qua `setFeatureState` — cơ chế `MapView.tsx` hiện có **tái dùng được nguyên vẹn**, chỉ đổi nguồn dữ liệu đầu vào từ file tĩnh sang stream.
- **Mobile (`mobile/`)**: tương tự, `@maplibre/maplibre-react-native` đã có sẵn cơ chế set style/feature-state — đổi `sync-data.mjs` (copy file tĩnh lúc build) thành gọi API lúc runtime.
- **Dashboard (`Monitor.tsx`, `aggregate.ts`)**: đổi nguồn từ `stations.ts` (mock) sang API `/stations/latest` (dữ liệu cảm biến/SCADA thật).
- **Trigger hiển thị mới**: khi có 1 "run" mới hoàn thành (bước 4), backend bắn WebSocket event → toàn bộ client đang mở map tự cập nhật lớp ngập mới, không cần reload trang.

---

## 6. Lịch chạy & luồng kích hoạt (Scheduling flow)

```
Mưa mới về (1d) ──┬─▶ [Nowcasting nhanh] ngoại suy xu hướng ngắn hạn (giây) → cập nhật UI cảnh báo tức thời
                  │
                  └─▶ [Job queue] xếp hàng chạy full model (SWMM+ITZI+GRASS, §3)
                         │  (chạy mỗi 15–30 phút, hoặc khi lượng mưa vượt ngưỡng)
                         ▼
                    Kết quả mới → post-process (§4) → lưu DB → bắn WebSocket (§5)
```

Cần hàng đợi tác vụ (Celery/RQ + Redis) vì mô hình chạy tốn thời gian (§3) — không thể chạy đồng bộ trong request API, và cần tránh chạy chồng lấp nhiều lần mô phỏng cùng lúc khi mưa lớn kéo dài liên tục.

---

## 7. Phân tầng latency & traffic — không tối ưu mọi thứ như nhau

Không phải mọi luồng dữ liệu đều cần "nhanh nhất có thể" — cố real-time hoá toàn bộ vừa tốn hạ tầng vừa vô nghĩa vì bản thân input (mưa, mực nước) cũng chỉ về mỗi 1–15 phút. Nên chia hệ thống thành 3 tầng SLA riêng, và chỉ dồn ngân sách tối ưu vào tầng 1:

| Tầng | Thành phần | SLA mục tiêu | Vì sao |
|---|---|---|---|
| **1 — Cảnh báo/vận hành khẩn cấp** | Nowcasting (ngoại suy ngắn hạn), cảnh báo vượt ngưỡng, lệnh đóng van/bật bơm, WebSocket push tới UI | **Vài giây → tối đa 1-2 phút** end-to-end (cảm biến → xử lý → hiển thị/quyết định) | Quyết định sai lệch ở tầng này có hậu quả trực tiếp (ngập lụt, hư hại) — đây là nơi *duy nhất* đáng đầu tư hạ tầng push (WebSocket/SSE), cache nóng, ưu tiên CPU/băng thông |
| **2 — Mô hình thủy lực đầy đủ** | Chạy SWMM+ITZI+GRASS full (§3), post-process raster/vector (§4) | **Vài chục giây → vài phút/lần chạy, chu kỳ 15–30 phút** — chấp nhận được, không cần rút ngắn bằng mọi giá | Bài toán giải phương trình 2D trên raster có chi phí tính toán cố định; ép chạy mỗi giây không tăng giá trị quyết định vì input mưa/mực nước tự nó cũng không đổi nhanh hơn thế. Tối ưu ở đây nên nhắm vào *độ ổn định* (không bị chồng lấp job, không timeout) hơn là *tốc độ* |
| **3 — Dữ liệu tĩnh & public** | Bản đồ nền, mạng lưới cống/hố ga, style, lịch sử các lần chạy cũ | **Không áp lực latency** — cache mạnh (CDN, browser cache, ETag) | Đổi hiếm (tháng/quý), phục vụ đông người xem cùng lúc (khi có sự kiện) — tối ưu ở đây là *giảm tải*, không phải *giảm trễ* |

**Vấn đề traffic thật sự cần chú ý** không nằm ở việc "làm mọi thứ nhanh hơn", mà ở việc **tách hạ tầng tầng 1 khỏi tầng 3**: khi có bão lớn, tầng 3 hứng traffic đông (nhiều người dân mở app xem cùng lúc) đúng lúc tầng 1 cần tài nguyên ổn định nhất để ra cảnh báo. Nếu dùng chung một API/DB, traffic công khai tăng đột biến có thể làm nghẽn luôn đường cảnh báo vận hành — nên tách API/queue/rate-limit riêng cho 2 luồng này (đã nêu ở báo cáo `technical-analysis-real-deployment.md` §5), thay vì cố scale toàn bộ hệ thống đồng đều.

---

## 8. Tóm tắt các thành phần cần xây mới (chưa tồn tại ở cả 2 repo)

| Thành phần | Trạng thái |
|---|---|
| Script GeoJSON → SWMM `.inp` (2a) | Chưa có — cần viết mới |
| Nguồn DEM + land use raster | Chưa có dữ liệu, cần khảo sát/mua |
| GRASS/ITZI chạy headless (không GUI) | Chưa có — eWM hiện là desktop app tương tác, cần tách engine layer |
| Ingestion dữ liệu mưa/mực nước thời gian thực | Chưa có — cả 2 repo đều dùng dữ liệu giả lập |
| Bảng ánh xạ `swmm_node_id ↔ muid` | Chưa có |
| Backend API + WebSocket + TimescaleDB + job queue | Chưa có — cả 2 repo đều không có backend |
| Nowcasting (ngoại suy ngắn hạn) | Chưa có |
