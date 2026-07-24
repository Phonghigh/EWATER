import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { AppData } from "./types";
import { loadAppData } from "./loadData";
import { I18nProvider, useT } from "./i18n/I18nContext";
import { AppDataProvider } from "./context/AppDataContext";
import { AuthProvider } from "./context/AuthContext";
import RequireAuth from "./components/RequireAuth";
import RequireRole from "./components/RequireRole";
import RequireGuestOrRole from "./components/RequireGuestOrRole";
import AppShell from "./components/layout/AppShell";
import ComingSoon from "./pages/ComingSoon";
import Dashboard from "./pages/Dashboard";
import GisMap from "./pages/GisMap";
import Monitoring from "./pages/Monitoring";

const Login = lazy(() => import("./pages/Login"));

// Access matrix (see tasks/backlog/phase-0.md P0-10 / docs in the redesign
// plan): "/" is guest-visible; everything else needs authority or admin;
// "/admin/*" needs admin. Each ComingSoon placeholder below is replaced by
// its real page as that page's phase lands (Phase 1 = Dashboard, Phase 2 =
// GIS map, ... Phase 9 = Admin) - see tasks/INDEX.md.
const STAFF_ROLES = ["authority", "admin"] as const;

function Shell() {
  const t = useT();
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAppData().then(setData).catch((e) => setError(String(e)));
  }, []);

  if (error) return <div className="loading error">{t("app.loadError")}: {error}</div>;
  if (!data) return <div className="loading">{t("app.loading")}</div>;

  return (
    <AppDataProvider data={data}>
      <BrowserRouter>
        <Suspense fallback={<div className="loading">{t("app.loading")}</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<AppShell />}>
              <Route
                path="/"
                element={
                  <RequireGuestOrRole>
                    <Dashboard />
                  </RequireGuestOrRole>
                }
              />

              <Route element={<RequireAuth />}>
                <Route
                  path="/gis-map"
                  element={
                    <RequireRole roles={[...STAFF_ROLES]}>
                      <GisMap />
                    </RequireRole>
                  }
                />

                <Route
                  path="/monitoring"
                  element={
                    <RequireRole roles={[...STAFF_ROLES]}>
                      <Monitoring />
                    </RequireRole>
                  }
                />
                {/* Single-tab page now (Phase 3 redesign): old 9-sub-tab links redirect in. */}
                <Route path="/monitoring/:tab" element={<Navigate to="/monitoring" replace />} />

                <Route path="/forecast" element={<Navigate to="/forecast/overview" replace />} />
                <Route
                  path="/forecast/:tab"
                  element={
                    <RequireRole roles={[...STAFF_ROLES]}>
                      <ComingSoon title={t("nav.forecast")} />
                    </RequireRole>
                  }
                />

                <Route
                  path="/whatif"
                  element={
                    <RequireRole roles={[...STAFF_ROLES]}>
                      <ComingSoon title={t("nav.whatif")} />
                    </RequireRole>
                  }
                />

                <Route path="/works" element={<Navigate to="/works/overview" replace />} />
                <Route
                  path="/works/:tab"
                  element={
                    <RequireRole roles={[...STAFF_ROLES]}>
                      <ComingSoon title={t("nav.works")} />
                    </RequireRole>
                  }
                />

                <Route path="/impact" element={<Navigate to="/impact/overview" replace />} />
                <Route
                  path="/impact/:tab"
                  element={
                    <RequireRole roles={[...STAFF_ROLES]}>
                      <ComingSoon title={t("nav.impact")} />
                    </RequireRole>
                  }
                />

                <Route path="/reports" element={<Navigate to="/reports/overview" replace />} />
                <Route
                  path="/reports/:tab"
                  element={
                    <RequireRole roles={[...STAFF_ROLES]}>
                      <ComingSoon title={t("nav.reports")} />
                    </RequireRole>
                  }
                />

                <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
                <Route
                  path="/admin/:tab"
                  element={
                    <RequireRole roles={["admin"]}>
                      <ComingSoon title={t("nav.admin")} />
                    </RequireRole>
                  }
                />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppDataProvider>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </I18nProvider>
  );
}
