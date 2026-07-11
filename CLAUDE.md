# EWATER Vĩnh Long — quy ước dự án

## Ngôn ngữ hiển thị (i18n) — bắt buộc

Ứng dụng có người dùng thật đọc cả tiếng Việt lẫn tiếng Anh; lẫn ngôn ngữ trong cùng một màn hình là lỗi nghiêm trọng, không phải lỗi thẩm mỹ.

**Web** (`web/src`): mọi text hiển thị cho người dùng phải đi qua `useT()` / `t("...")` từ [web/src/i18n/I18nContext.tsx](web/src/i18n/I18nContext.tsx). Không bao giờ hardcode chuỗi tiếng Việt hoặc tiếng Anh trực tiếp trong JSX, placeholder, title, aria-label, hay dữ liệu build sẵn để hiển thị (headers CSV, tên cột báo cáo, v.v.).
- Khi thêm text mới: thêm key ở **cả hai** khối `vi` và `en` trong [web/src/i18n/strings.ts](web/src/i18n/strings.ts) trong cùng một lần sửa — không bao giờ thêm một bên rồi để bên kia "TODO".
- Trước khi tạo key mới, rà lại các key cùng namespace (`col.*`, `dash.*`, `report.*`, `feature.*`...) xem đã có key trùng nghĩa chưa để tái dùng.
- Cơ chế fallback (`t()` = `STRINGS[lang][key] ?? STRINGS.en[key] ?? key`) im lặng khi thiếu bản dịch — không có cảnh báo runtime. Đừng ỷ lại vào việc "app không crash" để coi là dịch đủ.
- Dữ liệu sinh động (ví dụ tên trạm trong [web/src/monitoring/stations.ts](web/src/monitoring/stations.ts)) mà hiển thị trực tiếp cho người dùng cũng phải đổi theo `lang`, không hardcode cứng một ngôn ngữ.

**Mobile** (`mobile/src`): chỉ hỗ trợ tiếng Việt (quyết định có chủ đích, không nâng lên song ngữ). Mọi text hiển thị phải lấy từ `strings` trong [mobile/src/domain/i18n.ts](mobile/src/domain/i18n.ts) — không rải chuỗi tiếng Việt hardcode trong component/hook, kể cả khi nội dung không đổi theo ngôn ngữ (tránh trùng lặp, dễ quên đồng bộ khi sửa).

## Sau mỗi lần thêm/sửa feature có hiển thị text

1. Chạy `node scripts/check-i18n.mjs` — script kiểm tra key `vi`/`en` trong `strings.ts` có khớp nhau không, in cảnh báo nếu lệch. Một `PostToolUse` hook trong [.claude/settings.json](.claude/settings.json) đã tự chạy script này sau mỗi lần Edit/Write, nhưng vẫn nên tự kiểm tra lại kết quả.
2. Nếu cảnh báo có key thiếu, bổ sung ngay bản dịch còn thiếu trước khi coi task là xong.
3. Bật thử `LangToggle` (🇻🇳/🇬🇧) trên trang vừa sửa để xác nhận bằng mắt không còn chữ "kẹt" ở một ngôn ngữ.
