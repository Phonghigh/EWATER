import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useT } from "../i18n/I18nContext";
import { useAuth } from "../context/AuthContext";

function MailIcon() {
  return (
    <svg className="login-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="login-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 7 11 7a20.3 20.3 0 0 1-4.22 5.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

export default function Login() {
  const t = useT();
  const { session, guestMode, signIn, enterGuestMode } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          <img className="login-logo" src="/img/logo_Ewater.svg" alt="EWater" />
          <h1>{t("login.systemTitle")}</h1>
          <p className="login-tagline">{t("login.tagline")}</p>
        </div>
        <label className="login-field">
          <MailIcon />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            placeholder={t("login.email")}
            aria-label={t("login.email")}
          />
        </label>
        <label className="login-field">
          <LockIcon />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            placeholder={t("login.password")}
            aria-label={t("login.password")}
          />
          <button
            type="button"
            className="login-field-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
          >
            <EyeIcon open={showPassword} />
          </button>
        </label>
        {error && <p className="login-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? t("login.submitting") : t("login.submit")}
        </button>
        <button type="button" className="login-guest-btn" onClick={handleGuest}>
          {t("login.guest")} →
        </button>
        <p className="login-footer">
          {t("login.developedBy")}  EWater
        </p>
      </form>
    </div>
  );
}
