# `TideForecast` interface — công thức sóng sin đứng sau nó

Nguồn: [web/src/types.ts:45-53](../../web/src/types.ts#L45-L53), build bởi [`loadTide()`](../../web/src/loadData.ts#L93-L113) trong `loadData.ts`.

```ts
export interface TideForecast {
  periodHours: number;   // chu kỳ 1 đợt triều lên-xuống (giờ)
  baselineM: number;     // mực nước trung bình / "đường tâm" (m)
  amplitudeM: number;    // biên độ dao động quanh baseline (m)
  seed: number;          // seed sinh dữ liệu — tái lập được, không phải đo thật
  generatedAt: string;   // thời điểm dữ liệu này được sinh ra
  time: string[];        // mảng song song với levelM
  levelM: number[];      // mực nước dự báo (m) tại mỗi thời điểm trong time[]
}
```

## 1. Đây là dữ liệu giả lập, không phải đo đạc thật

Bảng gốc trong Supabase là `tide_scenarios` (tham số) + `tide_levels` (chuỗi giá trị) — xem migration [20260720111710_network_gis_schema.sql:148-162](../../web/supabase/migrations/20260720111710_network_gis_schema.sql#L148-L162). Comment gốc ghi rõ: *"Mực nước triều demo — DỮ LIỆU GIẢ LẬP, không phải trạm đo thật"*.

Manh mối nằm ngay trong field `seed`: đây là "hạt giống" cho bộ sinh số — nghĩa là `levelM` không đến từ trạm quan trắc, mà được **tính toán bằng công thức toán học**, và cùng 1 `seed` sẽ luôn cho ra đúng 1 chuỗi số giống hệt (tái lập được, phục vụ demo nhất quán).

## 2. Công thức — vì sao cần đúng 4 tham số này

Mực nước triều thực tế dao động lên-xuống theo chu kỳ gần giống **sóng hình sin** (dạng đơn giản hoá của thuỷ triều thật, vốn là tổng của nhiều sóng thành phần phức tạp hơn). 4 tham số `periodHours`, `baselineM`, `amplitudeM`, `seed` là đủ để tái tạo lại toàn bộ đường cong đó tại bất kỳ thời điểm `t` nào:

```
levelM(t) ≈ baselineM + amplitudeM * sin(2π * t / periodHours)
```

```
mực nước (m)
   ▲
   │      ╭──╮              ╭──╮
baseline ──┼──┼──────────────┼──┼───►  time
   │   ╭──╯  ╰──╮        ╭──╯  ╰──╮
   │  ╱          ╲      ╱          ╲
   └─┴────────────┴────┴────────────┴──
     |<-- periodHours -->|
   biên độ dao động = amplitudeM (đỉnh cách baseline)
```

Đọc từng phần của công thức:

- **`baselineM`** dịch chuyển cả đường sóng lên/xuống — không có nó thì sóng sẽ dao động quanh mực 0m, vô nghĩa về mặt vật lý (mực nước sông/kênh thực tế không bao giờ ở quanh 0).
- **`amplitudeM`** kéo giãn/co hẹp biên độ — biên độ càng lớn thì chênh lệch giữa đỉnh triều (cao) và chân triều (thấp) càng lớn.
- **`periodHours`** kéo giãn/co hẹp trục thời gian — chu kỳ càng ngắn thì sóng "lên xuống" càng nhanh. Triều thật ở Việt Nam thường có chu kỳ khoảng 12–24 giờ (bán nhật triều hoặc nhật triều), tuỳ vùng.
- **`sin(2π * t / periodHours)`**: phần `2π * t / periodHours` đổi thời gian `t` (giờ) thành "góc pha" (radian) — `sin` của một hàm tuần hoàn theo góc luôn dao động mượt trong khoảng `[-1, 1]`, nhân với `amplitudeM` sẽ ra đúng biên độ mét mong muốn.
- **`seed`** không nằm trong công thức ở trên — nó chỉ tác động phía backend/DB khi sinh ra `levelM`, có thể dùng để thêm nhiễu ngẫu nhiên nhỏ (random noise) chồng lên sóng sin lý tưởng, cho dữ liệu trông "tự nhiên" hơn một sóng sin hoàn hảo tuyệt đối.

## 3. Vì sao dùng 2 mảng song song `time` / `levelM`

Giống `RainForecast` — khớp trực tiếp với cách 2 cột được query ra từ Supabase (`.map((l) => l.ts)` và `.map((l) => l.level_m)`), và dễ đưa thẳng vào thư viện chart (trục X = `time`, trục Y = `levelM`).

## 4. Trạng thái hiện tại & rủi ro khi phát triển tiếp

- Đây là dữ liệu **placeholder** cho demo, không kết nối trạm đo triều thật — khi thay bằng nguồn dữ liệu thật (API triều/trạm quan trắc), interface `TideForecast` (`periodHours`, `baselineM`, `amplitudeM`, `seed`) sẽ không còn ý nghĩa (dữ liệu thật không có "chu kỳ/biên độ/seed" cố định kiểu này) — chỉ `generatedAt` + `time` + `levelM` là còn hợp lý, phần còn lại cần thiết kế lại.
- Field `note` (cảnh báo "dữ liệu giả lập") từng tồn tại trong interface này đã được bỏ đi (xem migration [20260721100000_drop_tide_scenarios_note.sql](../../web/supabase/migrations/20260721100000_drop_tide_scenarios_note.sql)) vì không được UI dùng tới — cảnh báo "đây là demo" giờ chỉ còn nằm trong comment migration gốc và trong tài liệu này, không còn tự nói ra qua API.
