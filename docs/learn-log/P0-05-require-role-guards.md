# P0-05 — RequireRole (2 roles) + RequireGuestOrRole

**Date:** 2026-07-20 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

## 1. In one sentence
Simplified the role route-guard to the new 2-role model, and added a tiny
passthrough component whose only job is to make the access matrix readable
at the route definitions.

## 3. The problem
`RequireGuestOrRole` doesn't actually *do* anything — it renders its
children unconditionally. Worth a note on why write a component that does
nothing.

## 4. Concepts introduced

### A "documentation component" (renders unconditionally, on purpose)
- **Plain definition:** a component whose value is making intent legible at
  the call site, not enforcing behavior.
- **Why it shows up here:** in `App.tsx` (P0-10), every protected route will
  be wrapped in `RequireAuth`+`RequireRole roles={[...]}`. The one route
  that's genuinely open (`/`) could just skip any wrapper — but seeing *no*
  guard next to a route reads ambiguously ("was this forgotten?"). Wrapping
  it in `RequireGuestOrRole` instead makes "yes, this is deliberately
  open to guests" explicit to the next reader.

## 5. How it was approached
Considered skipping this component entirely and just not wrapping `/` in
anything — rejected because of the ambiguity above; a one-line no-op
component is cheap insurance against a future reader (or agent) "fixing" the
apparently-missing guard.

## 6. Where it got stuck
No real snags.

## 7. How to verify it yourself
Both components compile in isolation; end-to-end behavior is verified once
wired into the router in P0-10/checked in P0-13.
