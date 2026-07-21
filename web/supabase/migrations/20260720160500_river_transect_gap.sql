-- rivers (43 đoạn sông/kênh chi tiết, từ MIKE) vs transects (4 mặt cắt ngang,
-- từ SWMM) - khác quy mô chi tiết, CHƯA verify được map 1-1.
--
-- Đã thử spatial check (centroid các node dùng transect -> tìm river gần
-- nhất): cochien~226m gần 'SONG TIEN2', kenh1~88m gần river '13', kenh2~4.6m
-- gần river '12', K1~107m gần 'songcaulau'. Khoảng cách nhỏ nhưng KHÔNG đủ
-- kết luận (centroid thô, sông dài hàng km) - xem tasks/BLOCKERS.md
-- REAL-DATA-01. KHÔNG điền dữ liệu đoán vào cột này - để NULL cho tới khi có
-- xác nhận GIS thật (so khớp toàn bộ hình học, không chỉ 1 điểm trung tâm).

alter table rivers
  add column transect_name text references transects(name);

comment on column rivers.transect_name is
  'Mặt cắt ngang SWMM tương ứng (nếu sông này được mô hình hóa trong SWMM). NULL = chưa xác nhận - có ứng viên nghi vấn trong tasks/BLOCKERS.md REAL-DATA-01, chưa đủ tin cậy để điền.';
