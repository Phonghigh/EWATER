import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useT } from "../i18n/I18nContext";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const t = useT();
  const { session, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Always land on "/" - RoleHome sends citizens on to /my-area, others see the Portal.
  // (Deliberately not honoring a "from" deep-link here: it would be captured from whichever
  // role was previously logged out, which can be wrong for the next role that signs in.)
  if (session) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const msg = await signIn(email, password);
    setSubmitting(false);
    if (msg) setError(t("login.error"));
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>{t("app.title")}</h1>
        <p className="login-subtitle">{t("login.subtitle")}</p>
        <label>
          {t("login.email")}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          {t("login.password")}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="login-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? t("login.submitting") : t("login.submit")}
        </button>
      </form>
    </div>
  );
}
