# Spec 004: Document bundle export/import (.readlighting.json)

- **Status:** Draft
- **Author / Date:** Claude (/sdd-retro) / 2026-11-12
- **Type:** retro-spec (documents existing behaviour)
- **Impact:** data integrity

## 1. Problem (Why)
Users move annotated documents between devices via bundle files. Import merges into existing data; a bug here duplicates or overwrites annotations.

## 2. Goals / Non-goals
- Goal: Pin the bundle format (version 1) and merge semantics on import.
- Non-goal (explicitly out of scope): File saving/sharing mechanics (`fileExport.ts`, mocked here).

## 3. Requirements
| ID | Requirement (testable, "must …") |
|----|----------------------------------|
| FR-004-01 | Export produces `<slug>.readlighting.json` with kind `readlighting-document`, version 1, content, notes, hash and highlights. |
| FR-004-02 | The bundle hash is `fs.contentHash` if present, else computed. |
| FR-004-03 | Import creates an unknown document as `local` with new ids and restores highlights incl. dates. |
| FR-004-04 | Import is idempotent: highlights already present (same offsets and text) are skipped. |
| FR-004-05 | For a known document, existing non-empty notes are kept; empty notes are filled from the bundle. |
| FR-004-06 | Files with another `kind` are rejected. |

## 4. Acceptance criteria
- **AC-004-01** (FR-004-01): Given a document and a highlight, export writes the expected filename, mime and JSON structure.
- **AC-004-02** (FR-004-02): Given `fs.contentHash`, then the bundle uses it.
- **AC-004-03** (FR-004-03): Given an unknown bundle, import creates a local document and its highlights with original colors/comments/dates.
- **AC-004-04** (FR-004-04): Given a bundle imported twice, then nothing is duplicated and 1 highlight is reported skipped.
- **AC-004-05** (FR-004-05): Given a known document with own notes, import keeps them.
- **AC-004-06** (FR-004-05): Given a known document with empty notes, import fills them from the bundle.
- **AC-004-07** (FR-004-06): Given a foreign JSON, import throws "Keine gültige Readlighting-Datei".
- **AC-004-08** (FR-004-04): Given two highlights in one bundle imported twice, both are skipped and none duplicated.

## 5. Constitution check
Highlights, comments and notes must survive export and re-import without loss; import never deletes local data.

## 6. Open questions
- [ ] Known document with different content: bundle content overwrites the local content (highlight offsets may then not match). Intended?
- [ ] Imported documents get `source: local` even if exported from a vault file.
