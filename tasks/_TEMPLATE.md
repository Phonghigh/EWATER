### P<phase>-<nn> — <Short title>

**Objective.** One or two sentences: what this task delivers and why.

**Depends on.** `P?-??`, `P?-??` (or _none_).

**Touches.** Files/dirs expected to be created or changed, e.g.
`web/src/pages/Dashboard.tsx`, `web/src/data/monitoringService.ts`.

**Steps.**
1. …
2. …
3. …

**Done when.** Concrete, checkable acceptance criteria:
- …
- `cd web && npx tsc --noEmit` clean.
- `node scripts/check-i18n.mjs` clean (if any user-facing text changed).
- `npm run build` clean.

**Notes.** Gotchas, links to the relevant plan section, mock-data caveats.
