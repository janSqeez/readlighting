# Plan 007: Import a web page by URL (crawler)

- **Spec:** ./spec.md
- **Status:** Draft

## 1. Approach
Characterization only, no production code changes. Code under test: `src/services/crawler.ts`.
Tests live in `src/services/crawler.test.ts`; they were written against the real behaviour and are green on the first run.

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
| AC-007-01 | unit (fetch stubbed) | Given a URL, the first request goes to corsproxy with the encoded URL. | green (existing behaviour) | |
| AC-007-02 | unit | Given proxy 1 returns 500, proxy 2 is used and its `contents` parsed. | green (existing behaviour) | |
| AC-007-03 | unit | Given all proxies fail with 503, then the German error with "HTTP 503" is thrown. | green (existing behaviour) | |
| AC-007-04 | unit | Given a `.md` or `.markdown` URL (any case), then markdown type, raw content, file name as title. | green (existing behaviour) | |
| AC-007-05 | unit | Given a `.txt` URL, then text type. | green (existing behaviour) | |
| AC-007-06 | unit | Given HTML with title / only h1 / neither, then title is title / h1 / URL. | green (existing behaviour) | |
| AC-007-07 | unit | Given boilerplate elements, they are removed from the result. | green (existing behaviour) | |
| AC-007-08 | unit | Given main/article/[role=main], then in that priority the content comes from them. | green (existing behaviour) | |
