# Constitution

Non-negotiable rules. A spec that violates one of them is rejected, or this file is changed first, with an ADR.
Entries marked (proposed) are guesses from code/docs; review and edit before committing.

## Engineering rules
- Every acceptance criterion has an automated test (see `specs/README.md`, Traceability).
- Never swallow errors. Log structured messages.
- Secrets never enter Git or logs.
- High cohesion, loose coupling: UI in `components/`, state in `hooks/`, I/O and logic in `services/`. (proposed)
- TypeScript strict; `npx tsc -b` must pass. No `any` in new code. (proposed)
- New code must not add lint errors. (proposed)

## Domain rules
- User documents and highlights stay local (IndexedDB / local filesystem); nothing is sent to a server except explicit URL fetches. (proposed)
- Highlights, comments and notes must survive reload, export and re-import without loss. (proposed)
- Document identity is content-hash based (`services/hash.ts`); changes must not orphan existing highlights. (proposed)
- Deleting a document goes through trash and confirmation; no silent data loss. (proposed, v1.2.0)
- One codebase for PWA, Android (Capacitor) and Electron; platform-specific code is isolated behind services and guarded by `Capacitor.getPlatform()`. (proposed)
- Service worker updates must be safe: an update never strands users on a broken cached version. (proposed)
- Version in `package.json` is the single source; run `npm run version:sync` on change. (proposed)

## Quality gates
- Verification commands live in `.claude/sdd.config.json` and must pass before a spec becomes `Implemented`.
