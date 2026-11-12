---
name: sdd-implement
version: 1.0.0
tags: [sdd, tdd, spec-driven]
description: Implement a feature from an approved spec following spec → plan → tests (red) → code (green). Use for "implementiere Spec 009", "/sdd-implement NNN". Checks the gates in specs/README.md, writes the tests, proves they are red, writes the code and iterates until green.
---

# sdd-implement

Implements one spec from `specs/NNN-*/` under `CLAUDE.md`, `specs/README.md` and `specs/constitution.md`.
Talk to the user in their language. **Never advance a gate and never change a spec `Status:` line** — the human does that with a commit.
Commands come from `.claude/sdd.config.json`.

## 1. Which spec?
Ask if not named. Read `spec.md`, `plan.md` (and `tasks.md`) completely.

## 2. Gate check
| `spec.md` Status | `plan.md` Status | Action |
|---|---|---|
| `Approved` | `Approved` | continue at step 3 |
| `Tests Approved` | `Approved` | tests frozen → step 5 (verify red), then step 6 |
| `Draft` / no plan / plan `Draft` | | **stop**: Gate 1 is open |
| `Implemented` / `Superseded` | | stop and say so |

Unanswered "Open questions" in `spec.md` → stop and ask.

## 3. Read the test cases
From `plan.md` §6 (AC | Level | Case | Expected first run). If missing, derive from the acceptance criteria and
**show the derived list**. Present as a table: AC → test file → case → expected first run.

## 4. Write missing tests
Search the test dirs for `AC-NNN-xx`; reuse existing, don't duplicate. Write only missing tests, named
`AC-NNN-xx: <behaviour>`, following the project's existing test style. Target the interfaces named in the plan;
if none, propose them and ask.

## 5. Run and verify RED
Run `specTestCmd` with `{AC}` = `AC-NNN-`. Each new test must be red **for the right reason** (feature missing —
not a typo, bad mock, or import error caused by the test). Green on a new feature = wrong test: fix it while unapproved.

**Gate 2 stop:** if the spec status is still `Approved`, show AC → test → red/green + reason and **stop**.
The human commits `Tests Approved`. No production code before that. Run the skill again afterwards.

## 6. Write the code
1. `printf '{"spec":"NNN","blocks":0}' > .claude/implementing` (activates the Stop hook `sdd-verify.mjs`).
2. Implement task by task. Touch only modules named in the plan; otherwise stop and ask.
3. Follow constitution and project conventions; no swallowed errors, no secrets.

## 7. Iterate until green
- After each change run the spec's tests, then `verifyCmds`. The hook repeats this and blocks stopping while red.
- **Never** edit, skip, weaken or delete a frozen test; no hard-coded expected values; no `--no-verify`.
  A wrong test = wrong spec → stop, explain, ask.
- Stop and ask after the configured max iterations (default 5) on the same test, or on any spec ambiguity.
- When green the hook removes the marker; otherwise `rm -f .claude/implementing`.

## 8. Hand over (Gate 3)
Report: tests per AC (green), changed files, docs/ADR needed, the Definition of Done checklist from
`specs/README.md`, and a checkpoint question for the human. Do not set `Implemented`; commit only if asked.
