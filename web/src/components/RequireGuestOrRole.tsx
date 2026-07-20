import type { ReactNode } from "react";

/** Passthrough gate for the one route guests can see (Dashboard, "/").
 *  Renders children whether `profile` is null (guest) or any signed-in role
 *  — exists mainly to make the access matrix explicit/readable at the route
 *  definition in App.tsx, not to do real gating. */
export default function RequireGuestOrRole({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
