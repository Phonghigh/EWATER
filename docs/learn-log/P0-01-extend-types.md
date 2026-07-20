# P0-01 — Extend types.ts

**Date:** 2026-07-20 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

---

## 1. In one sentence
Added the TypeScript type definitions for six new page domains (forecast,
what-if, works, impact, report, admin) so later tasks can write typed code
against them instead of `any`.

## 2. Where it fits
Phase 0 — Nền tảng, in [tasks/INDEX.md](../../tasks/INDEX.md). This is pure
groundwork: nothing renders differently yet, but every later task (from P0-02
onward) that touches these domains now has a type contract to write against.

## 3. The problem
Mostly routine — but there was one real design decision: several new pages
(Dashboard, Forecast, What-if, Impact) all show the same shape of stat —
"a value, plus how much it changed" (e.g. "Diện tích ngập 12.86 km² ↑ 8.24 km²
(39%)"). Defining that shape once and reusing it, instead of retyping
`{ value: number; delta: number }` seven times, was the interesting part.

## 4. Concepts introduced

### Shared "delta stat" shape (`DeltaStat`)
- **Plain definition:** a small type — `{ value, delta, deltaPct? }` —
  representing a number plus how it changed from a reference reading.
- **Why it shows up here:** the mockups for Dashboard/Forecast/What-if/Impact
  all repeat the same "current value + up/down arrow + Δ" card pattern. One
  shared type means the future `StatCard` component (Phase 1) can take a
  single `DeltaStat` prop instead of three loose numbers per caller.

### Shared "scenario impact" shape (`ScenarioImpactResult`)
- **Plain definition:** a bundle of four `DeltaStat`s (flood area, max depth,
  affected households, flooded roads) — the four numbers every "what would
  this scenario do to the city" screen reports.
- **Why it shows up here:** `forecastService` (a future time horizon),
  `whatifService` (a hypothetical gate/pump configuration), and
  `impactService` (today's actual numbers) are three different *sources* for
  the exact same four-number summary. Naming that summary once means all
  three services return the same shape, and any UI built to show one
  (e.g. a 4-card row) works for all three without adaptation.

## 5. How it was approached
Considered defining each domain's types fully independently (no sharing) —
simpler to read in isolation, but would have meant three near-identical
`{ floodAreaKm2, maxDepthM, ... }` blocks drifting out of sync over time.
Chose the shared-type approach since the redesign plan already flags
`whatifService`/`forecastService`/`impactService` as closely related (all
built on the same underlying `simulation.nodeFill` data), so keeping their
result shape unified was a deliberate, planned reuse rather than a
speculative abstraction.

## 6. Where it got stuck
No real snags — this was additive-only (new exports appended after the
existing `TraceResult` interface), so there was no risk of breaking anything
already using `types.ts`.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
```
Expected: no output (clean exit) — confirms the new types compile and nothing
existing broke.

## 8. Gotchas / things to remember
- `admin`'s *real* per-user type (`Profile`, `Role`) still lives in
  `context/AuthContext.tsx` — the admin types added here are only the mock
  parts (system status, session rows, logs, backups) that have no real table
  behind them. Don't duplicate `Profile` here.
- `ForecastData.horizonsHours` is the fixed step set (e.g. `[0,6,12,24]`) that
  every per-station `forecast[]` array is indexed against — keep them in sync
  when `forecastService` (P4-01) is implemented.
