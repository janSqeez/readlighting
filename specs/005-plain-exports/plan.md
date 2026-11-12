# Plan 005: Plain exports (JSON, Markdown)

- **Spec:** ./spec.md
- **Status:** Draft

## 1. Approach
Characterization only, no production code changes. Code under test: `src/services/exporter.ts`.
Tests live in `src/services/transfer.test.ts`; they were written against the real behaviour and are green on the first run.

## 2. Alternatives considered
| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Characterization tests at service level | stable, fast, no UI needed | UI wiring not covered | chosen |
| Component/e2e tests | cover the user flow | need more tooling, brittle | later, for UI areas |

## 3. Data / API / interface changes
None.

## 4. Risks and mitigations
Tests pin quirks as-is (marked `known quirk`); fixing them later requires a new feature spec that supersedes the AC.

## 5. Decisions worth an ADR
None.

## 6. Test strategy
| AC | Level | Test case (Given / When / Then) | Expected first run | Notes |
|----|-------|----------------------------------|--------------------|-------|
| AC-005-01 | integration (fileExport mocked) | Given a document, JSON export has the expected filename and fields. | green (existing behaviour) | |
| AC-005-02 | integration | Given no url and no comment, then null and "" are written. | green (existing behaviour) | |
| AC-005-03 | integration | Given highlights and notes, Markdown has title, source, Markierungen with emoji and comment, then Notizen. | green (existing behaviour) | |
| AC-005-04 | integration | Given no highlights and blank notes, both sections are omitted. | green (existing behaviour) | |
