# Spec 005: Plain exports (JSON, Markdown)

- **Status:** Draft
- **Author / Date:** Claude (/sdd-retro) / 2026-11-12
- **Type:** retro-spec (documents existing behaviour)
- **Impact:** none

## 1. Problem (Why)
Users export their highlights and notes as human-readable Markdown or JSON; format regressions go unnoticed.

## 2. Goals / Non-goals
- Goal: Pin the output formats.
- Non-goal (explicitly out of scope): Re-import (not supported for these formats).

## 3. Requirements
| ID | Requirement (testable, "must …") |
|----|----------------------------------|
| FR-005-01 | JSON export contains document metadata, notes and highlights; missing url is null, missing comment is "". |
| FR-005-02 | Markdown export lists highlights with color emoji and comment as quote, then notes; empty sections are omitted. |

## 4. Acceptance criteria
- **AC-005-01** (FR-005-01): Given a document, JSON export has the expected filename and fields.
- **AC-005-02** (FR-005-01): Given no url and no comment, then null and "" are written.
- **AC-005-03** (FR-005-02): Given highlights and notes, Markdown has title, source, Markierungen with emoji and comment, then Notizen.
- **AC-005-04** (FR-005-02): Given no highlights and blank notes, both sections are omitted.

## 5. Constitution check
No data is sent anywhere; export only produces a file.

## 6. Open questions
- [ ] Markdown export header is German ("Quelle", "Exportiert"); no language setting. Intended?
