-- Bổ sung field còn thiếu trên network_links (Manning N, offset, shape) và
-- 1 bảng riêng cho dữ liệu CONDUITS/XSECTIONS/LOSSES thật từ SWMM.
--
-- Cùng lý do như subcatchments/transects (xem migration trước): SWMM CONDUITS
-- dùng "Name" của SWMM cho Inlet/Outlet Node ("1".."75", "151"), KHÔNG khớp
-- muid của network_nodes (đã verify bằng spatial check ở phiên trước - node
-- cùng ID cách nhau 668m-2013m ngoài đời). Nên bảng `swmm_conduits` dùng
-- from_node_name/to_node_name dạng text, KHÔNG FK sang network_nodes.

-- ---------------------------------------------------------------------
-- 1. Mở rộng network_links: field SWMM có nhưng MIKE links.geojson không có.
--    NULL cho 795 link hiện tại - chưa có nguồn thật để điền, không đoán.
-- ---------------------------------------------------------------------

alter table network_links
  add column manning_n double precision,
  add column inlet_offset double precision,
  add column outlet_offset double precision,
  add column shape text;

comment on column network_links.shape is
  'CIRCULAR hay IRREGULAR (đoạn sông dùng mặt cắt transects). NULL = chưa biết - nguồn MIKE không có field này.';

-- ---------------------------------------------------------------------
-- 2. swmm_conduits - dữ liệu CONDUITS+XSECTIONS+LOSSES thật từ SWMM,
--    tự thân (không FK network_links/network_nodes) vì khác hệ ID.
-- ---------------------------------------------------------------------

create table swmm_conduits (
  name text primary key,                 -- SWMM Name, vd '64', '107'
  from_node_name text not null,          -- SWMM Name, KHÔNG map sang network_nodes.muid
  to_node_name text not null,
  length double precision not null,
  manning_n double precision not null,
  inlet_offset double precision,         -- NULL nếu SWMM ghi '*' (mặc định)
  outlet_offset double precision,
  init_flow double precision not null default 0,
  max_flow double precision not null default 0,
  shape text not null,                   -- CIRCULAR/IRREGULAR
  diameter double precision,             -- Geom1 khi shape=CIRCULAR
  transect_name text references transects(name), -- Geom1 khi shape=IRREGULAR
  barrels integer not null default 1,
  inlet_loss double precision,
  outlet_loss double precision,
  avg_loss double precision,
  flap_gate boolean not null default false
);

comment on table swmm_conduits is
  'Ống/kênh thật từ model SWMM (swmm_open(17_10).inp). ID node riêng của SWMM, chưa nối được với network_links/network_nodes (MIKE) - xem node_id_crosswalk và tasks/BLOCKERS.md REAL-DATA-01.';
