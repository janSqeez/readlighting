# Plan 002: Content hashing for document identity

- **Spec:** ./spec.md
- **Status:** Draft

## 1. Approach
Characterization only, no production code changes. Code under test: `src/services/hash.ts`.
Tests live in `src/services/hash.test.ts`; they were written against the real behaviour and are green on the first run.

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
| AC-002-01 | unit | Given content starting with a `---` block, `stripFrontmatter` removes it. | green (existing behaviour) | |
| AC-002-02 | unit | Given content without frontmatter or with `---` not at the start, then it is unchanged. | green (existing behaviour) | |
| AC-002-03 | unit | Given CRLF content, `normalizeLineEndings` yields LF. | green (existing behaviour) | |
| AC-002-04 | unit | Given "abc", then the hash equals the known SHA-256 hex. | green (existing behaviour) | |
| AC-002-05 | unit | Given content with CRLF + frontmatter and the same content with LF and none, then hashes are equal. | green (existing behaviour) | |
| AC-002-06 | unit | Given different content, then hashes differ. | green (existing behaviour) | |
