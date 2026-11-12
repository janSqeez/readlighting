# Plan 003: Local persistence (IndexedDB)

- **Spec:** ./spec.md
- **Status:** Draft

## 1. Approach
Characterization only, no production code changes. Code under test: `src/services/db.ts` (schema v2: documents, highlights, folders).
Tests live in `src/services/db.test.ts`; they were written against the real behaviour and are green on the first run.

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
| AC-003-01 | integration (fake-indexeddb) | Given a saved document, then it reads back with Date fields intact. | green (existing behaviour) | |
| AC-003-02 | integration | Given an existing id, saving again replaces the record. | green (existing behaviour) | |
| AC-003-03 | integration | Given an unknown id, `getDocument` returns undefined. | green (existing behaviour) | |
| AC-003-04 | integration | Given highlights for d1 and d2, then `getHighlightsForDocument(d1)` returns only d1's. | green (existing behaviour) | |
| AC-003-05 | integration | Given a document with highlights and another document's highlight, deleting the document removes its highlights only. | green (existing behaviour) | |
| AC-003-06 | integration | Given a highlight, `deleteHighlight` removes it. | green (existing behaviour) | |
| AC-003-07 | integration | Given a document with `fs.contentHash`, `getDocumentByContentHash` finds it; unknown hash gives undefined. | green (existing behaviour) | |
| AC-003-08 | integration | Given a document with `deletedAt`, then it and its highlights are still stored. | green (existing behaviour) | |
| AC-003-09 | integration | Given a vault folder, it can be saved, listed and deleted. | green (existing behaviour) | |
