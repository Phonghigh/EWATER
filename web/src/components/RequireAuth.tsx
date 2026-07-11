import { Navigate, Outlet } from "react-router-dom";
import { useT } from "../i18n/I18nContext";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth() {
  const t = useT();
  const { session, profile, loading } = useAuth();

  if (loading) return <div className="loading">{t("app.loading")}</div>;
  if (!session || !profile) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
