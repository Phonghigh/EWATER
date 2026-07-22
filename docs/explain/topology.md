# `Topology` interface — dùng để làm gì

Nguồn: [web/src/types.ts:20-24](../../web/src/types.ts#L20-L24), build bởi [`buildTopology()`](../../web/src/loadData.ts#L28) trong `loadData.ts`.

```ts
export interface Topology {
  downstream: Record<string, { link: string; node: string }[]>;
  upstream: Record<string, { link: string; node: string }[]>;
  linkNodes: Record<string, [string, string]>;
}
```

## 1. Bài toán

Mạng lưới thoát nước là một **đồ thị có hướng**: node = hố ga/outlet (`network_nodes`), cạnh = đoạn ống (`network_links`), hướng cạnh = chiều nước chảy (từ cao xuống thấp theo độ dốc thiết kế).

Ứng dụng cần trả lời 2 câu hỏi ngược chiều nhau, lặp lại nhiều lần khi người dùng tương tác trên bản đồ:

- **Xuôi dòng (downstream):** "Node X tắc/ngập → những node/ống nào phía sau bị ảnh hưởng?" → dùng để highlight vùng hạ lưu chịu tác động.
- **Ngược dòng (upstream):** "Node X đang ngập → nguyên nhân từ đâu?" → dùng để truy vết nguồn gốc sự cố.

## 2. Vì sao cần cả 2 chỉ mục (`downstream` *và* `upstream`)

Dữ liệu gốc trong DB chỉ có 1 danh sách cạnh có hướng (`network_links.from_node_muid → to_node_muid`, xem [migration schema](../../web/supabase/migrations/20260720111710_network_gis_schema.sql#L31-L45)). Hướng dòng chảy đã nằm sẵn trong `from`/`to` — **không cần suy luận gì thêm**, `from` luôn ở cao độ (`up_level`) cao hơn `to` (`down_level`) vì ống hoạt động theo trọng lực.

Vấn đề không phải là "biết hướng nào" mà là **tốc độ tra cứu theo chiều ngược**. Nếu chỉ giữ danh sách cạnh xuôi (`from → to`), muốn biết "ai chảy *vào* node C" phải quét toàn bộ danh sách cạnh — O(m) mỗi lần tra, với m = tổng số ống. Một lượt BFS ngược (root-cause trace) cần tra như vậy lặp lại ở mỗi bước, nên chi phí cộng dồn thành O(m × số bước) — chậm rõ khi mạng lưới có hàng nghìn ống và người dùng tương tác trực tiếp trên bản đồ.

`buildTopology()` giải quyết bằng cách đánh chỉ mục 1 lần lúc load data:

```
network_links.from_node_muid = A, to_node_muid = B
        │
        ├─► downstream[A] += { link, node: B }   // tra "A chảy đi đâu" = O(1)
        └─► upstream[B]   += { link, node: A }   // tra "B nhận từ đâu" = O(1)
```

Đổi lấy: build tốn O(m) một lần duy nhất, mỗi truy vấn sau đó là O(1) thay vì O(m). Đây là pattern **forward + reverse adjacency list** quen thuộc trong các bài toán đồ thị có hướng (ví dụ Course Schedule II, Network Delay Time) khi cần duyệt cả 2 chiều.

`linkNodes` là tiện ích phụ theo chiều còn lại: tra từ **link → 2 node đầu cuối** (dùng khi người dùng click chọn 1 đoạn ống trên bản đồ, cần biết ngay 2 đầu của nó mà không lục lại toàn bộ `downstream`/`upstream`).

## 3. Trạng thái hiện tại

`Topology` được build sẵn trong `AppData.topology` mỗi lần `loadData()` chạy, nhưng **chưa có UI/tính năng nào tiêu thụ nó** — đây là hạ tầng chuẩn bị trước cho tính năng truy vết lan truyền sự cố (impact trace / root-cause trace) thuộc roadmap "Urban Flood Digital Twin" (xem `tasks/INDEX.md`). Không lưu bảng riêng trong Supabase vì suy ra được hoàn toàn từ `network_links`.

## 4. Rủi ro / điều cần biết khi phát triển tiếp

- Không có ràng buộc DB nào enforce `from_node` phải cao hơn `to_node`. Nếu dữ liệu GIS gốc bị nhập sai hướng ở đâu đó, `buildTopology()` sẽ tin theo và mọi kết quả trace sau đó sẽ sai — chưa có bước validate tính nhất quán hướng dòng chảy (có thể kiểm tra chéo bằng `up_level >= down_level` hoặc `invert_level` của `from_node`/`to_node`).
- BFS xuôi/ngược trên `downstream`/`upstream` cho kết quả "tập node có thể tới được" (reachable set) theo **số bước (hop)**, không phải theo thời gian nước chảy thực tế. Nếu cần độ chính xác đó, phải chuyển sang thuật toán có trọng số (dựa `length`/`slope` của từng `link`) thay vì BFS thuần.
- `outlet` (điểm xả cuối mạng lưới, không có `diameter`) phải luôn là `to_node`, không bao giờ là `from_node` — vì là điểm cuối dòng chảy, không có `downstream`.
