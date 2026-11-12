# Spec 007: Import a web page by URL (crawler)

- **Status:** Draft
- **Author / Date:** Claude (/sdd-retro) / 2026-11-12
- **Type:** retro-spec (documents existing behaviour)
- **Impact:** security

## 1. Problem (Why)
Users import articles by URL. Content comes from third-party CORS proxies and is later rendered as HTML, so extraction and failure behaviour matter.

## 2. Goals / Non-goals
- Goal: Pin proxy fallback, type detection, title extraction and boilerplate stripping.
- Non-goal (explicitly out of scope): Sanitising the returned HTML (not done in the service, see open questions), proxy availability.

## 3. Requirements
| ID | Requirement (testable, "must …") |
|----|----------------------------------|
| FR-007-01 | The URL is fetched through `corsproxy.io`; on failure `allorigins.win` (JSON `contents`) is tried. |
| FR-007-02 | If all proxies fail, an error naming the last cause is thrown. |
| FR-007-03 | `.md`/`.markdown` and `.txt` URLs return raw content as markdown/text with the file name as title. |
| FR-007-04 | HTML titles come from `<title>`, else `<h1>`, else the URL. |
| FR-007-05 | Scripts, styles, nav, header, footer, aside and ad/cookie elements are removed; content comes from `main`, `article`, `[role=main]` or `body`. |

## 4. Acceptance criteria
- **AC-007-01** (FR-007-01): Given a URL, the first request goes to corsproxy with the encoded URL.
- **AC-007-02** (FR-007-01): Given proxy 1 returns 500, proxy 2 is used and its `contents` parsed.
- **AC-007-03** (FR-007-02): Given all proxies fail with 503, then the German error with "HTTP 503" is thrown.
- **AC-007-04** (FR-007-03): Given a `.md` or `.markdown` URL (any case), then markdown type, raw content, file name as title.
- **AC-007-05** (FR-007-03): Given a `.txt` URL, then text type.
- **AC-007-06** (FR-007-04): Given HTML with title / only h1 / neither, then title is title / h1 / URL.
- **AC-007-07** (FR-007-05): Given boilerplate elements, they are removed from the result.
- **AC-007-08** (FR-007-05): Given main/article/[role=main], then in that priority the content comes from them.

## 5. Constitution check
URL fetches are the only network access (explicit user action); external data is untrusted.

## 6. Open questions
- [ ] Returned HTML is not sanitised here (inline event handlers, `javascript:` links, iframes survive). Is sanitising done at render time? Security-relevant. Owner: Jan.
- [ ] The proxies are third parties and see every imported URL. Acceptable given "nothing is sent to a server except explicit URL fetches"?
- [ ] Fetch timeout 15 s per proxy is not characterized.
