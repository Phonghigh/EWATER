-- Chuẩn bị để FE (web/src) đọc thẳng Supabase qua supabase-js/PostgREST thay
-- vì bundle shared/data/*.json tĩnh. 2 việc:
--
-- 1. View "_geojson" cho mỗi bảng có cột `geom` (kiểu PostGIS geometry) -
--    PostgREST không tự serialize `geometry` thành GeoJSON, cần
--    ST_AsGeoJSON(geom)::json qua 1 view riêng.
-- 2. Siết quyền: kiểm tra thấy role `anon`/`authenticated` đang có cả
--    INSERT/UPDATE/DELETE/TRUNCATE trên các bảng này (do cấu hình
--    auto-expose cũ) - đây là lỗ hổng thật, client web (dùng anon key) không
--    bao giờ được sửa dữ liệu GIS/mô phỏng tham chiếu. Chỉ giữ SELECT.

-- ---------------------------------------------------------------------
-- 1. Views GeoJSON
-- ---------------------------------------------------------------------

create view network_nodes_geojson as
  select muid, node_type, invert_level, ground_level, diameter,
         max_depth, init_depth, surcharge_depth, ponded_area,
         ST_AsGeoJSON(geom)::json as geom
  from network_nodes;

create view network_links_geojson as
  select muid, from_node_muid, to_node_muid, up_level, down_level, length,
         slope, diameter, manning_n, inlet_offset, outlet_offset, shape,
         ST_AsGeoJSON(geom)::json as geom
  from network_links;

create view rivers_geojson as
  select topo_id, river_name, length, transect_name, ST_AsGeoJSON(geom)::json as geom
  from rivers;

create view drainage_boundary_geojson as
  select id, name, ST_AsGeoJSON(geom)::json as geom from drainage_boundary;

create view catchments_geojson as
  select id, ST_AsGeoJSON(geom)::json as geom from catchments;

create view province_boundaries_geojson as
  select code, name, ST_AsGeoJSON(geom)::json as geom from province_boundaries;

create view subcatchments_geojson as
  select name, raingage_name, outlet_node_name, area_ha, pct_impervious, width_m,
         pct_slope, curb_length, n_imperv, n_perv, s_imperv, s_perv, pct_zero,
         route_to, infil_max_rate, infil_min_rate, infil_decay, infil_dry_time,
         infil_max_infil, ST_AsGeoJSON(geom)::json as geom
  from subcatchments;

create view flood_zones_geojson as
  select zone, node_count, run_id, severity, ST_AsGeoJSON(geom)::json as geom
  from flood_zones;

-- ---------------------------------------------------------------------
-- 2. Siết quyền - client (anon/authenticated) chỉ đọc, không ghi.
--    service_role (dùng bởi script import qua Management API) không bị ảnh
--    hưởng bởi REVOKE này (service_role bypass RLS/grants theo mặc định).
-- ---------------------------------------------------------------------

revoke insert, update, delete, truncate on
  network_nodes, network_links, rivers, drainage_boundary, catchments,
  province_boundaries, raingages, subcatchments, transects, swmm_conduits,
  swmm_outfalls, node_id_crosswalk, simulation_runs, simulation_node_fill,
  rain_forecasts, rain_forecast_points, tide_scenarios, tide_levels,
  flood_zones
from anon, authenticated;
