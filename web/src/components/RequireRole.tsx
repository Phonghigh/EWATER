import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, type Role } from "../context/AuthContext";

/** Gate for routes that need a specific signed-in role (e.g. admin-only
 *  /admin/*). A guest (profile == null) is redirected home — use
 *  RequireAuth upstream in the route tree to send guests to /login instead
 *  when the route requires *some* signed-in role but doesn't fit here. */
export default function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { profile } = useAuth();
  if (!profile) return null;
  if (!roles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
