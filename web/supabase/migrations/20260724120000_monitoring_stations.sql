-- Phase 3 — Quan trắc thời gian thực. Trạm mưa quan trắc + cống có cửa van.
--
-- Nguồn dữ liệu THẬT (cảm biến quan trắc theo trạm) hiện CHƯA có — giống mọi dữ
-- liệu động khác của demo, đây là dữ liệu synthetic seeded (Random(42)) sinh bởi
-- data-pipeline/generate_monitoring_data.py và nạp qua import_dynamic_data.py.
-- Giữ đúng quy ước: dữ liệu nằm trong Postgres, KHÔNG bundle JSON tĩnh ở frontend.
--
-- Chuỗi số liệu lưu dạng numeric[] theo bước 10 phút suốt 24h (origin 00:00),
-- cùng khuôn với simulation_node_fill.fill_series — đọc nguyên mảng để phát lại
-- theo "bước hiện tại" (useCurrentSimStep) thay vì nổ hàng theo (trạm × thời gian).

create extension if not exists postgis;

-- ---------------------------------------------------------------------
-- 1. Trạm mưa quan trắc — tên là danh từ riêng (địa danh Vĩnh Long), giữ
--    nguyên ở cả 2 ngôn ngữ. rain_10min[i] = lượng mưa (mm) trong bước 10' thứ i.
-- ---------------------------------------------------------------------

create table rain_stations (
  id bigint generated always as identity primary key,
  code text unique not null,             -- mã trạm, vd "VLM_01"
  name text not null,                    -- tên trạm (địa danh), vd "Cầu Mỹ Thuận"
  elevation_m double precision,          -- cao độ trạm (m)
  status text not null default 'online', -- 'online' | 'offline'
  battery_pct integer,                   -- % pin
  signal text,                           -- cường độ tín hiệu: 'good' | 'fair' | 'weak'
  rain_10min numeric[] not null,         -- mm mỗi bước 10 phút, length = steps, origin 00:00
  geom geometry(Point, 4326) not null
);

create index rain_stations_geom_idx on rain_stations using gist (geom);

-- ---------------------------------------------------------------------
-- 2. Cống có cửa van — mực nước ngoài sông vs trong cống + trạng thái cửa.
--    3 chuỗi cùng bước 10 phút, khớp chỉ số với rain_stations.rain_10min.
--    gate_series: 1 = mở, 0 = đóng (numeric[] để dùng chung helper import).
-- ---------------------------------------------------------------------

create table culverts (
  id bigint generated always as identity primary key,
  name text unique not null,             -- tên cống, vd "Ngã Cậy" (unique để import idempotent)
  river_series numeric[] not null,       -- mực nước ngoài sông (m) mỗi bước 10'
  inside_series numeric[] not null,      -- mực nước trong cống (m) mỗi bước 10'
  gate_series numeric[] not null,        -- 1 = mở, 0 = đóng, mỗi bước 10'
  geom geometry(Point, 4326) not null
);

create index culverts_geom_idx on culverts using gist (geom);

-- ---------------------------------------------------------------------
-- 3. Views "_geojson" — PostgREST không tự serialize geometry, cần
--    ST_AsGeoJSON(geom)::json qua view riêng (giống network_nodes_geojson…).
--    Mảng numeric[] serialize thẳng thành JSON array, không cần xử lý thêm.
-- ---------------------------------------------------------------------

create view rain_stations_geojson as
  select id, code, name, elevation_m, status, battery_pct, signal, rain_10min,
         ST_AsGeoJSON(geom)::json as geom
  from rain_stations;

create view culverts_geojson as
  select id, name, river_series, inside_series, gate_series,
         ST_AsGeoJSON(geom)::json as geom
  from culverts;

-- ---------------------------------------------------------------------
-- 4. Quyền: client (anon/authenticated) chỉ đọc. Bật RLS + policy SELECT,
--    REVOKE ghi — khớp 20260720170000_expose_for_client.sql +
--    20260720173000_add_select_policies.sql. service_role (script import) bypass.
-- ---------------------------------------------------------------------

alter table rain_stations enable row level security;
alter table culverts enable row level security;

create policy "public read access" on rain_stations for select to anon, authenticated using (true);
create policy "public read access" on culverts for select to anon, authenticated using (true);

revoke insert, update, delete, truncate on rain_stations, culverts from anon, authenticated;
