# P0-02 — data/ service layer skeleton

**Date:** 2026-07-20 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

## 1. In one sentence
Created one file per new page's data source (`web/src/data/*.ts`), each
exporting `async` functions typed against P0-01's new types — mock bodies for
now, real ones filled in phase by phase.

## 2. Where it fits
Phase 0. Every later phase's first task (e.g. P4-01 `forecastService`, P6-01
`worksService`) fills in one of these files' real logic.

## 4. Concepts introduced

### The "service seam" pattern
- **Plain definition:** a function whose *signature* (name, inputs, return
  type) is fixed now, but whose *body* is a stand-in (`throw new Error(...)`)
  until a later task implements it for real.
- **Why it shows up here:** it lets every page component be written against
  a stable import (`import { fetchForecast } from "../data/forecastService"`)
  regardless of whether the mock or a real API sits behind it — swapping mock
  for real later is a one-file change, not a rewrite of every page that calls
  it.

## 5. How it was approached
`monitoringService` is the one exception — it wraps *already-real* logic
(`monitoring/stations.ts`, built in an earlier session), so it isn't a stub.
The other six are pure signatures, deliberately throwing rather than
returning fake-looking zeros, so that if a page accidentally calls one before
its phase lands, the failure is loud and obvious instead of silently
rendering an empty dashboard.

## 6. Where it got stuck
No real snags — additive-only, `tsc --noEmit` stayed clean throughout.

## 7. How to verify it yourself
```bash
cd web && npx tsc --noEmit
```
Expected: no output.
