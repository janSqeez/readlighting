# Spec 002: Content hashing for document identity

- **Status:** Draft
- **Author / Date:** Claude (/sdd-retro) / 2026-11-12
- **Type:** retro-spec (documents existing behaviour)
- **Impact:** data integrity

## 1. Problem (Why)
Documents opened from a vault or imported are identified by a content hash. If hashing changes, existing documents get duplicated and highlights are orphaned.

## 2. Goals / Non-goals
- Goal: Pin hashing and normalisation rules.
- Non-goal (explicitly out of scope): Where the hash is stored or used (see 003, 004).

## 3. Requirements
| ID | Requirement (testable, "must …") |
|----|----------------------------------|
| FR-002-01 | Frontmatter (a `---` block at the very start) is ignored for hashing. |
| FR-002-02 | CRLF and LF content hash identically. |
| FR-002-03 | The hash is SHA-256, lowercase hex, 64 chars. |

## 4. Acceptance criteria
- **AC-002-01** (FR-002-01): Given content starting with a `---` block, `stripFrontmatter` removes it.
- **AC-002-02** (FR-002-01): Given content without frontmatter or with `---` not at the start, then it is unchanged.
- **AC-002-03** (FR-002-02): Given CRLF content, `normalizeLineEndings` yields LF.
- **AC-002-04** (FR-002-03): Given "abc", then the hash equals the known SHA-256 hex.
- **AC-002-05** (FR-002-01): Given content with CRLF + frontmatter and the same content with LF and none, then hashes are equal.
- **AC-002-06** (FR-002-03): Given different content, then hashes differ.

## 5. Constitution check
Document identity is content-hash based; changing the algorithm orphans highlights, so it needs an ADR.

## 6. Open questions
- [ ] Whitespace-only differences (trailing spaces, final newline) change the hash. Intended?
