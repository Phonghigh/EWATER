import Icon from "../Icon";
import { useT } from "../../i18n/I18nContext";
import type { MonSituation } from "../../data/monitoringService";

/** Situation banner cho trang Quan trắc (exception-driven UI, feedback
 *  2026-07-24). Khác GisSituationBanner ở chỗ LUÔN hiển thị: trạng thái xanh
 *  ("bình thường") lẫn đỏ ("có vấn đề"), để trả lời "đang có chuyện gì?" trong
 *  5 giây thay vì bắt cán bộ tự quét bản đồ + bảng. Điều kiện đỏ = mưa 24h rất
 *  lớn HOẶC có trạm mất kết nối (xem monSituation). "Xem ngay" chọn + bay tới
 *  trạm nặng nhất qua state chọn chung của trang. */
export default function MonSituationBanner({
  situation,
  onViewNow,
}: {
  situation: MonSituation;
  /** Chọn + bay bản đồ tới trạm này (dùng chung selectedCode + flyNonce). */
  onViewNow: (code: string) => void;
}) {
  const t = useT();
  const { level, heavyRain, offline, onlineCount, totalCount, maxRain, worst } = situation;

  if (level === "ok") {
    const summary = t("mon.banner.summary")
      .replace("{online}", String(onlineCount))
      .replace("{total}", String(totalCount))
      .replace("{mm}", (maxRain?.mm ?? 0).toFixed(1));
    return (
      <div className="mon-situation-banner mon-situation-banner--ok" role="status" aria-label={t("mon.banner.ok")}>
        <span className="mon-situation-dot" aria-hidden="true" />
        <span className="mon-situation-text">{summary}</span>
      </div>
    );
  }

  const parts: string[] = [];
  if (heavyRain[0]) {
    parts.push(
      t("mon.banner.heavyRain")
        .replace("{name}", heavyRain[0].name)
        .replace("{mm}", heavyRain[0].r24h.toFixed(1)),
    );
  }
  if (offline.length > 0) {
    parts.push(t("mon.banner.offline").replace("{k}", String(offline.length)));
  }

  return (
    <div className="mon-situation-banner mon-situation-banner--alert" role="alert">
      <Icon name="alert-triangle" size={18} />
      <span className="mon-situation-text">{parts.join(" · ")}</span>
      {worst && (
        <button
          type="button"
          className="mon-situation-action"
          onClick={() => onViewNow(worst.code)}
        >
          {t("mon.banner.viewNow")}
        </button>
      )}
    </div>
  );
}
