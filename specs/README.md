# Specs — Spec Driven + Test Driven Development

A **spec is the source of truth** for a feature. Tests are its executable form; code is derived from both.
Order of work: **Spec → Plan → Tasks → Tests (red) → Code (green).**
Agents help write every artifact, but **a human approves every gate** (Human in the Loop).

## When is a spec required?

| Change | Spec? |
|--------|-------|
| Touches data integrity, security, auth, or a public API/contract | **Yes** |
| New user-visible feature | **Yes** (keep it short) |
| Bugfix, UI polish, refactoring, dependency bump | No — commit + PR is enough (a bugfix still gets a regression test) |
| Existing, untested feature you want to protect | **Retro-spec** (`/sdd-retro`) |

## Layout

```
specs/
├── README.md                this file — the process
├── constitution.md          non-negotiable rules every spec must respect
├── _templates/              spec.md, plan.md, tasks.md — copy to start a feature
├── decisions/               ADRs (why is the SYSTEM designed this way) — immutable once accepted
└── NNN-short-name/
    ├── spec.md              WHAT + WHY   (no tech stack)
    ├── plan.md              HOW          (design, alternatives, test cases §6)
    └── tasks.md             small, individually testable steps
```

`NNN` is a running number (`001-login`). One folder per feature, small enough to finish in a few PRs.

## Status and human gates

The sign-off **is the commit** that changes the `Status:` line (`git log -p -- specs/NNN-*/spec.md` is the record,
the PR review is the second pair of eyes). No separate sign-off table.

`Draft` → **Gate 1** → `Approved` → **Gate 2** → `Tests Approved` → implement → **Gate 3** → `Implemented`

| Gate | Agent prepares | Human checks | Result |
|------|----------------|--------------|--------|
| **1 — Spec** | spec + plan | Problem clear? Requirements testable? Constitution respected? Open questions closed? | commit `docs(specs): approve spec NNN` |
| **2 — Tests** | tests derived from the acceptance criteria | Every `AC` has a test? Each test really checks the criterion? **Red for the right reason** (feature missing, not a typo)? | commit `test(spec-NNN): approved tests` + status `Tests Approved` |
| **3 — Done** | Definition-of-Done report | Diff reviewed, checkpoint question answered without AI help | status `Implemented`, PR merged |

The agent never moves a spec to the next status and never starts a phase before the previous gate is signed.

## Implementation loop (after Gate 2)

Run `/sdd-implement`. A Stop hook (`.claude/hooks/sdd-verify.mjs`) re-runs the verification commands from
`.claude/sdd.config.json` while `.claude/implementing` exists.

1. **Freeze the tests.** Approved tests are never edited to make them pass. A wrong test means a wrong *spec*:
   stop, fix the spec, get the gate signed again, then adapt the test.
2. Implement task by task. Run the spec's tests after each change, then the full suite.
3. **Stop and ask the human** if: 5 iterations without progress on the same test · the spec is ambiguous or
   contradicts the constitution/another spec · a fix needs a frozen test or a module outside the plan.
4. No hacks: no hard-coded expected values, no skipped/weakened tests, no `--no-verify` to hide failures.
5. Check the Definition of Done, hand over for Gate 3.

## Definition of Done

- [ ] Every `AC` of the spec has a passing test (`node scripts/sdd-check.mjs`)
- [ ] Full verification passes (tests, type-check, lint, format — see `.claude/sdd.config.json`)
- [ ] Frozen tests unchanged since Gate 2: `git diff <gate-2-commit>..HEAD -- <test files>` is empty
- [ ] Constitution check in `spec.md` still true
- [ ] Docs updated; new architectural decision → ADR
- [ ] Spec status `Implemented`, PR template filled, checkpoint question answered

## Traceability (requirement → test → code)

- IDs are globally unique and carry the spec number: `FR-001-01`, `AC-001-03`.
- Test titles start with the criterion: `it('AC-001-03: rejects an expired token', …)`.
- `node scripts/sdd-check.mjs` (run it in CI) fails if a `Tests Approved`/`Implemented` spec has an `AC-…` without a test.
- The PR description links the spec folder.

## Spec vs. Plan vs. ADR

| Document | Answers | Lifetime |
|----------|---------|----------|
| Spec | What must be true, and why? | lives with the feature |
| Plan | How do we build it, what did we reject? | lives with the feature |
| ADR | Why is the *system* designed this way? | immutable once accepted — supersede, don't edit |

## Migrating a traditional project

Do not write specs for everything. Order: **(1)** `/sdd-adopt` sets up the kit and the safety net · **(2)** new
features go spec-first from day one · **(3)** *before touching* existing code, write a retro-spec with
characterization tests (`/sdd-retro`) · **(4)** bugfixes get a regression test, no spec. Coverage of the old code
grows exactly where you change it.
