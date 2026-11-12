# Plan 001: Highlighter: text anchoring and rendering

- **Spec:** ./spec.md
- **Status:** Draft

## 1. Approach
Characterization only, no production code changes. Code under test: `src/services/highlighter.ts` (consumed by `DocumentViewer.tsx`, `useHighlights.ts`).
Tests live in `src/services/highlighter.test.ts`; they were written against the real behaviour and are green on the first run.

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
| AC-001-01 | unit | Given text "Hello world" and a green highlight 6–11, when rendering as text, then the output contains the green mark with id around "world" inside a `<pre>`. | green (existing behaviour) | |
| AC-001-02 | unit | Given text with `<`, `&`, `"` and no annotations, when rendering, then it is returned HTML-escaped inside the `<pre>`. | green (existing behaviour) | |
| AC-001-03 | unit | Given HTML and no annotations, when rendering, then the HTML is returned unchanged. | green (existing behaviour) | |
| AC-001-04 | unit | Given `<p>Hello <b>big</b> world</p>` and highlight 6–9, then "big" inside `<b>` is marked. | green (existing behaviour) | |
| AC-001-05 | unit | Given `<p>ab<b>cd</b>ef</p>` and highlight 1–5, then three marks with the same id are produced. | green (existing behaviour) | |
| AC-001-06 | unit | Given text containing `<script>` inside a highlight, then it is escaped and no script tag appears. | green (existing behaviour) | |
| AC-001-07 | unit | Given two search matches and active index 1, then match 0 is `search-match`, match 1 is `search-match search-match-active`. | green (existing behaviour) | |
| AC-001-08 | unit | Given overlapping plaintext highlights a(0–4) and b(2–6) on "abcdef", then a covers "abcd" and b only "ef" (known quirk: later span clipped). | green (existing behaviour) | |
| AC-001-09 | unit | Given a highlight outside the text range, then no mark is produced. | green (existing behaviour) | |
| AC-001-10 | unit (happy-dom) | Given a Range selecting "big" in `<p>Hello <b>big</b> world</p>`, then offsets are {6, 9}. | green (existing behaviour) | |
| AC-001-11 | unit (happy-dom) | Given an empty container, then `getTextOffsets` returns null. | green (existing behaviour) | |
