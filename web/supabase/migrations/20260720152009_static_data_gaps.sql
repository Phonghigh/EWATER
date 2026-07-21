-- Bổ sung các field/bảng "dữ liệu tĩnh" (hạ tầng vật lý, ít đổi) còn thiếu so
-- với model SWMM thật (swmm_open(17_10).inp, cung cấp ngoài repo) mà migration
-- trước (20260720111710_network_gis_schema.sql) chưa có.
--
-- QUAN TRỌNG: model SWMM dùng hệ ID riêng ("Name": "1".."75" cho junction,
-- "151" cho outfall, v.v.) — đã verify bằng spatial check (reproject UTM 48N
-- -> WGS84 rồi đo khoảng cách thật) rằng ID này KHÔNG liên quan gì tới `muid`
-- của network_nodes (node cùng số ID cách nhau 668m-2013m ngoài đời). Vì vậy
-- mọi bảng nguồn gốc SWMM dưới đây dùng "Name" của SWMM làm khóa riêng, KHÔNG
-- tạo foreign key sang network_nodes(muid) — chờ có bảng crosswalk đã verify
-- bằng GIS thật (xem node_id_crosswalk cuối file) trước khi nối 2 hệ ID.

-- ---------------------------------------------------------------------
-- 1. Mở rộng network_nodes: ngưỡng surcharge/ponding theo từng node
--    (hiện dashboardService.ts phải dùng 1 ngưỡng cố định toàn cục vì
--    thiếu field này — xem tasks/BLOCKERS.md REAL-DATA-01).
--    NULL cho 878 node MIKE hiện có vì chưa có crosswalk để lấy giá trị
--    thật từ SWMM — không suy đoán giá trị.
-- ---------------------------------------------------------------------

alter table network_nodes
  add column max_depth double precision,
  add column init_depth double precision,
  add column surcharge_depth double precision,
  add column ponded_area double precision;

comment on column network_nodes.surcharge_depth is
  'Độ sâu cho phép ngập trước khi tính là tràn thật (m). NULL = chưa biết (nguồn MIKE không có field này; SWMM có nhưng dùng hệ ID khác, chưa crosswalk).';
comment on column network_nodes.ponded_area is
  'Diện tích nước đọng khi tràn (m²). NULL = chưa biết, lý do tương tự surcharge_depth.';

-- ---------------------------------------------------------------------
-- 2. Trạm mưa đăng ký trong model (RAINGAGES) — metadata tĩnh của trạm,
--    khác với *số đọc* mưa (đó là dữ liệu động, đã có ở rain_forecasts).
-- ---------------------------------------------------------------------

create table raingages (
  name text primary key,           -- SWMM Name, vd 'mua1'
  rain_type text not null,         -- INTENSITY/VOLUME/CUMULATIVE
  time_interval text not null,     -- vd '1:00'
  snow_catch_factor double precision not null,
  data_source_type text not null,  -- TIMESERIES/FILE
  data_source_name text not null   -- tên chuỗi TIMESERIES tương ứng
);

-- ---------------------------------------------------------------------
-- 3. Lưu vực con (rainfall-runoff) — SUBCATCHMENTS + SUBAREAS + INFILTRATION
--    gộp 1 bảng vì luôn đi cùng nhau theo đúng 1 subcatchment (1-1).
--    outlet_node_name: tên node SWMM nơi lưu vực đổ vào — CHƯA map sang
--    network_nodes.muid (xem ghi chú đầu file).
-- ---------------------------------------------------------------------

create table subcatchments (
  name text primary key,                 -- SWMM Name, vd '76'
  raingage_name text not null references raingages(name),
  outlet_node_name text not null,        -- SWMM Name của node nhận nước - CHƯA crosswalk
  area_ha double precision not null,
  pct_impervious double precision not null,
  width_m double precision not null,
  pct_slope double precision not null,
  curb_length double precision not null default 0,
  -- SUBAREAS
  n_imperv double precision not null,
  n_perv double precision not null,
  s_imperv double precision not null,
  s_perv double precision not null,
  pct_zero double precision not null,
  route_to text not null,                -- OUTLET/IMPERVIOUS/PERVIOUS
  -- INFILTRATION (Horton)
  infil_max_rate double precision,
  infil_min_rate double precision,
  infil_decay double precision,
  infil_dry_time double precision,
  infil_max_infil double precision,
  geom geometry(Polygon, 4326)           -- ranh giới lưu vực (từ [Polygons], reproject UTM->WGS84)
);

create index subcatchments_geom_idx on subcatchments using gist (geom);

-- ---------------------------------------------------------------------
-- 4. Mặt cắt ngang sông bất quy tắc (TRANSECTS) — bắt buộc để mô hình hóa
--    đoạn conduit dạng IRREGULAR (sông/kênh), network_links.diameter
--    không đủ chỗ chứa cho loại này.
-- ---------------------------------------------------------------------

create table transects (
  name text primary key,                 -- vd 'cochien', 'kenh1', 'kenh2', 'K1'
  roughness_left double precision not null,
  roughness_right double precision not null,
  roughness_channel double precision not null,
  station_points jsonb not null          -- [[station_m, elevation_m], ...] từ các dòng GR, theo đúng thứ tự
);

-- ---------------------------------------------------------------------
-- 5. Bảng crosswalk ID — CHƯA CÓ DỮ LIỆU, chỉ tạo cấu trúc.
--    Lý do để trống: match theo ID không dùng được (đã chứng minh sai),
--    match theo tọa độ (nearest-neighbor) mới chỉ thử nghiệm ở mức trò
--    chuyện/phân tích, CHƯA được verify đủ tin cậy để ghi vào DB như sự
--    thật — tự đoán rồi lưu vào bảng "crosswalk" sẽ đánh lừa người dùng
--    sau này tưởng đây là ánh xạ đã xác nhận. Cần làm GIS matching có
--    kiểm tra (nearest-neighbor + ngưỡng khoảng cách hợp lý + review thủ
--    công) trước khi đổ dữ liệu vào bảng này.
-- ---------------------------------------------------------------------

create table node_id_crosswalk (
  mike_muid text not null references network_nodes(muid),
  swmm_node_name text not null,
  match_distance_m double precision not null,
  verified boolean not null default false,
  primary key (mike_muid, swmm_node_name)
);

comment on table node_id_crosswalk is
  'Ánh xạ muid (MIKE) <-> Name (SWMM) cho cùng 1 vị trí thật. Rỗng cho tới khi có spatial-join đã kiểm chứng — xem tasks/BLOCKERS.md REAL-DATA-01.';
