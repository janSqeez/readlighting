# Plan 006: Full database backup and restore

- **Spec:** ./spec.md
- **Status:** Draft

## 1. Approach
Characterization only, no production code changes. Code under test: `src/services/backup.ts`.
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
| AC-006-01 | integration (fileExport mocked) | Given stored data, the backup has the expected name and contents. | green (existing behaviour) | |
| AC-006-02 | integration | Given a backup and an emptied DB, restore reproduces documents and highlights incl. createdAt dates. | green (existing behaviour) | |
| AC-006-03 | integration | Given a changed document, restore overwrites it with the backup version. | green (existing behaviour) | |
| AC-006-04 | integration | Given `{"documents":1}`, restore throws "Ungültiges Backup-Format". | green (existing behaviour) | |
| AC-006-05 | integration | Given a trashed document, after restore `deletedAt` is an ISO string, not a Date (known quirk). | green (existing behaviour) | |
