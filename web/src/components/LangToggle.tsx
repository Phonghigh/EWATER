import { useI18n } from "../i18n/I18nContext";

export default function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="lang-toggle">
      <button className={lang === "vi" ? "active" : ""} onClick={() => setLang("vi")} title="Tiếng Việt">
        VN
      </button>
      <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")} title="English">
        EN
      </button>
    </div>
  );
}
