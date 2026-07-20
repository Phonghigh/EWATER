import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useT } from "../i18n/I18nContext";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";

export default function Login() {
  const t = useT();
  const { session, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Always land on "/" — Dashboard is the same page for every role (guest
  // included), it just renders more once signed in. No "from" deep-link
  // handling: captured from whichever role was previously logged out, which
  // can be wrong for the next role that signs in.
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
        <div className="login-brand">
          <Icon name="home" size={40} />
          <h1>{t("login.systemTitle")}</h1>
        </div>
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
        <p className="login-footer">{t("nav.brandTitle")} · {t("nav.brandSubtitle")}</p>
      </form>
    </div>
  );
}
