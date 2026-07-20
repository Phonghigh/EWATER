// Bilingual string dictionary (Vietnamese default, English toggle).
// Keys are dot-namespaced by area. Missing keys fall back to the key itself.
//
// Kept pruned to exactly what the current live component tree uses — see
// tasks/PROGRESS.md's "delete unused, don't pre-scaffold" entry. Add
// page-specific namespaces only when that page's real code lands (see
// tasks/INDEX.md), not ahead of time.

export type Lang = "vi" | "en";

type Dict = Record<string, string>;

export const STRINGS: Record<Lang, Dict> = {
  vi: {
    "app.loading": "Đang tải dữ liệu Vĩnh Long…",
    "app.loadError": "Không tải được dữ liệu",
    "app.noData": "Không có dữ liệu",

    "nav.brandTitle": "VĨNH LONG",
    "nav.brandSubtitle": "Nền tảng số ngập lụt đô thị",
    "nav.dashboard": "Tổng quan (Dashboard)",
    "nav.gisMap": "Bản đồ GIS",
    "nav.monitoring": "Quan trắc thời gian thực",
    "nav.forecast": "Dự báo",
    "nav.whatif": "What-if Analysis",
    "nav.works": "Công trình & Vận hành",
    "nav.impact": "Thiệt hại & Tác động",
    "nav.reports": "Báo cáo",
    "nav.admin": "Quản trị hệ thống",
    "nav.logout": "Đăng xuất",

    "role.guest": "Khách",
    "role.authority": "Cơ quan",
    "role.admin": "Admin",

    "login.systemTitle": "HỆ THỐNG GIÁM SÁT NGẬP LỤT TỈNH VĨNH LONG",
    "login.subtitle": "Đăng nhập để xem thông tin ngập lụt Vĩnh Long",
    "login.email": "Email",
    "login.password": "Mật khẩu",
    "login.submit": "Đăng nhập",
    "login.submitting": "Đang đăng nhập…",
    "login.error": "Email hoặc mật khẩu không đúng",

    "common.comingSoon": "Trang đang được xây dựng, sẽ ra mắt trong các cập nhật tiếp theo.",
  },
  en: {
    "app.loading": "Loading Vĩnh Long data…",
    "app.loadError": "Failed to load data",
    "app.noData": "No data",

    "nav.brandTitle": "VĨNH LONG",
    "nav.brandSubtitle": "Urban Flood Digital Twin Platform",
    "nav.dashboard": "Overview (Dashboard)",
    "nav.gisMap": "GIS Map",
    "nav.monitoring": "Real-time Monitoring",
    "nav.forecast": "Forecast",
    "nav.whatif": "What-if Analysis",
    "nav.works": "Structures & Operations",
    "nav.impact": "Damage & Impact",
    "nav.reports": "Reports",
    "nav.admin": "System Administration",
    "nav.logout": "Logout",

    "role.guest": "Guest",
    "role.authority": "Authority",
    "role.admin": "Admin",

    "login.systemTitle": "VĨNH LONG PROVINCE FLOOD MONITORING SYSTEM",
    "login.subtitle": "Sign in to see flood information for Vĩnh Long",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Sign in",
    "login.submitting": "Signing in…",
    "login.error": "Incorrect email or password",

    "common.comingSoon": "This page is under construction and will ship in an upcoming update.",
  },
};
