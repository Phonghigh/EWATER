import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

export interface PageHeaderTab {
  to: string;
  label: string;
}

interface Props {
  title: string;
  tabs?: PageHeaderTab[];
  right?: ReactNode;
}

/** Shared "TAB N. TÊN TRANG" header + optional sub-tab row, used by every
 *  page from Phase 1 onward. Purely presentational — no data fetching. */
export default function PageHeader({ title, tabs, right }: Props) {
  return (
    <div className="page-header2">
      <div className="page-header2-top">
        <h2>{title}</h2>
        {right && <div className="page-header2-right">{right}</div>}
      </div>
      {tabs && tabs.length > 0 && (
        <nav className="page-subtabs2">
          {tabs.map((tab) => (
            <NavLink key={tab.to} to={tab.to} className="page-subtab2">
              {tab.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
