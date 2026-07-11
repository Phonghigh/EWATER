import type { Status } from "./status";

export const strings = {
  appTitle: "EWATER Vĩnh Long",
  demoBadge: "DỮ LIỆU MÔ PHỎNG",
  tabStatus: "Tình trạng",
  tabMap: "Bản đồ",
  locating: "Đang xác định vị trí...",
  noLocation: "Không xác định được vị trí của bạn.",
  pickOnMap: "Chọn vị trí trên bản đồ",
  changeLocation: "Đổi vị trí",
  viewOnMap: "Xem trên bản đồ",
  refreshLocation: "Làm mới vị trí",
  currentStatus: "Trạng thái hiện tại",
  status: {
    ok: "Bình thường",
    warn: "Cảnh báo",
    bad: "Đang ngập",
  } satisfies Record<Status, string>,
  forecastFlood: (time: string) => `Dự báo có thể ngập sau khoảng ${time} nữa.`,
  forecastNone: "Không dự báo ngập trong thời gian tới.",
  pickPrompt: "Chạm vào bản đồ để chọn vị trí của bạn",
  cancel: "Hủy",
  mapLoadError: "Không có kết nối mạng để tải bản đồ.",
};
