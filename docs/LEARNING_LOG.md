# Learning Log — web redesign

Current phase: Phase 0 — Nền tảng (see [tasks/INDEX.md](../tasks/INDEX.md))

Scoped to the **web redesign** initiative (`web/src` → Urban Flood Digital Twin
sidebar UI). Concepts already covered by the pre-existing EWATER build (MapLibre
basics, GeoJSON, Supabase auth, zustand, recharts) aren't re-logged here unless
a task pushes them further than before.

## Concepts & Knowledge

| Concept | Status | Last touched | Notes |
|---|---|---|---|
| Shared "delta stat" type reuse (`DeltaStat`/`ScenarioImpactResult`) | not-started | 2026-07-20 | One shared shape (`value`+`delta`) for every "+Δ" stat card across Dashboard/Forecast/What-if/Impact, and one shared 4-metric bundle (`ScenarioImpactResult`) reused by forecast/whatif/impact services since they're all views onto the same underlying flood-impact numbers. See [P0-01 report](learn-log/P0-01-extend-types.md) §4. |
| Mock/real "service seam" (fixed signature, swappable body) | not-started | 2026-07-20 | `web/src/data/*.ts` fixes each page's data-access function signature now (typed args/return) while the body is a mock or a `throw` placeholder — a future real backend swap touches one file, not every caller. See [P0-02 report](learn-log/P0-02-data-service-skeleton.md) §4. |
| "No session" as a real supported state (guest) | not-started | 2026-07-20 | `session == null` used to mean "loading/must log in"; the new access model treats it as a legitimate third tier (Guest, view-only Dashboard access) — no context shape change needed, only how routes interpret it. See [P0-04 report](learn-log/P0-04-auth-2-roles.md) §4. |
| "Documentation component" (renders unconditionally, on purpose) | not-started | 2026-07-20 | `RequireGuestOrRole` does nothing at runtime — its value is making "this route is deliberately open" legible at the route definition, vs. an unguarded route reading as possibly-forgotten. See [P0-05 report](learn-log/P0-05-require-role-guards.md) §4. |
| Two independent nested React Router layout routes (shell vs. auth gate) | not-started | 2026-07-20 | `AppShell` (Sidebar+TopBar+`<Outlet/>`) wraps *every* route, `RequireAuth` (auth gate) nests *inside* it but only around the routes that need it — `/` sits as AppShell's direct child, skipping the gate. Two concerns that used to be one wrapper are now two composable layers. See [P0-10 report](learn-log/P0-10-appshell-router.md) §4. |
| YAGNI applied to your own recent scaffolding, not just old code | not-started | 2026-07-20 | Deleted a `data/` service-skeleton built earlier *this same session* specifically for future phases to fill in — "I understand why it's unused" isn't the same claim as "it's not unused." See [P0-16 report](learn-log/P0-16-delete-unused-reverse-scaffold-policy.md) §4. |
| Verify bundle contents by a library's own literal strings | not-started | 2026-07-20 | Chunk size numbers alone couldn't prove recharts was/wasn't bundled (Supabase's sub-clients are legitimately large too) — grepping the output for recharts' `recharts-` CSS class prefix (survives minification as a runtime string) gave an unambiguous answer. See [P0-16 report](learn-log/P0-16-delete-unused-reverse-scaffold-policy.md) §4/§6. |

Status values: `not-started`, `shaky`, `understood`.

## Mind Map

```mermaid
mindmap
  root((EWATER web redesign))
    Understood
    Shaky
    Not started
```
