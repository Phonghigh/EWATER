import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { AppData } from "./types";
import { loadAppData } from "./loadData";
import { I18nProvider, useT } from "./i18n/I18nContext";
import { AppDataProvider } from "./context/AppDataContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RequireAuth from "./components/RequireAuth";
import RequireRole from "./components/RequireRole";
import TopNav from "./components/TopNav";
import Login from "./pages/Login";
import Portal from "./pages/Portal";
import MyArea from "./pages/MyArea";
import Dashboard from "./pages/Dashboard";
import Monitor from "./pages/Monitor";
import MapPage from "./pages/MapPage";
import Report from "./pages/Report";
import Database from "./pages/Database";

const STAFF_ROLES = ["authority", "leadership"] as const;

function RoleHome() {
  const { profile } = useAuth();
  if (profile?.role === "citizen") return <Navigate to="/my-area" replace />;
  return <Portal />;
}

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
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <div className="app">
                <TopNav />
                <main className="page-root">
                  <RequireAuth />
                </main>
              </div>
            }
          >
            <Route path="/" element={<RoleHome />} />
            <Route path="/my-area" element={<MyArea />} />
            <Route
              path="/dashboard"
              element={<RequireRole roles={[...STAFF_ROLES]}><Dashboard /></RequireRole>}
            />
            <Route path="/monitor" element={<Navigate to="/monitor/water-level" replace />} />
            <Route
              path="/monitor/:tab"
              element={<RequireRole roles={[...STAFF_ROLES]}><Monitor /></RequireRole>}
            />
            <Route
              path="/map"
              element={<RequireRole roles={[...STAFF_ROLES]}><MapPage /></RequireRole>}
            />
            <Route
              path="/report"
              element={<RequireRole roles={[...STAFF_ROLES]}><Report /></RequireRole>}
            />
            <Route path="/database" element={<Navigate to="/database/network" replace />} />
            <Route
              path="/database/:tab"
              element={<RequireRole roles={[...STAFF_ROLES]}><Database /></RequireRole>}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
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
