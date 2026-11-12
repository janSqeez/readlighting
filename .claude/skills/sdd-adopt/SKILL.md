---
name: sdd-adopt
version: 1.0.0
tags: [sdd, tdd, spec-driven]
description: Set up Spec Driven Development in an existing (or new) project and migrate it from traditional development. Use when the user says "SDD einführen", "adopt SDD", "/sdd-adopt", or the project has specs/ from the kit but .claude/sdd.config.json is still the default. Detects stack and test tooling, fills sdd.config.json, drafts the constitution, proposes a migration backlog.
---

# sdd-adopt

Talk to the user in their language. Never invent commands: verify each by running it.

## 1. Detect
Read the manifest(s) (`package.json`, `pyproject.toml`, `go.mod`, `pom.xml`, `Cargo.toml` …), CI config and
`README`/`CLAUDE.md`. Find: language, test runner, type-check, lint, format commands, where tests live and how
test files are named.

## 2. Configure `.claude/sdd.config.json`
Fill `specTestCmd` (runs only tests whose name contains `{AC}`, e.g. `pytest -k "{AC}"`, `go test -run ...`,
`vitest -t "{AC}"`), `verifyCmds`, `testDirs`, `testFilePattern`. **Run each command once** and show the result.
If the project has no tests at all: say so, propose a runner, ask before installing anything.

## 3. Baseline (safety net)
Run the full verification. Record what is already red in `specs/BASELINE.md` (date, commands, failing items) so
pre-existing failures are never mistaken for regressions. Do not fix them now.

## 4. Constitution
Draft `specs/constitution.md` from what the code and docs already enforce (error handling, security, domain rules,
regulatory references). Max ~15 checkable rules. Mark guesses as `(proposed)`. The human edits and commits it.

## 5. Wire it up
- Append `CLAUDE.sdd.md` to the project `CLAUDE.md` (create it if missing; do not duplicate if already present).
- Suggest CI/pre-push steps: verification commands + `node scripts/sdd-check.mjs`. Do not edit CI without asking.

## 6. Migration backlog
List 5–10 candidates ranked by risk × change frequency (use `git log --since=6.months --name-only | sort | uniq -c | sort -rn | head`):
areas that are critical, untested and often changed. For each: one line + suggested next step
(`/sdd-retro <area>` for existing code, `/sdd-spec <idea>` for new work). Write it to `specs/BACKLOG.md`.

## 7. Hand over
Summarise what was created/changed. The human reviews and commits. Do not commit unless asked.
