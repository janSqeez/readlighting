# Baseline (2026-11-12)

Pre-existing failures before SDD adoption. Not regressions; not fixed during adoption.

| Command | Result |
|---------|--------|
| `npx tsc -b` | green |
| `npm run lint` | **red**: 27 problems (22 errors, 5 warnings) |
| `npm test` | green (smoke test only, Vitest added 2026-11-12) |

## Lint breakdown
- Application code (`src/`, 8 errors): `react-hooks/set-state-in-effect` (App.tsx, VaultBrowser.tsx ×2, useHighlights.ts), `react-hooks/refs` (App.tsx ×2, useShareIntent.ts ×2).
- Noise from generated/vendored code (14 errors, 5 warnings): `android/app/build/...`, `electron/build/...`, `electron/src/...`, `electron/live-runner.js`, `electron/resources/...` (`no-var-requires`, `no-explicit-any`, `no-unused-vars`). Cause: `eslint.config.js` only ignores `dist`.
