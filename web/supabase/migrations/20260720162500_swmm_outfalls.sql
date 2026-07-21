-- Chi tiết outfall thật từ SWMM ([OUTFALLS]: loại outfall, chuỗi mực nước
-- biên, có cổng ngăn triều hay không). node_type='outlet' trên network_nodes
-- không đủ diễn tả (chỉ có 1 giá trị, không phân biệt loại) - nhưng cũng
-- không thể mở rộng network_nodes trực tiếp vì SWMM outfall "151" dùng ID
-- riêng của SWMM, KHÔNG khớp muid nào trong network_nodes (44 "outlet" của
-- MIKE không có field TypeNo/PMTypeNo phân loại - xem tasks/BLOCKERS.md
-- REAL-DATA-01). Nên dùng bảng tự thân, cùng pattern với raingages/transects/
-- swmm_conduits/subcatchments.

create table swmm_outfalls (
  node_name text primary key,      -- SWMM Name, vd '151'
  invert_elev double precision not null,
  outfall_type text not null,      -- FREE/NORMAL/FIXED/TIDAL/TIMESERIES
  stage_source text,               -- tên chuỗi TIMESERIES/bảng Stage-Discharge nếu có (NULL nếu FREE/NORMAL)
  tide_gate boolean not null default false
);

comment on table swmm_outfalls is
  'Outfall thật từ model SWMM (chỉ 1: node "151"). Không FK sang network_nodes - ID SWMM riêng, chưa crosswalk. 44 "outlet" trong network_nodes (nguồn MIKE) vẫn chưa rõ loại (bơm/cống/gì) - xem REAL-DATA-01.';
