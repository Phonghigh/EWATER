# Phân tích kỹ thuật: Đưa EWATER Vĩnh Long từ demo sang vận hành thực tế

> Tài liệu này phân tích khoảng cách giữa hiện trạng demo của dự án và một hệ thống cảnh báo/vận hành thoát nước thật, tập trung vào: nguồn dữ liệu thật cần có, độ trễ (latency), và traffic dữ liệu thời gian thực ảnh hưởng thế nào đến khả năng ra quyết định chính xác.

## 1. Hiện trạng: đây là demo tĩnh, không có backend

Toàn bộ hệ thống hiện tại chạy **không có server, không có database, không có luồng dữ liệu thời gian thực nào**:

- Dữ liệu mạng lưới (hố ga, cống, kênh, lưu vực) được convert **một lần** từ shapefile MIKE URBAN sang GeoJSON bằng `data-pipeline/convert_shp.py`, rồi copy tĩnh vào `web/public` và `mobile/assets/data` (`scripts/sync-data.mjs`).
- "Kết quả mô phỏng ngập" (`shared/data/simulation.json`) không phải là output của mô hình thủy lực, mà do `data-pipeline/generate_mock_sim.py` tự sinh bằng công thức: mưa theo đường cong gamma `(x^2.2) * exp(-x/1.9)`, mực nước từng node là bộ lọc suy giảm hàm mũ (exponential-recession) với lag/decay rút ngẫu nhiên từ `random.Random(42)` — seed cố định nên **luôn cho ra cùng một kết quả**. Docstring của chính file này ghi rõ: *"DEMO DATA, not model output."*
- "Trạm quan trắc" mưa/mực nước, van cống, trạm bơm trong `web/src/monitoring/stations.ts` cũng không đọc từ thiết bị nào cả — chúng được tạo ra bằng cách lấy lại đúng mảng `rainfall`/`nodeFill` trong `simulation.json` rồi biến đổi thêm một lớp random (`mulberry32` PRNG theo id trạm, `web/src/monitoring/rng.ts`). Trường `source: "SCADA" | "SRHMC"` chỉ là nhãn giả để trông giống hệ thống thật.
- `web/src/loadData.ts` chỉ `fetch()` các file tĩnh một lần khi load trang — không có polling, không WebSocket, không cập nhật liên tục.
- `PLAN.md` §8 tự nhận: *"Mock ≠ real results — khi có kết quả MIKE `.res1d` thật, chỉ cần thay `generate_mock_sim.py`, app không đổi."* Đây là giả định lạc quan — thực tế phần "thay bằng dữ liệu thật" mới là phần khó nhất, như phân tích dưới đây.

**Kết luận hiện trạng:** kiến trúc hiện tại được thiết kế đúng cho mục đích demo (nhanh, không cần hạ tầng, dễ deploy static lên Vercel), nhưng **không có bất kỳ thành phần nào** trong stack hiện tại (backend, DB, hàng đợi, hợp đồng dữ liệu thời gian thực) có thể tái sử dụng trực tiếp cho vận hành thật — phần map/GIS (MapLibre, topology, styling) thì tái dùng được, phần dữ liệu thì phải xây lại từ đầu.

## 2. Dữ liệu thật cần có — bản chất và nguồn lấy

| Loại dữ liệu | Bản chất | Nguồn thực tế | Thay thế cho gì trong demo |
|---|---|---|---|
| Mạng lưới tĩnh (hố ga, cống, kênh, lưu vực) | Hình học + thuộc tính công trình (cao độ đáy/mặt, đường kính, độ dốc) | Đã có sẵn từ MIKE URBAN (SHP gốc), nhưng cần **quy trình cập nhật định kỳ** khi có công trình mới — nguồn cập nhật: đơn vị quản lý hạ tầng thoát nước / Sở Xây dựng Vĩnh Long | Không đổi, nhưng hiện là "convert 1 lần", cần thành quy trình bảo trì |
| Lượng mưa thời gian thực | Chuỗi thời gian mm/h theo trạm | Trạm đo mưa tự động (tipping-bucket rain gauge) — mạng lưới của Đài Khí tượng Thủy văn khu vực Nam Bộ (chính là "SRHMC" mà code mock đã ám chỉ), hoặc lắp đặt trạm IoT riêng của dự án | `simulation.json.rainfall[]` (hiện là đường cong toán học) |
| Mực nước / độ đầy cống, kênh | Chuỗi thời gian mét hoặc % đầy | Cảm biến mực nước siêu âm/radar lắp tại hố ga trọng yếu, kênh, trạm bơm — cần lắp đặt phần cứng thật ngoài hiện trường | `simulation.json.nodeFill` (hiện là hàm suy giảm giả lập) |
| Trạng thái van/cống ngăn triều, trạm bơm | Trạng thái rời rạc (OPEN/CLOSED, ON/OFF) + lưu lượng bơm | Tích hợp SCADA/PLC thật của đơn vị vận hành hạ tầng (giao thức Modbus/OPC-UA thường gặp ở công trình thủy lợi VN) | Logic giả lập "tidal backflow" trong `stations.ts` |
| Dự báo mưa | Dự báo ngắn hạn (nowcasting 0–6h) hoặc dài hạn | API dự báo thời tiết thật (khác hẳn `windows.ts` hiện tại — chỉ là cắt cửa sổ tới của cùng chuỗi mock, không phải dự báo) | Route `/monitor/rainfall-forecast` hiện đang "giả vờ" dự báo |
| Kết quả mô hình thủy lực | Mực nước/lưu lượng tại mọi node, theo thời gian | Chạy mô hình MIKE URBAN/MIKE+ (hoặc SWMM mã nguồn mở) với input mưa thời gian thực → sinh `.res1d`/output tương đương | Toàn bộ `generate_mock_sim.py` |

Điểm mấu chốt: **dữ liệu tĩnh (bảng đầu) dễ lấy nhất** vì đã có sẵn quy trình MIKE URBAN. Các dữ liệu còn lại đều đòi hỏi **đầu tư phần cứng ngoài hiện trường và/hoặc hợp tác với cơ quan khí tượng thủy văn** — đây là rào cản lớn nhất, không phải vấn đề phần mềm.

## 3. Khó khăn kỹ thuật khi tích hợp dữ liệu thật

1. **Không có backend/DB nào để bắt đầu từ** — cần xây mới hoàn toàn:
   - Dịch vụ ingestion nhận dữ liệu cảm biến (qua MQTT/HTTP webhook tuỳ giao thức thiết bị).
   - Time-series database (TimescaleDB, InfluxDB) để lưu chuỗi mưa/mực nước — khác hẳn việc chỉ có vài file JSON tĩnh như hiện tại.
   - API layer phục vụ web/mobile thay cho `fetch()` file tĩnh.
   - Message broker (MQTT cho thiết bị IoT, có thể thêm Kafka nếu traffic lớn) để tách rời tầng thu thập và tầng xử lý.

2. **Đồng bộ hoá dữ liệu đa nguồn, đa tần suất, đa định dạng**: mưa có thể về mỗi 1–5 phút, mực nước gần liên tục, còn kết quả mô hình thủy lực chạy theo batch (không phải mỗi giây một lần được — xem mục 4). Cần pipeline ETL thời gian thực, khác hẳn kịch bản "chạy script 1 lần" hiện tại.

3. **Độ tin cậy phần cứng ngoài trời**: mất điện, mất kết nối mạng, cảm biến bẩn/hỏng, trôi số hiệu chuẩn (sensor drift) theo thời gian là chuyện thường trực với thiết bị lắp ngoài trời tại Việt Nam (mùa mưa bão). Hệ thống phải có tầng QA/validate dữ liệu (loại giá trị bất thường, nội suy khi thiếu dữ liệu) trước khi đưa vào cảnh báo — điều này hoàn toàn không tồn tại trong demo vì dữ liệu mock luôn "sạch tuyệt đối".

4. **Bảo mật khi tích hợp SCADA thật**: hệ thống điều khiển van/bơm của đơn vị vận hành hạ tầng là hạ tầng trọng yếu (critical infrastructure) — không thể expose công khai như app demo hiện tại; cần phân quyền, mạng riêng/VPN, và ranh giới rõ giữa "xem" (public) và "điều khiển" (vận hành nội bộ).

5. **Khớp toạ độ/topology giữa GIS tĩnh và thiết bị thật**: cảm biến ngoài hiện trường có ID riêng của nhà cung cấp thiết bị — cần một bảng ánh xạ (mapping) `sensorId ↔ muid` (mã hố ga/cống trong GeoJSON) và duy trì khi thiết bị được thay thế/di dời.

## 4. Độ trễ (latency) — vì sao "thời gian thực" không thực sự tức thời

Có 3 tầng trễ cộng dồn, không tầng nào bằng 0:

- **Trễ thu thập**: thiết bị IoT ngoài trời ở Việt Nam thường truyền qua NB-IoT/LoRa/GPRS, chu kỳ phổ biến 1–15 phút/lần (không phải streaming liên tục) để tiết kiệm pin/băng thông. Đây là giới hạn vật lý, không phải giới hạn phần mềm.
- **Trễ xử lý mô hình**: chạy lại mô hình thủy lực đầy đủ (MIKE/SWMM) cho toàn mạng lưới mất từ vài giây đến vài phút tuỳ độ phức tạp — **không thể chạy lại toàn bộ mô hình mỗi khi có 1 điểm dữ liệu mới về**. Hiện tại `web/src/sim/simEngine.ts` chỉ nội suy giữa các bước có sẵn trong file tĩnh nên "nhanh" — nhưng đó là vì dữ liệu đã tính sẵn từ trước, không phản ánh chi phí tính toán thật khi phải chạy mô hình on-demand.
- **Trễ hiển thị**: kiến trúc fetch tĩnh một lần (`loadData.ts`) không phù hợp cho cập nhật gần thời gian thực — cần chuyển sang push (WebSocket/SSE) hoặc polling ngắn để bản đồ cập nhật mà không cần người dùng tải lại trang.

**Hệ quả cho thiết kế**: nên tách hai luồng — (a) **nowcasting**: ngoại suy ngắn hạn nhanh (giây/phút) dựa trên xu hướng dữ liệu cảm biến gần nhất, dùng để cảnh báo tức thời; (b) **mô hình đầy đủ**: chạy định kỳ (vd mỗi 15–30 phút hoặc khi có sự kiện mưa lớn) để có kết quả chính xác hơn cho toàn mạng lưới. Việc chỉ dùng một trong hai sẽ đánh đổi hoặc tốc độ hoặc độ chính xác.

## 5. Traffic dữ liệu thời gian thực và ảnh hưởng đến ra quyết định

- **Khối lượng dữ liệu**: mạng lưới hiện có 834 hố ga, 844 cống, 44 outlet. Không cần cảm biến ở mọi điểm — nhưng ngay cả khi chỉ lắp ở một tỷ lệ nhỏ các điểm trọng yếu (điểm trũng, đầu nguồn, trạm bơm), nhân với chu kỳ gửi dữ liệu vài phút/lần và chạy 24/7 quanh năm (không chỉ mùa mưa), tổng lượng bản ghi tích luỹ vẫn đáng kể theo thời gian — cần kiến trúc lưu trữ/nén phù hợp cho time-series, không phải file JSON như hiện tại.
- **Burst traffic khi có bão/mưa lớn**: đây là lúc **tất cả** trạm cùng gửi dữ liệu dồn dập và cùng lúc nhiều người dùng (cả cán bộ vận hành lẫn người dân) truy cập app — đúng lúc hệ thống cần ổn định nhất. Cần message queue chịu được burst (buffer khi backend quá tải thay vì rớt dữ liệu), và tách API/cache cho tầng public (đọc nhiều, có thể cache/CDN) khỏi tầng vận hành nội bộ (cần dữ liệu mới nhất, không cache).
- **Ảnh hưởng trực tiếp đến độ chính xác quyết định**: nếu dữ liệu bị trễ hoặc thiếu đúng vào thời điểm cần quyết định (đóng van ngăn triều, bật bơm), cảnh báo có thể sai lệch — nguy hiểm hơn cả việc "không có cảnh báo", vì người vận hành sẽ tin vào một con số cũ mà không biết là cũ. Vì vậy cần: (a) cơ chế fallback dùng nowcasting khi mất kết nối cảm biến, và (b) giám sát chất lượng dữ liệu (báo rõ "dữ liệu bao nhiêu phút trước", trạm nào đang offline) hiển thị ngay trên UI — khác hẳn dữ liệu mock hiện tại vốn luôn đầy đủ 100%.
- **Khả năng mở rộng người dùng**: cả web (Vercel static) và mobile (Expo) hiện tại chỉ phục vụ file tĩnh nên scale gần như miễn phí; khi chuyển sang dữ liệu động, cần cân nhắc CDN/cache cho phần dữ liệu ít đổi (mạng lưới tĩnh, style bản đồ) và API riêng có rate-limit cho phần dữ liệu thời gian thực, để tránh một API bị quá tải làm sập cả app trong đúng lúc khẩn cấp.

## 6. Lộ trình đề xuất (tổng quan, theo giai đoạn)

1. **Hiện tại** — demo tĩnh, dữ liệu mock, dùng để trình bày UI/UX và chứng minh khái niệm (proof of concept).
2. **Pilot** — lắp 5–10 trạm cảm biến mưa/mực nước thật tại các điểm trọng yếu nhất, xây ingestion + time-series DB tối thiểu, vẫn giữ phần còn lại là mock để so sánh dữ liệu thật vs. mô hình.
3. **Tích hợp SCADA** — kết nối trạng thái van/bơm thật của đơn vị vận hành, thêm tầng bảo mật/phân quyền, xây cơ chế QA dữ liệu.
4. **Vận hành production** — chạy mô hình thủy lực real-time (nowcasting + batch đầy đủ), kiến trúc push dữ liệu, giám sát chất lượng dữ liệu hiển thị công khai, hạ tầng chịu tải burst mùa mưa bão.

Mỗi giai đoạn nên giữ nguyên tầng hiển thị (MapLibre, topology, styling) hiện có — đây là phần tái sử dụng tốt nhất từ demo; toàn bộ phần dữ liệu/backend cần được coi là **dự án hạ tầng riêng**, độc lập với phần "app demo" hiện tại.
