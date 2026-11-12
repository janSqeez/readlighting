# Spec 001: Highlighter: text anchoring and rendering

- **Status:** Draft
- **Author / Date:** Claude (/sdd-retro) / 2026-11-12
- **Type:** retro-spec (documents existing behaviour)
- **Impact:** data integrity

## 1. Problem (Why)
Highlights are stored as character offsets into the plain text of a document. If offset calculation or rendering changes, stored highlights silently shift or vanish. The behaviour is untested and `DocumentViewer`/`App` are changed often.

## 2. Goals / Non-goals
- Goal: Pin how selections become offsets and how offsets/search matches become `<mark>` markup for html, markdown and text documents.
- Non-goal (explicitly out of scope): Rendering of markdown to HTML (`marked`), browser selection UI, colors in CSS.

## 3. Requirements
| ID | Requirement (testable, "must …") |
|----|----------------------------------|
| FR-001-01 | Highlights on plaintext/markdown content are rendered as `<mark class="highlight highlight-<color>" data-highlight-id>`. |
| FR-001-02 | Plaintext/markdown is rendered inside an escaped `<pre>`; HTML content without annotations is returned unchanged. |
| FR-001-03 | For HTML, offsets are counted over text characters only, independent of element boundaries; a highlight spanning nodes yields one mark per text node. |
| FR-001-04 | All text inside marks is HTML-escaped. |
| FR-001-05 | Search matches are rendered as `search-match` marks; the active one additionally has `search-match-active`. |
| FR-001-06 | Overlapping plaintext highlights and out-of-range spans are handled without throwing. |
| FR-001-07 | `getTextOffsets` converts a DOM `Range` into offsets relative to the container text. |

## 4. Acceptance criteria
- **AC-001-01** (FR-001-01): Given text "Hello world" and a green highlight 6–11, when rendering as text, then the output contains the green mark with id around "world" inside a `<pre>`.
- **AC-001-02** (FR-001-02): Given text with `<`, `&`, `"` and no annotations, when rendering, then it is returned HTML-escaped inside the `<pre>`.
- **AC-001-03** (FR-001-02): Given HTML and no annotations, when rendering, then the HTML is returned unchanged.
- **AC-001-04** (FR-001-03): Given `<p>Hello <b>big</b> world</p>` and highlight 6–9, then "big" inside `<b>` is marked.
- **AC-001-05** (FR-001-03): Given `<p>ab<b>cd</b>ef</p>` and highlight 1–5, then three marks with the same id are produced.
- **AC-001-06** (FR-001-04): Given text containing `<script>` inside a highlight, then it is escaped and no script tag appears.
- **AC-001-07** (FR-001-05): Given two search matches and active index 1, then match 0 is `search-match`, match 1 is `search-match search-match-active`.
- **AC-001-08** (FR-001-06): Given overlapping plaintext highlights a(0–4) and b(2–6) on "abcdef", then a covers "abcd" and b only "ef" (known quirk: later span clipped).
- **AC-001-09** (FR-001-06): Given a highlight outside the text range, then no mark is produced.
- **AC-001-10** (FR-001-07): Given a Range selecting "big" in `<p>Hello <b>big</b> world</p>`, then offsets are {6, 9}.
- **AC-001-11** (FR-001-07): Given an empty container, then `getTextOffsets` returns null.

## 5. Constitution check
Highlights must survive reload without loss (offsets are the contract). Output is escaped, no markup injection.

## 6. Open questions
- [ ] Overlapping highlights in plaintext: the later one is clipped (AC-001-08). Intended, or should both be rendered (nested)? Owner: Jan.
- [ ] HTML rendering with overlapping highlights is not characterized (behaviour with several spans per text node is untested).
- [ ] Offsets are relative to `textContent` of the rendered content: for markdown, is the offset base the raw markdown or the rendered HTML text? Not characterized here (needs `DocumentViewer` component tests).
