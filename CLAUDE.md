## Spec + Test Driven Development (Human in the Loop)
A feature starts with a spec, not with code: **spec → plan → tasks → tests (red) → code (green).**
You may draft spec and tests, but a human signs off each gate; never advance a phase or a spec `Status:` yourself.
- Process, gates, definition of done: `specs/README.md` — rules that must hold: `specs/constitution.md`
- Approved tests are **frozen**: never edit or weaken a test to make it pass; a wrong test means a wrong spec — stop and ask.
- Iterate until green; after 5 failed iterations on one test or on any spec ambiguity, stop and ask.
- Test names start with the criterion ID (`AC-001-03: …`); check with `node scripts/sdd-check.mjs`.
- Bugfixes (with regression test), UI polish and refactorings don't need a spec.
- Skills: `/sdd-adopt` (set up / migrate) · `/sdd-spec` (draft spec+plan) · `/sdd-retro` (retro-spec for existing code) · `/sdd-implement` (tests red → code green)
