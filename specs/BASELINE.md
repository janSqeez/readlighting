# Baseline (2026-11-12)

Status before SDD adoption: `tsc -b` green, tests none, `npm run lint` red (22 errors, 5 warnings).

**Resolved the same day:** `android/`, `electron/` and `backups/` are ignored by ESLint (platform shells, generated output);
the 8 react-hooks errors in `src/` were fixed (latest-callback refs moved into effects, intentional
setState-in-effect patterns annotated with `eslint-disable-next-line … -- reason`).

Current state: `npm test` (52 tests), `npm run type-check`, `npm run lint` and `npm run build` are all green. Nothing is red.
