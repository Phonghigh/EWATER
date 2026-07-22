import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useT } from "../i18n/I18nContext";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const t = useT();
  const { session, guestMode, signIn, enterGuestMode } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Always land on "/" — Dashboard is the same page for every role (guest
  // included), it just renders more once signed in. No "from" deep-link
  // handling: captured from whichever role was previously logged out, which
  // can be wrong for the next role that signs in.
  if (session || guestMode) {
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

  function handleGuest() {
    enterGuestMode();
    navigate("/", { replace: true });
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <img className="login-logo" src="../../public/img/logo_Ewater.svg" alt="EWater" />
          <h1>{t("login.systemTitle")}</h1>
        </div>
        {/* <p className="login-subtitle">{t("login.subtitle")}</p> */}
        <label>
          {/* {t("login.email")} */}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            placeholder={t("login.email")}
          />
        </label>
        <label>
          {/* {t("login.password")} */}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            placeholder={t("login.password")}
          />
        </label>
        {error && <p className="login-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? t("login.submitting") : t("login.submit")}
        </button>
        <button type="button" className="login-guest-btn" onClick={handleGuest}>
          {t("login.guest")}
        </button>
        <p className="login-footer">
          {t("login.developedBy")}  EWater
        </p>
      </form>
    </div>
  );
}
