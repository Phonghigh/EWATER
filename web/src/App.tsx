import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { AppData } from "./types";
import { loadAppData } from "./loadData";
import { I18nProvider, useT } from "./i18n/I18nContext";
import { AppDataProvider } from "./context/AppDataContext";
import TopNav from "./components/TopNav";
import Portal from "./pages/Portal";
import Dashboard from "./pages/Dashboard";
import Monitor from "./pages/Monitor";
import MapPage from "./pages/MapPage";
import Report from "./pages/Report";
import Database from "./pages/Database";

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
        <div className="app">
          <TopNav />
          <main className="page-root">
            <Routes>
              <Route path="/" element={<Portal />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/monitor" element={<Navigate to="/monitor/water-level" replace />} />
              <Route path="/monitor/:tab" element={<Monitor />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/report" element={<Report />} />
              <Route path="/database" element={<Navigate to="/database/network" replace />} />
              <Route path="/database/:tab" element={<Database />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppDataProvider>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  );
}
