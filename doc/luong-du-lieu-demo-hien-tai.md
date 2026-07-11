# Luồng dữ liệu hiện tại của EWATER demo (collect → tính toán → convert → hiển thị Web)

> Đây là mô tả **đúng những gì code trong repo này đang làm hôm nay** (không phải kiến trúc production tương lai — cái đó xem `technical-flow-full.md`). Trọng tâm: từng bước kỹ thuật, code nào chạy, khó ở đâu, và giải thích kỹ vấn đề **mất độ chính xác khi chuyển từ điểm ngập sang polygon** mà bạn hỏi.

```
SHP (MIKE URBAN)  →  GeoJSON  →  topology.json  →  simulation.json + flood-zones.geojson  →  Web (MapLibre)
   §1 thu thập        §2 convert      §3 build topo         §4 "tính toán" (mock)              §5 hiển thị
```

---

## 1. Thu thập dữ liệu (collect) — hiện tại chỉ có 1 loại

Toàn bộ input thật duy nhất đang có là **6 shapefile** trong `SHP/`:

| File | Nội dung | Hệ toạ độ |
|---|---|---|
| `Manholes.shp` | Hố ga: `MUID`, cao độ đáy (`InvertLeve`), cao độ mặt đất (`GroundLeve`), đường kính | EPSG:32648 (UTM 48N) |
| `Links.shp` | Đoạn cống: nối `FROMNODE → TONODE`, chiều dài, độ dốc, đường kính | EPSG:32648 |
| `Outlets.shp` | Điểm xả ra sông/kênh | EPSG:32648 |
| `Catchment_VL.shp` | Ranh lưu vực thoát nước | EPSG:32648 |
| `RanhTpVL.shp` | Ranh giới thành phố (để vẽ khung bản đồ) | EPSG:32648 |
| `SongM11VL.shp` | Sông/kênh | EPSG:32648 |

Đây là dữ liệu **tĩnh, xuất từ phần mềm MIKE URBAN** (công cụ thiết kế mạng lưới thoát nước dùng phổ biến ở VN), không có bất kỳ cảm biến/quan trắc thời gian thực nào — đúng như nêu ở `technical-flow-full.md` §1: dự án hiện chỉ có (1a), thiếu hoàn toàn mưa/mực nước thật, DEM, land use.

**Khó khăn ở bước này:**
- Field name trong `.dbf` bị giới hạn 10 ký tự (chuẩn DBF cũ) → tên cột bị cắt cụt: `InvertLeve` (không phải `InvertLevel`), `GroundLeve`, `DwLevel_C`... Phải tra field name thật bằng cách đọc header `.dbf`, không đoán được từ tên "đầy đủ".
- Toạ độ gốc là UTM 48N (đơn vị mét) chứ không phải lat/lon — nếu quên reproject, toạ độ sẽ là số hàng trăm nghìn (dễ nhận ra) nhưng dễ bug nếu chỉ transform 1 chiều (x/y) mà quên với geometry dạng MultiPolygon/MultiLineString (toạ độ lồng nhiều cấp mảng).

---

## 2. Convert SHP → GeoJSON (`data-pipeline/convert_shp.py`)

```python
TRANSFORMER = Transformer.from_crs("EPSG:32648", "EPSG:4326", always_xy=True)
```

Từng bước:
1. Đọc shapefile bằng `pyshp` (`shapefile.Reader`).
2. Lấy geometry qua `__geo_interface__` (chuẩn GeoJSON-like do pyshp cung cấp) — nhưng nó trả về **tuple**, không phải list, nên phải có hàm `list_coords()` đệ quy để convert tuple→list trước khi sửa toạ độ (JSON không có khái niệm tuple).
3. `reproject_coords()` đệ quy xuống tới tận toạ độ [x, y] cuối cùng (vì `Polygon`/`MultiLineString` có toạ độ lồng 2-3 cấp mảng tuỳ loại geometry) rồi gọi `TRANSFORMER.transform(x, y)` từng điểm một — đổi từ mét (UTM) sang độ (WGS84 lat/lon).
4. Đổi tên field theo bảng `LAYERS` (map field DBF cụt → tên rõ nghĩa dùng trong code: `InvertLeve → invertLevel`).
5. Ghi ra GeoJSON nén (không pretty-print, `separators=(",", ":")`) để giảm dung lượng file tĩnh.

### Ví dụ thật — 1 hố ga (`Point`, không lồng mảng)

Đọc thẳng từ `Manholes.shp` bằng `pyshp`, record đầu tiên (`OBJECTID=2`) ra thế này:

```python
# raw DBF fields (đã bị cắt cụt 10 ký tự):
r.fields  # ..., "InvertLeve", "GroundLeve", "Diameter", "X", "Y"
sr.record  # [2, '2', 1, -2.5, 2.0, 0.8, 604037.682129, 1133704.34351]
#            OBJECTID MUID TypeNo InvertLeve GroundLeve Diameter  X            Y

sr.shape.__geo_interface__
# {'type': 'Point', 'coordinates': (604037.6821289062, 1133704.3435058594)}
```

Vì `Point` chỉ có 1 cặp toạ độ (không lồng mảng), `list_coords()` nhận vào tuple `(604037.68, 1133704.34)`, thấy phần tử đầu là số (`int/float`) nên dừng đệ quy ngay và trả về `[604037.68, 1133704.34]`. `reproject_coords()` cũng vậy — thấy toạ độ "trần" (không phải mảng lồng) thì gọi thẳng `TRANSFORMER.transform(604037.68, 1133704.34)` → ra `(105.949995, 10.254497)` (độ kinh/vĩ WGS84).

Sau khi đổi tên field (`InvertLeve → invertLevel`, `GroundLeve → groundLevel`) và ghi ra, `manholes.geojson` có feature tương ứng:

```json
{
  "type": "Feature",
  "properties": { "muid": "2", "invertLevel": -2.5, "groundLevel": 2.0, "diameter": 0.8 },
  "geometry": { "type": "Point", "coordinates": [105.949995, 10.254497] }
}
```
→ đây chính là input cho `generate_mock_sim.py` ở §4 (`fill = (waterLevel - invertLevel) / (groundLevel - invertLevel)`, với hố ga này là `(water - (-2.5)) / (2.0 - (-2.5)) = (water + 2.5) / 4.5`).

### Ví dụ thật — 1 đoạn cống (`LineString`, lồng 1 cấp)

`Links.shp` record đầu (`MUID='267'`, nối hố ga `FROMNODE='90' → TONODE='87'`):

```python
sr.record
# [267, '267', 1, 0.23, 0.23, 4.0, -2.5, -3.0, 43.67, 0.0, 0.6, 43.67, '90', '87']
#  OBJECTID MUID TypeNo UpLevel DwLevel Length UpLevel_C DwLevel_C Length_C Slope_C Diameter SHAPE_Leng FROMNODE TONODE

sr.shape.__geo_interface__["coordinates"]
# [(606672.687, 1133228.460), (606699.754, 1133194.190)]   # LineString: mảng các cặp [x,y]
```

Ở đây `coordinates` là **1 mảng các tuple**, không phải 1 tuple số — nên `list_coords()` phải đệ quy thêm 1 lớp: với phần tử đầu tiên của mảng (`(606672.687, 1133228.460)`) nó **không** phải số mà là 1 tuple con, nên hàm gọi đệ quy `list_coords(i)` cho từng điểm trong mảng, tới khi gặp tuple `(x, y)` mới dừng. `reproject_coords()` chạy song song y hệt, cuối cùng transform **từng điểm** một trong mảng:

```json
{
  "type": "Feature",
  "properties": { "muid": "267", "fromNode": "90", "toNode": "87", "upLevel": -2.5, "downLevel": -3.0, "length": 43.67, "slope": 0.0, "diameter": 0.6 },
  "geometry": { "type": "LineString", "coordinates": [[105.9557..., 10.2510...], [105.9560..., 10.2506...]] }
}
```
→ cặp `fromNode`/`toNode` này chính là input để `build_topology.py` (§3) dựng `downstream["90"] = [{"link": "267", "node": "87"}]`.

### Ví dụ thật — `Catchment_VL.shp` (`Polygon`, lồng 2 cấp)

```python
sr2.shape.__geo_interface__["coordinates"]
# [[(609482.47, 1134099.54), (609405.11, 1133873.20), (609175.22, 1133924.93), ...]]
#  ^ mảng ring       ^ mảng điểm trong ring         ...
```

`Polygon` GeoJSON luôn là **mảng các ring** (ring ngoài + có thể có ring lỗ bên trong), mỗi ring lại là **mảng điểm**. Vậy `list_coords`/`reproject_coords` phải đệ quy **2 lớp** trước khi chạm tới cặp số `(x, y)` cuối cùng: lớp 1 duyệt qua từng ring, lớp 2 duyệt qua từng điểm trong ring đó rồi mới transform. Đây là lý do 2 hàm này viết đệ quy tổng quát (`if coords[0] is number: transform; else: recurse`) thay vì hard-code số lớp lồng — vì `Point` (0 lớp lồng), `LineString`/`MultiPoint` (1 lớp), `Polygon`/`MultiLineString` (2 lớp), `MultiPolygon` (3 lớp) đều phải dùng chung 1 hàm.

**Khó khăn:**
- Không có kiểm tra lỗi hình học (geometry tự cắt nhau, self-intersect) — vì input từ MIKE URBAN được xem là "sạch" sẵn, script tin tưởng hoàn toàn input.
- Vì convert từng điểm một qua `pyproj.Transformer.transform()` (không vector hoá), với catchment/rivers có hàng nghìn điểm thì tốn thời gian hơn cách dùng `transform_bulk`, nhưng vì dữ liệu tĩnh chỉ chạy 1 lần nên chấp nhận được.

---

## 3. Build topology (`data-pipeline/build_topology.py`)

Từ `links.geojson` (chỉ có `fromNode`/`toNode` dạng cạnh trong đồ thị), dựng ra 1 **chỉ mục đồ thị 2 chiều**:

```json
{
  "downstream": { "805": [{"link": "L12", "node": "812"}] },
  "upstream":   { "812": [{"link": "L12", "node": "805"}] },
  "linkNodes":  { "L12": ["805", "812"] }
}
```

Đây thuần là bước dựng adjacency list phục vụ tính năng **"trace up/down"** trên web (bấm 1 hố ga → tô màu toàn bộ nhánh cống phía thượng lưu/hạ lưu — xem `manholeColorNormal`/`linkColorWithTrace` trong `layers.ts` dùng `feature-state.traceUp/traceDown`). Không có logic thuỷ lực nào ở bước này, chỉ là graph traversal thuần tuý.

---

## 4. "Tính toán" mô phỏng (`data-pipeline/generate_mock_sim.py`) — đây KHÔNG phải mô hình thuỷ lực thật

Đây là phần dễ hiểu nhầm nhất: không có SWMM/ITZI nào chạy ở đây, toàn bộ là **hàm toán học sinh số liệu giả lập trông giống 1 trận mưa** (seeded `Random(42)` → luôn ra kết quả giống nhau mỗi lần build).

### 4a. Mưa (hyetograph)
```python
v = (x ** 2.2) * math.exp(-x / 1.9)   # dạng gamma, đỉnh mưa ~55mm/h lúc 7h30 sau khi mưa bắt đầu lúc 2h00
```
Thuần là 1 đường cong gamma-shape chuẩn hoá về đỉnh 55mm/h — không dựa trên trạm đo thật nào.

### 4b. Đáp ứng từng hố ga (`response_series`)
```python
state = state * decay + inflow * (1 - decay)   # lọc thông thấp (low-pass filter) / mô phỏng bể chứa tuyến tính
```
Mỗi hố ga được gán ngẫu nhiên 1 độ trễ (`lag`, 15–90 phút) và 1 hệ số suy giảm (`decay`, 0.90–0.97) rồi convolve với chuỗi mưa — về bản chất đây là **1 bể chứa tuyến tính đơn giản (linear reservoir)**, kỹ thuật thật sự có dùng trong thuỷ văn để xấp xỉ đáp ứng lưu vực, nhưng ở đây tham số hoàn toàn ngẫu nhiên, không calibrate theo địa hình/diện tích lưu vực thật.

### 4c. Gán "surcharge" giả
```python
if rng.random() < SURCHARGE_SHARE:      # 15% số hố ga
    factor = rng.uniform(1.02, 1.20)    # cho tràn (fill > 1)
else:
    factor = rng.uniform(0.35, 0.98)    # không tràn
```
15% số hố ga được "chọn" ngẫu nhiên để tràn — **không liên quan gì đến cao độ đáy/mặt đất thật hay công suất cống thật**, chỉ là roll xác suất rồi nhân vào chuỗi đáp ứng. Đây là lý do tài liệu ghi rõ trong docstring: *"deterministic... but it is DEMO DATA, not model output"*.

**Kết quả bước này**: `simulation.json` — với mỗi hố ga có 1 mảng 97 giá trị `fill` (fraction 0..1+, theo từng bước 15 phút trong 24h), và mảng mưa 97 giá trị.

---

## 5. Sinh vùng ngập (`build_flood_zones`) — ĐÂY LÀ CHỖ MẤT ĐỘ CHÍNH XÁC

Đây chính xác là vấn đề bạn nêu: **hiện tại vùng ngập không phải raster độ sâu theo pixel, mà là polygon lồi (convex hull) phồng ra từ vài điểm hố ga** — nên hình dạng rất thô, không theo địa hình thật. Chi tiết từng bước:

### 5.1. Lọc điểm ngập
```python
flooded = [m for m, s in node_fill.items() if max(s) > 1.0]
```
Chỉ lấy các hố ga có `fill` vượt 1.0 tại bất kỳ thời điểm nào trong 24h → đây là **tập điểm rời rạc** (point cloud), không phải bề mặt liên tục.

### 5.2. Gom cụm theo lưới thô 500m
```python
cell = 0.005   # ~500m theo lat/lon ở vĩ độ VN
clusters.setdefault((round(x / cell), round(y / cell)), []).append(m)
```
Chia toàn bộ khu vực thành lưới ô vuông **~500m x 500m** — bất kỳ hố ga nào rơi vào cùng 1 ô (sau khi round) được coi là "cùng cụm". Đây là bước **giảm độ phân giải đầu tiên**: 2 hố ga cách nhau 490m nhưng ở 2 phía ranh ô lưới có thể rơi vào 2 ô khác nhau (làm mất liên kết), trong khi 2 hố ga cách nhau 490m nhưng cùng phía lại bị gộp chung dù về mặt thuỷ lực có thể chẳng liên quan gì đến nhau.

### 5.3. Merge cụm liền kề (flood-fill 8 hướng)
```python
for dx in (-1, 0, 1):
    for dy in (-1, 0, 1):
        n = (c[0]+dx, c[1]+dy)   # 8 ô lân cận
```
Merge các ô lưới liền kề thành 1 nhóm lớn hơn (giống thuật toán connected-component trên lưới). Nhóm nào có **< 3 điểm bị loại bỏ hoàn toàn** — nghĩa là 1-2 hố ga bị ngập lẻ tẻ, xa các điểm ngập khác, sẽ **không hiện lên bản đồ dưới dạng vùng ngập nào cả** dù dữ liệu `nodeFill` của chính nó vẫn > 1 (chỉ hiện qua màu điểm hố ga, không có polygon phủ vùng xung quanh).

### 5.4. Convex hull — đây là bước làm mất chi tiết hình dạng nhiều nhất
```python
hull = convex_hull(pts)   # monotone chain, O(n log n)
```
Lấy **bao lồi (convex hull)** của các điểm hố ga trong nhóm. Vấn đề: convex hull luôn là hình lồi (không có góc lõm), trong khi vùng ngập thật (dù mô phỏng bằng raster ITZI đúng cách) gần như luôn có hình dạng **lõm, ngoằn ngoèo theo địa hình** (chảy theo đường thấp, vòng qua gò đất cao, dừng lại ở vỉa hè). Với 1 nhóm chỉ có 3–10 điểm hố ga (khoảng cách trung bình giữa các hố ga trên mạng lưới cống đô thị), convex hull ra 1 đa giác rất thô — vài đỉnh, cạnh thẳng dài — không đại diện gì cho hình dạng ngập thật.

### 5.5. "Buffer" bằng cách phồng từ tâm — không phải buffer hình học thật
```python
def expand(hull, meters=180.0):
    cx, cy = centroid(hull)
    for x, y in hull:
        dx, dy = x - cx, y - cy
        norm = math.hypot(dx, dy) or 1.0
        out.append(x + dx/norm * deg_lon, y + dy/norm * deg_lat)   # đẩy từng đỉnh ra xa tâm 180m
```
Đây **không phải phép buffer hình học chuẩn** (offset polygon đúng nghĩa, ví dụ Minkowski sum hoặc `shapely.buffer()`) — mà chỉ đẩy **từng đỉnh hull** ra xa tâm cụm 180m theo hướng từ tâm tới đỉnh đó. Cách này:
- Nếu hull gần tròn đều → kết quả gần giống buffer thật.
- Nếu hull dẹt/kéo dài (nhiều hố ga thẳng hàng dọc 1 tuyến cống) → các đỉnh gần tâm bị đẩy lệch hướng khác đỉnh xa tâm, polygon phồng ra **méo mó, không đều**, không phản ánh việc nước ngập thật sẽ lan đều ra ~180m quanh mọi điểm biên.
- 180m là **hằng số cố định cho mọi zone, mọi thời điểm** — không đổi theo mức độ nghiêm trọng: 1 zone ngập nhẹ (severity 0.1) và 1 zone ngập nặng (severity 1.0) có diện tích polygon **bằng hệt nhau**, chỉ khác màu (opacity) chứ không khác hình dạng/kích thước. Trong thực tế, vùng ngập sâu hơn thường lan rộng hơn.

### 5.6. Severity — 1 con số duy nhất cho cả polygon, không có gradient
```python
vals = [(node_fill[m][t] - 0.9) / 0.35 for m in group]   # mỗi điểm 1 giá trị
severity.append(sum(vals) / len(vals))                    # rồi lấy TRUNG BÌNH cho cả nhóm
```
Mỗi bước thời gian, `severity` của cả zone là **1 con số trung bình cộng** của các điểm thành viên — nghĩa là khi vẽ lên bản đồ, **toàn bộ polygon tô 1 màu/1 độ mờ đồng nhất** (`fillOpacity = 0.55 * severity`, xem `layers.ts` dòng `flood-fill`). Không có việc chỗ gần hố ga ngập sâu thì đậm hơn, chỗ rìa polygon thì nhạt dần — tức là **mất hoàn toàn thông tin không gian về độ sâu ngập**, chỉ còn lại 1 hình khối phẳng cùng màu.

### So sánh với cách làm đúng (raster → vector có kiểm soát)
Theo đúng flow mô tả ở `technical-flow-full.md` §4, nếu có model thật (ITZI) chạy ra **raster độ sâu ngập theo pixel** (mỗi ô lưới ví dụ 5m x 5m có 1 giá trị độ sâu mét), quy trình chuẩn để đưa lên web là:
```
raster độ sâu (pixel, liên tục)
   │  r.contour / r.to.vect (GRASS) — vector hoá theo NGƯỠNG độ sâu (vd 0.1m, 0.3m, 0.5m...)
   ▼
Nhiều polygon lồng nhau theo từng ngưỡng (giống đường đồng mức) — giữ được hình dạng lõm/ngoằn theo địa hình
   │  simplify (Douglas-Peucker) — giảm số đỉnh nhưng vẫn bám sát hình dạng gốc
   ▼
GeoJSON polygon nhiều cấp độ sâu → style theo severity liên tục
```
So với cách hiện tại (convex hull từ vài điểm hố ga + buffer cố định 180m + severity trung bình 1 màu), cách trên giữ được: (a) hình dạng lõm theo địa hình thật, (b) nhiều mức độ sâu trong cùng 1 khu vực (không phải 1 màu phẳng), (c) diện tích tỷ lệ đúng với mức nước thật thay vì hằng số 180m. Đây chính là khoảng cách giữa "polygon xấp xỉ từ điểm" (đang có) và "polygon suy ra từ raster pixel" (cần có khi có model thật) mà bạn hỏi.

---

## 6. Đóng gói cho app (`sync-data.mjs` ở cả `web/` và `mobile/`)

Trước khi build, mỗi app tự copy các file tĩnh từ `shared/data/*.geojson` + `shared/config/map-style.json` vào thư mục asset riêng (`web/public/data/`, `mobile/assets/data/`). Đây chỉ là bước copy file, không transform thêm gì — nghĩa là **web và mobile luôn hiển thị đúng 1 bộ dữ liệu giống hệt nhau**, không có endpoint API nào ở giữa (khác với kiến trúc production ở §5 `technical-flow-full.md` có backend + WebSocket).

## 7. Hiển thị lên Web (`web/src/`)

1. **`loadData.ts`**: `fetch()` song song 10 file JSON tĩnh 1 lần lúc app khởi động (`Promise.all`) — không có loading tăng dần, không cache riêng ngoài cache trình duyệt mặc định.
2. **`layers.ts` → `addDataLayers()`**: thêm 7 GeoJSON source vào MapLibre, mỗi source có `promoteId` (vd `promoteId: "zone"` cho flood, `"muid"` cho manholes/links) — đây là điểm mấu chốt để dùng được **feature-state** thay vì phải nạp lại toàn bộ GeoJSON mỗi khi đổi bước thời gian.
3. **`MapView.tsx`**: khi người dùng kéo thanh trượt thời gian, code không gọi lại `source.setData()` (tốn kém, phải parse lại toàn bộ GeoJSON) mà chỉ gọi:
   ```ts
   map.setFeatureState({ source: "flood", id: p.zone }, { severity: p.severity[step] ?? 0 });
   map.setFeatureState({ source: "manholes", id: muid }, { fill: series[step] ?? 0 });
   ```
   MapLibre GL sau đó tự áp dụng lại paint expression (`fillColor`/`fillOpacity` trong `layers.ts`, vốn đọc `["feature-state", "severity"]`) và **chỉ vẽ lại trên GPU**, không tính toán lại hình học — đây là lý do tua timeline mượt dù có hàng nghìn feature.
4. Không có backend/WebSocket nào — mọi tương tác (chọn hố ga, trace up/down, tua sim) đều xử lý **hoàn toàn phía client** bằng dữ liệu đã tải sẵn.

---

## 8. Tóm tắt độ chính xác bị mất qua từng bước

| Bước | Input | Output | Mất gì |
|---|---|---|---|
| Convert SHP | Toạ độ chính xác m (UTM) | Toạ độ độ (WGS84), làm tròn 6 chữ số thập phân | Sai số ~0.1mm — không đáng kể |
| Mock sim | (không có input thật) | `fill` 0..1+ theo hố ga | Toàn bộ — đây là số giả, không phải mất mà là **chưa từng có** độ chính xác thật |
| Lọc điểm ngập | 1 giá trị fill/hố ga | Danh sách điểm rời rạc | Mất mọi thông tin giữa các hố ga (không gian liên tục) |
| Gom cụm lưới 500m | Điểm rời rạc | Nhóm điểm | Mất liên kết xuyên ô lưới, mất cụm < 3 điểm |
| Convex hull | Nhóm điểm | 1 polygon lồi | Mất hoàn toàn hình dạng lõm theo địa hình |
| Buffer 180m cố định | Polygon lồi nhỏ | Polygon phồng | Diện tích không phản ánh mức độ ngập thật |
| Severity trung bình | Nhiều giá trị/nhóm | 1 số/polygon/bước | Mất gradient độ sâu trong cùng khu vực |

**Kết luận:** vấn đề "chuyển pixel sang polygon mất độ chính xác" mà bạn nêu không nằm ở kỹ thuật vector hoá raster nói chung (kỹ thuật đó vốn kiểm soát được sai số qua `simplify`/nhiều ngưỡng độ sâu như ở mục 5 phần "so sánh"), mà nằm ở chỗ **hiện tại demo còn chưa có raster nào để vector hoá cả** — polygon đang được suy ngược từ vài chục điểm hố ga rời rạc bằng convex-hull + buffer cố định, nên bản chất đã mất chi tiết không gian ngay từ đầu, trước cả bước "chuyển sang polygon".
