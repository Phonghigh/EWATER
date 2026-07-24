-- Schema lưu dữ liệu mạng lưới thoát nước / GIS / mô phỏng, nguồn từ shared/data/*.
-- Yêu cầu extension PostGIS (Supabase đã bật sẵn theo mặc định, chỉ cần "create extension" nếu chưa có).

create extension if not exists postgis;

-- ---------------------------------------------------------------------
-- 1. Nút mạng lưới (manholes.geojson + outlets.geojson)
--    Gộp chung 1 bảng vì links.fromNode/toNode + topology.json tham chiếu
--    xuyên suốt cả 2 loại muid (manhole: số, outlet: "O3"...).
-- ---------------------------------------------------------------------

create type node_type as enum ('manhole', 'outlet');

create table network_nodes (
  muid text primary key,
  node_type node_type not null,
  invert_level double precision,
  ground_level double precision,
  diameter double precision, -- null cho outlet (không có trong outlets.geojson)
  geom geometry(Point, 4326) not null
);

create index network_nodes_geom_idx on network_nodes using gist (geom);

-- ---------------------------------------------------------------------
-- 2. Ống / cống nối giữa các nút (links.geojson)
--    topology.json (upstream/downstream/linkNodes) không lưu riêng vì
--    suy ra được trực tiếp từ from_node_muid/to_node_muid bên dưới.
-- ---------------------------------------------------------------------

create table network_links (
  muid text primary key,
  from_node_muid text not null references network_nodes(muid),
  to_node_muid text not null references network_nodes(muid),
  up_level double precision,
  down_level double precision,
  length double precision,
  slope double precision,
  diameter double precision,
  geom geometry(LineString, 4326) not null
);

create index network_links_geom_idx on network_links using gist (geom);
create index network_links_from_idx on network_links (from_node_muid);
create index network_links_to_idx on network_links (to_node_muid);

-- ---------------------------------------------------------------------
-- 3. Sông (rivers.geojson)
-- ---------------------------------------------------------------------

create table rivers (
  topo_id text primary key,
  river_name text,
  length double precision,
  geom geometry(LineString, 4326) not null
);

create index rivers_geom_idx on rivers using gist (geom);

-- ---------------------------------------------------------------------
-- 4. Ranh giới / lưu vực tĩnh (boundary, catchment, province-boundary geojson)
--    Mỗi loại chỉ có 1 feature không thuộc tính -> 1 bảng đơn giản,
--    cho phép nhiều bản ghi phòng khi sau này có > 1 vùng.
-- ---------------------------------------------------------------------

create table drainage_boundary (
  id bigint generated always as identity primary key,
  geom geometry(LineString, 4326) not null
);

create table catchments (
  id bigint generated always as identity primary key,
  geom geometry(Polygon, 4326) not null
);

create table province_boundaries (
  code text primary key,
  name text not null,
  geom geometry(MultiPolygon, 4326) not null
);

create index catchments_geom_idx on catchments using gist (geom);
create index province_boundaries_geom_idx on province_boundaries using gist (geom);

-- ---------------------------------------------------------------------
-- 5. Vùng ngập & chuỗi mức độ ngập theo thời gian (flood-zones.geojson)
--    severity[] gióng theo cùng bước thời gian với simulation_runs bên dưới,
--    nên gắn với 1 run cụ thể thay vì để trôi nổi.
-- ---------------------------------------------------------------------

create table flood_zones (
  zone integer primary key,
  node_count integer not null,
  geom geometry(Polygon, 4326) not null
);

create index flood_zones_geom_idx on flood_zones using gist (geom);

-- ---------------------------------------------------------------------
-- 6. Kịch bản mô phỏng ngập (simulation.json) - 1 run = 1 lần chạy mô phỏng.
--    rainfall và nodeFill/severity đều là mảng theo step -> lưu dạng
--    numeric[] gắn theo run, khớp thẳng với cấu trúc JSON gốc, tránh nổ
--    hàng (834 node x 97 step) khi chỉ cần đọc nguyên chuỗi để phát lại.
-- ---------------------------------------------------------------------

create table simulation_runs (
  id bigint generated always as identity primary key,
  step_minutes integer not null,
  steps integer not null,
  start_time text not null, -- "00:00" dạng giờ trong ngày mô phỏng
  rainfall numeric[] not null, -- length = steps
  created_at timestamptz not null default now()
);

create table simulation_node_fill (
  run_id bigint not null references simulation_runs(id) on delete cascade,
  node_muid text not null references network_nodes(muid),
  fill_series numeric[] not null, -- length = steps, tỉ lệ đầy 0..1(+)
  primary key (run_id, node_muid)
);

alter table flood_zones
  add column run_id bigint references simulation_runs(id),
  add column severity numeric[] not null default '{}'; -- length = steps

-- ---------------------------------------------------------------------
-- 7. Dự báo mưa (rain-forecast.json) - chuỗi thời gian thực từ open-meteo.
--    Chuẩn hoá theo (ts, giá trị) để truy vấn theo khoảng thời gian dễ hơn
--    mảng phẳng, vì đây là dữ liệu refresh định kỳ chứ không phát lại 1 lần.
-- ---------------------------------------------------------------------

create table rain_forecasts (
  id bigint generated always as identity primary key,
  source text not null,
  latitude double precision not null,
  longitude double precision not null,
  generated_at timestamptz not null,
  step_hours integer not null
);

create table rain_forecast_points (
  forecast_id bigint not null references rain_forecasts(id) on delete cascade,
  ts timestamptz not null,
  precipitation_mm double precision not null,
  primary key (forecast_id, ts)
);

-- ---------------------------------------------------------------------
-- 8. Mực nước triều demo (tide-demo.json) - DỮ LIỆU GIẢ LẬP, không phải
--    trạm đo thật (xem "note" gốc trong file). Giữ nguyên cảnh báo này
--    trong cột note để không ai nhầm sang dữ liệu thật khi truy vấn DB.
-- ---------------------------------------------------------------------

create table tide_scenarios (
  id bigint generated always as identity primary key,
  note text not null,
  period_hours double precision not null,
  baseline_m double precision not null,
  amplitude_m double precision not null,
  seed integer not null,
  generated_at timestamptz not null
);

create table tide_levels (
  scenario_id bigint not null references tide_scenarios(id) on delete cascade,
  ts timestamptz not null,
  level_m double precision not null,
  primary key (scenario_id, ts)
);

-- ---------------------------------------------------------------------
-- Ghi chú: shared/config/map-style.json (màu sắc, basemap, ngưỡng hiển thị)
-- là cấu hình tĩnh của frontend, không phải dữ liệu nghiệp vụ -> KHÔNG đưa
-- vào DB, tiếp tục để nguyên dạng file JSON như hiện tại.
-- ---------------------------------------------------------------------
