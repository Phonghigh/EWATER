-- Cột "note" từng dùng để cảnh báo tide_scenarios là dữ liệu giả lập
-- (không phải trạm đo thật). Không còn được app đọc/hiển thị, bỏ luôn
-- để tránh khai báo not null vô ích khi insert scenario mới.
alter table tide_scenarios drop column note;
