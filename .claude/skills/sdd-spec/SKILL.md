---
name: sdd-spec
version: 1.0.0
tags: [sdd, tdd, spec-driven]
description: Draft a new feature spec and plan (Gate 1 preparation) from an idea. Use for "neue Spec", "spec für X schreiben", "/sdd-spec <idea>". Produces specs/NNN-name/spec.md + plan.md (incl. test table) + tasks.md as Draft; never approves them.
---

# sdd-spec

Talk to the user in their language. You draft; the **human approves Gate 1** by committing `Status: Approved`.

## 1. Understand
Read `specs/README.md`, `specs/constitution.md`, existing specs (no overlap/contradiction) and the code areas the
idea touches. If the idea is too big for a few PRs, propose a split into several specs.
Ask **at most 3** clarifying questions, only about things that change the spec. Put everything else under
"Open questions" in the spec.

## 2. Create the folder
Next free number: `NNN-short-name` in `specs/`. Copy `specs/_templates/{spec,plan,tasks}.md`; set `Status: Draft`.

## 3. Write `spec.md` — WHAT and WHY only
- Problem in 2–3 sentences; goals **and non-goals**.
- Requirements `FR-NNN-xx`, each testable ("must …"). No tech stack, no class names.
- Acceptance criteria `AC-NNN-xx` in Given/When/Then, each linked to an FR. Include error and edge cases, not only
  the happy path. If you cannot phrase a criterion so a test can fail, it is not a criterion yet.
- Constitution check: name the rules touched.

## 4. Write `plan.md` — HOW
Approach, **at least two alternatives** with verdict, interfaces/signatures the tests will target, risks, ADR candidates.
§6 test table: one row per AC with level, concrete Given/When/Then case, expected first run (`red`).

## 5. Write `tasks.md`
Small steps, each referencing the AC it turns green.

## 6. Hand over
List: files created, open questions, constitution rules touched, and the Gate-1 checklist from `specs/README.md`.
**Do not** set `Approved`, do not write tests or code. Next step for the human: review → commit `Approved` → `/sdd-implement NNN`.
