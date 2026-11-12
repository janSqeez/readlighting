# Migration backlog (2026-11-12)

Ranked by risk × change frequency (6-month git churn). No tests exist yet, so step 0 is the prerequisite for everything.

0. ~~Test runner~~ done: Vitest + happy-dom + fake-indexeddb (`npm test`, setup in `src/test/setup.ts`).
1. **Lint baseline**: ignore `android/`, `electron/`, build output in `eslint.config.js`; fix the 8 react-hooks errors in `src/`. → small `/sdd-spec`.
2. ~~`highlighter`~~ → specs/001 (Draft), `content-hash` → 002, `persistence` (db.ts) → 003
3. ~~export/import~~ → 004 document bundle, 005 plain exports, 006 database backup (Draft)
4. ~~`crawler`~~ → 007 url-import (Draft; sanitising question is security-relevant)
5. **`hooks/useDocuments.ts`** (trash/restore/emptyTrash, write queue, findByHash), **`useHighlights.ts`**, **`useFolders.ts`**: need `@testing-library/react` (`renderHook`). → `/sdd-retro document-hooks`
6. **`fileExport.ts`** web/Android branch (Blob download vs. Filesystem+Share) and `filesystem.ts` (vault access, File System Access API): need mocks of Capacitor/FS API. → `/sdd-retro file-export`
7. **`hooks/useShareIntent.ts`**: Android share intent, ref-during-render lint error. → `/sdd-retro share-intent`
8. **UI features** (`App.tsx`, `AppShell`, `DocumentList` search/sort/favorite/read, `DocumentViewer` search + word/page/progress stats, `CommentPanel`, `NotesEditor`, `SidebarToolbar`, `VaultBrowser`): component tests or e2e. → one `/sdd-retro` per component group, after the lint fixes in step 1
