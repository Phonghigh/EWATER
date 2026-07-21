# Blockers

When a task can't be finished (ambiguity, a decision only the user can make, or
a failing verification that can't be resolved), it's marked `- [!]` in
[INDEX.md](INDEX.md) and recorded here. Review these, resolve, then clear the
marker.

Format:

```
## <task-id> <title>
- blocked on: <what is unclear / failing>
- need from you: <the specific decision or info>
- date: <YYYY-MM-DD>
```

---

<!-- blockers below -->

## REAL-DATA-01 Nguồn dữ liệu thật thay thế `shared/data/*` mock
- blocked on: người dùng đã cung cấp `swmm_open(17_10).inp` (input model EPA-SWMM
  thật) và đã tạo migration `20260720111710_network_gis_schema.sql`, nhưng có
  nhiều chỗ không khớp giữa 3 nguồn (mock JSON hiện dùng / file SWMM thật /
  schema DB đã tạo) nên `dashboardService.ts` (P1-01) đang phải giả định âm
  thầm ở vài chỗ: outlet (44 feature trong `outlets.geojson`) hoàn toàn không
  có entry trong `simulation.nodeFill` (0/44) nên luôn bị coi là "khô ráo";
  ngưỡng ngập `SURCHARGE=1.0` là số cố định toàn cục trong khi SWMM thật có
  cột `Surcharge Depth` riêng theo từng node; đơn vị của `simulation.rainfall[step]`
  (mm tích lũy/step hay mm/h tức thời?) chưa được xác nhận; ID node trong SWMM
  thật (1–75 + outfall "151") không khớp muid trong `manholes.geojson` (lên
  tới 956) — chưa có bảng crosswalk. Chi tiết đầy đủ nằm trong lịch sử hội
  thoại phiên 2026-07-20 (không có file audit riêng — xem lại chat nếu cần).
- need from you: (1) xác nhận ý nghĩa thật của 44 "outlet" (bơm? cống? điểm xả
  phụ?) — hỏi đơn vị GIS/tư vấn cung cấp `shared/data/`; (2) xác nhận đơn vị
  `simulation.rainfall`; (3) quyết định có mở rộng migration hiện tại (thêm
  `surcharge_depth`/`ponded_area` lên `network_nodes`, bảng `transects`,
  `subcatchments`/`raingages`, bảng crosswalk ID) trước khi đổ dữ liệu thật
  vào, hay giữ nguyên schema tối giản và xử lý các gap này ở tầng service.
- update 2026-07-20 (rivers vs transects): `rivers.geojson` (43 đoạn, MIKE) và
  `transects` (4 mặt cắt, SWMM: `cochien`/`kenh1`/`kenh2`/`K1`) khác quy mô chi
  tiết, chưa rõ map 1-1 hay là 2 tầng riêng. Đã thử spatial check thô (centroid
  các node SWMM dùng mỗi transect, tìm river gần nhất theo point-to-line):
  `cochien`→`SONG TIEN2` (~226m), `kenh1`→river `'13'` (~88m), `kenh2`→river
  `'12'` (~4.6m), `K1`→`songcaulau` (~107m). **Đây chỉ là ứng viên nghi vấn,
  KHÔNG phải kết luận** — centroid quá thô so với sông dài hàng km, chưa so
  khớp toàn bộ hình học. Đã thêm cột `rivers.transect_name` (migration
  `20260720160500_river_transect_gap.sql`) nhưng để NULL, không điền các ứng
  viên trên vào DB.
- update 2026-07-20 (đã làm): (3) đã xong — migration
  `20260720152009_static_data_gaps.sql` đã áp lên project Supabase thật
  (`muvywdvjihszxdwcqjnt`, đã `migration repair` để đồng bộ lịch sử vì
  `20260720111710` từng được chạy tay ngoài CLI). Đã import dữ liệu tĩnh thật
  bằng `data-pipeline/import_static_data.py`: `network_nodes` 878,
  `network_links` 795 (**49 link bị bỏ qua** vì `fromNode`/`toNode` không tồn
  tại trong `network_nodes` — con số thật là 49, không phải 10 như `PLAN.md`
  ghi trước đây, đã sửa lại; 5 trong số đó rỗng cả 2 đầu — dữ liệu hỏng thật
  sự, không chỉ thiếu tham chiếu), `rivers` 43, `drainage_boundary`/
  `catchments`/`province_boundaries`/`raingages` 1 mỗi bảng, `subcatchments`
  75 (đủ hình học từ `[Polygons]`), `transects` 4. Cột mới
  (`surcharge_depth`/`ponded_area`) và bảng `node_id_crosswalk` **để trống**
  — (1) và (2) vẫn treo, chưa có gì để đổ vào các cột/bảng đó.
- update 2026-07-20: truy nguồn `outlets.geojson` tới `SHP/Outlets.shp`
  (shapefile MIKE URBAN, đọc bởi `data-pipeline/convert_shp.py`). File `.dbf`
  gốc có field `TypeNo` mà script convert bỏ qua (không nằm trong `keep` list,
  dòng 34–38) — nhưng đọc trực tiếp thì `TypeNo=3` đồng nhất cho cả 44/44
  outlet (tương tự `Manholes.dbf`/`Links.dbf` đều có `TypeNo` đồng nhất =1),
  nên **không phải field phân loại bơm/cống**. Metadata `Outlets.shp.xml` cho
  thấy schema MIKE URBAN gốc có field `PMTypeNo`/`PMLevel`/`QHTypeNo`/
  `OutletQHID` (đúng kiểu field để phân loại bơm/đập tràn) nhưng **các field
  này không tồn tại trong `.dbf` thực tế đang có** — nghĩa là câu hỏi (1)
  không thể tự trả lời được từ bất kỳ file nào trong repo; cần xin lại
  project MIKE URBAN gốc hoặc bản export đầy đủ hơn từ đơn vị tư vấn, không
  chỉ shapefile 3-field hiện có.
- update 2026-07-20: truy nguồn gốc lỗi "49 link bị bỏ qua" ở trên — đọc trực
  tiếp `SHP/Links.dbf` (844 record, khớp chính xác `links.geojson`, không có
  gì bị mất/hỏng trong `convert_shp.py`) và xác nhận **49 record đã bị hỏng/
  thiếu ngay trong file MIKE URBAN gốc**, không phải lỗi convert hay lỗi
  import. Phát hiện thêm 1 pattern hệ thống: trong 44/49 dòng có dữ liệu
  (44+5 rỗng = 49), **luôn luôn** là `FROMNODE` tồn tại còn `TONODE` không tồn
  tại — chưa từng có chiều ngược lại. Giả thuyết hợp lý nhất: model gốc từng
  có nhiều node hơn 834+44 hiện tại, một đợt xóa node "hạ nguồn" trong lúc
  chỉnh sửa model đã không đồng bộ với các link đang trỏ tới chúng, để lại
  link mồ côi. 3 giá trị `TONODE` dạng lạ (`0L6`, `0L10A`) không khớp bất kỳ
  quy ước đặt tên muid nào đã biết — có thể là lỗi gõ tay. Cần đơn vị tư vấn
  đối chiếu 49 `muid` link này (danh sách đầy đủ nằm trong log hội thoại
  phiên 2026-07-20, cũng in ra khi chạy `data-pipeline/import_static_data.py`)
  với model MIKE URBAN gốc để xác nhận `TONODE` thật sự là node nào — không
  tự suy đoán/bịa vì sẽ tạo dữ liệu giả trong `network_links`.
- date: 2026-07-20
