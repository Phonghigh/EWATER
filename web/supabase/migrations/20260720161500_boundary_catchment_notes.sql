-- drainage_boundary / catchments: đã kiểm tra .dbf gốc (RanhTpVL.shp,
-- Catchment_VL.shp) - chỉ có OBJECTID/FID (ID nội bộ GIS, không mang nghĩa),
-- KHÔNG có tên/mã vùng nào bị convert_shp.py bỏ sót (khác với vụ Outlets có
-- sẵn TypeNo mà quên giữ). Thêm cột name cho drainage_boundary để sẵn sàng
-- khi có ai điền tay/xác nhận tên vùng - để NULL vì không có nguồn thật.
--
-- catchments (1 polygon lớn, ranh giới nghiên cứu tổng) và subcatchments
-- (75 lưu vực con thật, đã import từ SWMM ở migration trước) là 2 khái niệm
-- KHÁC NHAU, không phải catchments "còn thiếu" 75 lưu vực - phần đó đã có ở
-- bảng subcatchments rồi. Ghi rõ bằng comment để khỏi nhầm lẫn sau này.

alter table drainage_boundary
  add column name text;

comment on column drainage_boundary.name is
  'Tên vùng ranh giới (nếu có). NULL = nguồn RanhTpVL.shp không có field tên, chưa có ai xác nhận tay.';

comment on table catchments is
  'Ranh giới lưu vực nghiên cứu tổng (1 polygon lớn, từ Catchment_VL.shp) - KHÁC với subcatchments (75 lưu vực con chi tiết, từ SWMM SUBCATCHMENTS). Không nhầm 2 bảng này.';
