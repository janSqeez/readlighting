# Spec 003: Local persistence (IndexedDB)

- **Status:** Draft
- **Author / Date:** Claude (/sdd-retro) / 2026-11-12
- **Type:** retro-spec (documents existing behaviour)
- **Impact:** data integrity

## 1. Problem (Why)
All user data lives in IndexedDB. A schema or query change can lose data; there are no tests.

## 2. Goals / Non-goals
- Goal: Pin CRUD semantics, cascade delete, hash lookup and soft-delete storage of the db service.
- Non-goal (explicitly out of scope): React hooks on top (`useDocuments`, trash/restore orchestration), schema migration v0→v2 (not characterized).

## 3. Requirements
| ID | Requirement (testable, "must …") |
|----|----------------------------------|
| FR-003-01 | Documents, highlights and vault folders are stored by id; saving an existing id replaces it. |
| FR-003-02 | Highlights can be queried per document. |
| FR-003-03 | Deleting a document deletes its highlights (and only its own). |
| FR-003-04 | Documents are findable by `fs.contentHash`. |
| FR-003-05 | Soft-deleted documents (`deletedAt`) remain stored with their highlights. |

## 4. Acceptance criteria
- **AC-003-01** (FR-003-01): Given a saved document, then it reads back with Date fields intact.
- **AC-003-02** (FR-003-01): Given an existing id, saving again replaces the record.
- **AC-003-03** (FR-003-01): Given an unknown id, `getDocument` returns undefined.
- **AC-003-04** (FR-003-02): Given highlights for d1 and d2, then `getHighlightsForDocument(d1)` returns only d1's.
- **AC-003-05** (FR-003-03): Given a document with highlights and another document's highlight, deleting the document removes its highlights only.
- **AC-003-06** (FR-003-01): Given a highlight, `deleteHighlight` removes it.
- **AC-003-07** (FR-003-04): Given a document with `fs.contentHash`, `getDocumentByContentHash` finds it; unknown hash gives undefined.
- **AC-003-08** (FR-003-05): Given a document with `deletedAt`, then it and its highlights are still stored.
- **AC-003-09** (FR-003-01): Given a vault folder, it can be saved, listed and deleted.

## 5. Constitution check
User data stays local. No silent data loss: deletion is explicit and cascades only to the document's own highlights.

## 6. Open questions
- [ ] `getDocumentByContentHash` returns only the first of several documents with the same hash. Can duplicates occur?
- [ ] Schema upgrade path from v0/v1 is not characterized.
