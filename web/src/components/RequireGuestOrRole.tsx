import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useT } from "../i18n/I18nContext";
import { useAuth } from "../context/AuthContext";

/** Gate for the one route guests can see (Dashboard, "/"): renders children
 *  for any signed-in role OR a visitor who explicitly chose "continue as
 *  guest" on the Login page (`guestMode`). Anyone else — i.e. a fresh
 *  visitor who hasn't been through Login at all — is sent to /login first,
 *  so the app always opens on the login screen, not a silently-guest
 *  Dashboard. */
export default function RequireGuestOrRole({ children }: { children: ReactNode }) {
  const t = useT();
  const { session, loading, guestMode } = useAuth();

  if (loading) return <div className="loading">{t("app.loading")}</div>;
  if (!session && !guestMode) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
