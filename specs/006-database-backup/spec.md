# Spec 006: Full database backup and restore

- **Status:** Draft
- **Author / Date:** Claude (/sdd-retro) / 2026-11-12
- **Type:** retro-spec (documents existing behaviour)
- **Impact:** data integrity

## 1. Problem (Why)
The backup is the only protection against data loss (e.g. reinstall). Restore must be faithful.

## 2. Goals / Non-goals
- Goal: Pin backup format v1 and restore semantics.
- Non-goal (explicitly out of scope): Restoring vault folder handles (only names are exported).

## 3. Requirements
| ID | Requirement (testable, "must …") |
|----|----------------------------------|
| FR-006-01 | Backup contains all documents, highlights and folder names, version 1, filename `readlighting-backup-YYYY-MM-DD.json`. |
| FR-006-02 | Restore writes all documents and highlights, overwriting records with the same id, and reports counts. |
| FR-006-03 | Malformed backups are rejected before anything is written. |

## 4. Acceptance criteria
- **AC-006-01** (FR-006-01): Given stored data, the backup has the expected name and contents.
- **AC-006-02** (FR-006-02): Given a backup and an emptied DB, restore reproduces documents and highlights incl. createdAt dates.
- **AC-006-03** (FR-006-02): Given a changed document, restore overwrites it with the backup version.
- **AC-006-04** (FR-006-03): Given `{"documents":1}`, restore throws "Ungültiges Backup-Format".
- **AC-006-05** (FR-006-02): Given a trashed document, after restore `deletedAt` is an ISO string, not a Date (known quirk).

## 5. Constitution check
Backups never contain secrets; restore must not silently lose data (quirk above is flagged).

## 6. Open questions
- [ ] Restore converts only createdAt/updatedAt to Date; `deletedAt`/`completedAt` stay strings (AC-006-05). Bug? Sorting in the trash view uses `new Date(...)`, so it may mask it.
- [ ] Restore is not atomic: a failure midway leaves a partial restore.
