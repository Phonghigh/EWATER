-- RLS đã bật sẵn trên mọi bảng GIS/simulation (mặc định của Supabase cho
-- bảng mới) nhưng CHƯA có policy nào - nên dù đã REVOKE/GRANT đúng ở
-- migration trước, client (anon/authenticated) vẫn bị chặn đọc hoàn toàn
-- (RLS không có policy = deny-all). View `_geojson` không bị lộ ra vì được
-- tạo bởi role có quyền bypass RLS (owner) - nhưng loadData.ts cũng query
-- thẳng vào một số bảng gốc (simulation_runs, rain_forecasts, tide_scenarios,
-- và các bảng con), nên vẫn cần policy SELECT trên bảng gốc, không chỉ view.
--
-- Toàn bộ các bảng này là dữ liệu tham chiếu công khai (GIS/mô phỏng demo),
-- không có thông tin nhạy cảm theo người dùng -> policy SELECT mở cho cả
-- anon lẫn authenticated là hợp lý (ghi/sửa đã bị REVOKE ở migration trước).

do $$
declare
  t text;
begin
  foreach t in array array[
    'network_nodes', 'network_links', 'rivers', 'drainage_boundary',
    'catchments', 'province_boundaries', 'raingages', 'subcatchments',
    'transects', 'swmm_conduits', 'swmm_outfalls', 'node_id_crosswalk',
    'simulation_runs', 'simulation_node_fill', 'rain_forecasts',
    'rain_forecast_points', 'tide_scenarios', 'tide_levels', 'flood_zones'
  ]
  loop
    execute format(
      'create policy "public read access" on %I for select to anon, authenticated using (true);',
      t
    );
  end loop;
end $$;
