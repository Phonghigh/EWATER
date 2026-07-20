import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

/** Top-level layout: Sidebar + TopBar + routed page content. Mounted once as
 *  the router's layout-route element (see App.tsx) so it wraps every page,
 *  guest Dashboard included. */
export default function AppShell() {
  return (
    <div className="shell">
      <Sidebar />
      <div className="shell-main">
        <TopBar />
        <main className="page-root2">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
