# Kiến thức & thuật ngữ: Expo, React Native & MapLibre

Tài liệu này giải thích các khái niệm đã gặp phải khi debug lỗi bản đồ trong `mobile/App.tsx`, để tra cứu lại khi cần.

## 1. Expo Go vs Custom Dev Client

| | Expo Go | Custom Dev Client |
|---|---|---|
| Là gì | App có sẵn trên App Store/Play Store, chỉ chạy code JS | App riêng do bạn build, chứa cả code JS lẫn native module |
| Native module bên thứ ba | ❌ Không hỗ trợ | ✅ Hỗ trợ, vì được biên dịch (compile) cùng lúc build app |
| Cách chạy | Quét QR code, mở trong app Expo Go | `npm run android` / `npm run ios` (chạy `expo prebuild` rồi build thật) |
| Khi nào dùng | Prototype nhanh, chỉ dùng module Expo hỗ trợ sẵn | Khi cần thư viện có native code riêng (bản đồ, bluetooth, v.v.) |

**Vì sao quan trọng:** `@maplibre/maplibre-react-native` có code gốc viết bằng Swift/Kotlin (native code), không phải JS thuần. Expo Go không thể "biết" các component này vì chúng không được biên dịch sẵn vào app Expo Go. Đây là nguyên nhân gốc rễ của toàn bộ lỗi bản đồ trong dự án.

## 2. Native Module

- **Native module**: đoạn code viết bằng ngôn ngữ gốc của nền tảng (Kotlin/Java cho Android, Swift/Objective-C cho iOS) được "cầu nối" (bridge) sang JavaScript để React Native gọi được.
- Ví dụ: `MapLibreGL.MapView`, `ShapeSource`, `LineLayer`, `FillLayer`, `CircleLayer`, `UserLocation`, `Camera` — mỗi component này tương ứng với 1 native view thật (`MLRNMapView`, `MLRNLineLayer`, ...).
- Nếu app không được build lại với native module này (tức là chạy trong Expo Go, hoặc dev client build cũ trước khi cài package), React Native sẽ báo:
  - `Native module ... was not registered properly`
  - `Invariant Violation: View config not found for component 'MLRN...'`

## 3. Metro Bundler & Cache

- **Metro** là bundler (công cụ đóng gói JS) mặc định của React Native/Expo, tương tự Webpack bên web.
- Metro cache lại bundle đã build để lần sau chạy nhanh hơn. Nếu sửa code nhưng Metro dùng cache cũ, lỗi cũ có thể tưởng như "không biến mất" dù code đã sửa.
- Lệnh xóa cache: `npx expo start -c` (`-c` = clear cache).
- Nếu dùng thiết bị thật/app Expo Go đang mở sẵn, cần đóng hẳn app rồi mở lại để nhận bundle JS mới, không chỉ reload.

## 4. Expo Prebuild

- `expo prebuild` sinh ra 2 thư mục `android/` và `ios/` chứa code native thật (Gradle project, Xcode project).
- Đây là bước bắt buộc trước khi build app có native module bên thứ ba.
- `npm run android` / `npm run ios` trong dự án này tự động chạy `sync-data` rồi gọi `expo run:android` / `expo run:ios`, việc này ngầm chạy prebuild nếu chưa có thư mục native.

## 5. Config Plugin (Expo)

- Vì Expo quản lý các file native (`AndroidManifest.xml`, `Info.plist`, v.v.) một cách "ẩn" (managed workflow), các thư viện cần cấu hình native riêng phải cung cấp **config plugin** để Expo biết cách chỉnh sửa các file đó lúc `prebuild`.
- Trong `mobile/app.json`, mục `"plugins": ["@maplibre/maplibre-react-native", ...]` chính là khai báo dùng config plugin của MapLibre.
- Plugin chỉ có tác dụng khi chạy `expo prebuild` / dev client — Expo Go bỏ qua hoàn toàn.

## 6. MapLibre React Native — các thay đổi API đáng chú ý (v10)

- Import kiểu cũ `import MapLibreGL from "..."` chỉ còn là **default export deprecated**, không có `setAccessToken` (khái niệm này vốn thuộc về Mapbox — dịch vụ tính phí theo token — MapLibre là bản mã nguồn mở không cần token).
- Cách import đúng cho bộ component: `import * as MapLibreGL from "@maplibre/maplibre-react-native"`.
- Prop truyền style bản đồ đổi tên: `styleJSON={JSON.stringify(style)}` (cũ) → `mapStyle={style}` (mới, nhận object trực tiếp, không cần stringify).

## 7. Tóm tắt luồng lỗi đã gặp trong dự án

1. `MapLibreGL.setAccessToken is not a function` → do dùng API cũ (Mapbox-style) trên bản MapLibre v10 mới.
2. `Property 'MapLibreGL' doesn't exist` → xóa nhầm import khi chỉ định xóa 1 dòng gọi hàm.
3. `Native module ... was not registered properly` + `View config not found for MLRNCamera` → chạy bằng Expo Go, không phải dev client.
4. Sau khi gỡ `Camera`, lỗi chuyển sang `MLRNLineLayer` → xác nhận toàn bộ thư viện (mọi native view) đều không chạy được trên Expo Go, không phải lỗi riêng của `Camera`.
5. Quyết định: tạm gỡ toàn bộ MapLibre khỏi `App.tsx`, hiển thị placeholder, chờ build dev client thật để bật lại bản đồ.

## 8. Thuật ngữ nhanh

- **JS bundle**: gói mã JavaScript đã build, được tải vào app lúc chạy.
- **Bridge**: cơ chế giao tiếp giữa JS và native code trong React Native (cũ) — kiến trúc mới hơn dùng JSI/TurboModules nhưng ý tưởng tương tự.
- **View config**: thông tin mô tả 1 native view (props, sự kiện) mà JS cần để render đúng — nếu thiếu, React Native không biết cách "vẽ" component đó → `Invariant Violation`.
- **Invariant Violation**: lỗi React Native ném ra khi một điều kiện bắt buộc (invariant) bị vi phạm — thường do thiếu native module/view config.
