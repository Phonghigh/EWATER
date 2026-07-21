-- Sửa alias cột trên các view *_geojson tạo ở migration trước
-- (20260720170000_expose_for_client.sql): DB dùng snake_case
-- (from_node_muid, invert_level...) nhưng AppData/dashboardService.ts đã
-- viết sẵn theo camelCase từ thời mock GeoJSON cũ (fromNode, invertLevel...).
-- Sửa view để giữ đúng shape cũ - không sửa code TS đang tiêu thụ nó.

drop view network_nodes_geojson;
create view network_nodes_geojson as
  select muid, node_type,
         invert_level as "invertLevel",
         ground_level as "groundLevel",
         diameter, max_depth, init_depth, surcharge_depth, ponded_area,
         ST_AsGeoJSON(geom)::json as geom
  from network_nodes;

drop view network_links_geojson;
create view network_links_geojson as
  select muid,
         from_node_muid as "fromNode",
         to_node_muid as "toNode",
         up_level as "upLevel",
         down_level as "downLevel",
         length, slope, diameter, manning_n, inlet_offset, outlet_offset, shape,
         ST_AsGeoJSON(geom)::json as geom
  from network_links;

drop view rivers_geojson;
create view rivers_geojson as
  select topo_id as "topoId",
         river_name as "riverName",
         length, transect_name,
         ST_AsGeoJSON(geom)::json as geom
  from rivers;

drop view flood_zones_geojson;
create view flood_zones_geojson as
  select zone,
         node_count as "nodes",
         run_id, severity,
         ST_AsGeoJSON(geom)::json as geom
  from flood_zones;
