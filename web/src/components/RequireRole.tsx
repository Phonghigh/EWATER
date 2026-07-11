import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, type Role } from "../context/AuthContext";

export default function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { profile } = useAuth();
  if (!profile) return null;
  if (!roles.includes(profile.role)) {
    return <Navigate to={profile.role === "citizen" ? "/my-area" : "/"} replace />;
  }
  return <>{children}</>;
}
