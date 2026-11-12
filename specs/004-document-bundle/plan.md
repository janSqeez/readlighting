# Plan 004: Document bundle export/import (.readlighting.json)

- **Spec:** ./spec.md
- **Status:** Draft

## 1. Approach
Characterization only, no production code changes. Code under test: `src/services/documentBundle.ts`.
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
| AC-004-01 | integration (fileExport mocked) | Given a document and a highlight, export writes the expected filename, mime and JSON structure. | green (existing behaviour) | |
| AC-004-02 | integration | Given `fs.contentHash`, then the bundle uses it. | green (existing behaviour) | |
| AC-004-03 | integration | Given an unknown bundle, import creates a local document and its highlights with original colors/comments/dates. | green (existing behaviour) | |
| AC-004-04 | integration | Given a bundle imported twice, then nothing is duplicated and 1 highlight is reported skipped. | green (existing behaviour) | |
| AC-004-05 | integration | Given a known document with own notes, import keeps them. | green (existing behaviour) | |
| AC-004-06 | integration | Given a known document with empty notes, import fills them from the bundle. | green (existing behaviour) | |
| AC-004-07 | integration | Given a foreign JSON, import throws "Keine gültige Readlighting-Datei". | green (existing behaviour) | |
| AC-004-08 | integration | Given two highlights in one bundle imported twice, both are skipped and none duplicated. | green (existing behaviour) | |
