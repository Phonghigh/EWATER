import type { Status } from "./status";

export const strings = {
  appTitle: "EWATER Vĩnh Long",
  demoBadge: "DỮ LIỆU MÔ PHỎNG",
  locating: "Đang xác định vị trí...",
  noLocation: "Không xác định được vị trí của bạn.",
  refreshLocation: "Làm mới vị trí",
  currentStatus: "Trạng thái hiện tại",
  status: {
    ok: "Bình thường",
    warn: "Cảnh báo",
    bad: "Đang ngập",
  } satisfies Record<Status, string>,
  forecastFlood: (time: string) => `Dự báo có thể ngập sau khoảng ${time} nữa.`,
  forecastNone: "Không dự báo ngập trong thời gian tới.",
  mapLoadError: "Không có kết nối mạng để tải bản đồ.",
  locationPermissionDenied: "Bạn chưa cho phép ứng dụng truy cập vị trí.",
  locationFetchError: "Không thể lấy vị trí hiện tại.",
  minutesUnit: "phút",
  riskIndexLabel: "Chỉ số rủi ro",
  dragHint: "Kéo bản đồ để xem tình trạng ngập ở nơi khác",
  manualFallbackHint: "Bạn vẫn có thể kéo bản đồ để chọn vị trí.",
  recommendation: {
    ok: "Có thể di chuyển bình thường.",
    warn: "Nên hạn chế đi xe máy qua khu vực này, theo dõi thêm.",
    bad: "Không nên di chuyển qua khu vực này. Cân nhắc đưa xe lên nơi cao.",
  } satisfies Record<Status, string>,
};
