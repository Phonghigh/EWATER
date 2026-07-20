# P0-12 — Reskin Login.tsx

**Date:** 2026-07-20 · **Build note:** [PROGRESS.md](../../tasks/PROGRESS.md)

## 1. In one sentence
Restyled the login card with the new branding and gradient, keeping the
existing Supabase sign-in logic untouched.

## 3. The problem
The source mockup (a different, unrelated product's login screen) labels its
field "Tên đăng nhập" (username). This app's real backend
(`AuthContext.signIn` → `supabase.auth.signInWithPassword`) only accepts an
email. Copying the mockup's label literally would have been actively
misleading — a user typing a non-email "username" would always fail to sign
in with no clear reason why.

## 5. How it was approached
Kept the label as "Email" (matching what the field actually validates)
instead of matching the mockup verbatim. This is the kind of small mismatch
worth deviating from a visual reference for — the mockup is a layout/style
guide, not a literal backend spec, and "looks right but doesn't work" is
worse than "doesn't match the mockup exactly."

## 6. Where it got stuck
No real snags. Cleaned up one loose end while in the file: an unused
`login.username` i18n key had been added speculatively in P0-03 (before this
task decided not to use it) — removed rather than left as dead weight.

## 7. How to verify it yourself
```bash
node scripts/check-i18n.mjs   # from repo root
cd web && npx tsc --noEmit && npm run build
```
Expected: i18n OK, clean typecheck, clean build.
