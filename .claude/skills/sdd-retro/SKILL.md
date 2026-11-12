---
name: sdd-retro
version: 1.0.0
tags: [sdd, tdd, spec-driven]
description: Create a retro-spec with characterization tests for EXISTING code before changing it (legacy migration to SDD). Use for "bestehenden Code absichern", "retro-spec", "/sdd-retro <area>". Documents current behaviour as spec + AC-tagged tests that are green on the first run.
---

# sdd-retro

Goal: put a safety net under existing behaviour **before** it is refactored or extended. Talk to the user in their language.

## 1. Scope
Take one cohesive area (a module, endpoint, workflow) — not the whole app. Read the code, its callers and any
existing tests/docs. Use `git log` on the files to learn *why* odd behaviour exists.

## 2. Spec (`Type: retro-spec`)
New folder `specs/NNN-name/` from the templates, `Status: Draft`. Describe **observed** behaviour as FR/AC in
Given/When/Then. Where behaviour looks like a bug, do not decide: list it under *Open questions* as
"current behaviour X — intended?" and characterize it as-is, marked `(known quirk)`.

## 3. Characterization tests
Plan §6: every row `Expected first run = green (existing behaviour)`. Write tests named `AC-NNN-xx: …`.
Pin real behaviour by running the code; do not infer from names. Prefer the narrowest level that is stable
(unit > integration > e2e). If code cannot be tested without refactoring, note the seam needed in the plan
and do **not** refactor yet.

## 4. Verify
Run the new tests (`specTestCmd` in `.claude/sdd.config.json`): all must be **green**. A red test means your
understanding is wrong — fix the test. Mutation sanity check: briefly break the code under one test and confirm
it goes red, then revert.

## 5. Hand over
Report AC → test → result, quirks, and open questions. The human reviews and commits `Approved` and `Tests Approved`
(both gates in one PR is fine for retro-specs). Only afterwards may the area be changed — via a normal feature spec.
