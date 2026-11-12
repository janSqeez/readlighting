import { describe, it, expect, beforeEach, vi } from 'vitest';

const saved: { content: string; filename: string; mime: string }[] = [];
vi.mock('./fileExport', () => ({
  saveOrShareTextFile: async (content: string, filename: string, mime: string) => {
    saved.push({ content, filename, mime });
  },
}));

import * as db from './db';
import { exportDocumentBundle, importDocumentBundle } from './documentBundle';
import { exportAsJSON, exportAsMarkdown } from './exporter';
import { exportDatabaseBackup, importDatabaseBackup } from './backup';
import type { Document, Highlight } from '../types';

function doc(p: Partial<Document> = {}): Document {
  return {
    id: 'd1', title: 'Mein Text: Über Äpfel!', type: 'markdown', content: '# Hi\nApfel', notes: 'Note', source: 'local',
    url: 'https://x.test/a', createdAt: new Date('2026-01-01T00:00:00Z'), updatedAt: new Date('2026-01-02T00:00:00Z'), ...p,
  };
}
function hl(p: Partial<Highlight> = {}): Highlight {
  return { id: 'h1', documentId: 'd1', startOffset: 5, endOffset: 10, text: 'Apfel', color: 'pink', comment: 'lecker', createdAt: new Date('2026-01-03T00:00:00Z'), ...p };
}
const asFile = (s: string) => new File([s], 'x.json');

beforeEach(async () => {
  saved.length = 0;
  for (const d of await db.getAllDocuments()) await db.deleteDocument(d.id);
  for (const h of await db.getAllHighlights()) await db.deleteHighlight(h.id);
});

describe('AC-004 document bundle', () => {
  it('AC-004-01: export writes <slug>.readlighting.json with kind, version, content and highlights', async () => {
    await exportDocumentBundle(doc(), [hl()]);
    const [f] = saved;
    expect(f.filename).toBe('mein-text-über-äpfel.readlighting.json');
    expect(f.mime).toBe('application/json');
    const b = JSON.parse(f.content);
    expect(b).toMatchObject({ version: 1, kind: 'readlighting-document', title: doc().title, content: doc().content, notes: 'Note' });
    expect(b.highlights).toEqual([{ startOffset: 5, endOffset: 10, text: 'Apfel', color: 'pink', comment: 'lecker', createdAt: '2026-01-03T00:00:00.000Z' }]);
    expect(b.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('AC-004-02: export uses fs.contentHash when present', async () => {
    await exportDocumentBundle(doc({ fs: { contentHash: 'fixed' } }), []);
    expect(JSON.parse(saved[0].content).contentHash).toBe('fixed');
  });

  it('AC-004-03: import of an unknown document creates it (source local) with its highlights', async () => {
    await exportDocumentBundle(doc(), [hl()]);
    const r = await importDocumentBundle(asFile(saved[0].content));
    expect(r.importedHighlights).toBe(1);
    expect(r.skippedHighlights).toBe(0);
    expect(r.document.id).not.toBe('d1');
    expect(r.document.source).toBe('local');
    const hs = await db.getHighlightsForDocument(r.document.id);
    expect(hs[0]).toMatchObject({ text: 'Apfel', color: 'pink', comment: 'lecker', startOffset: 5 });
    expect(hs[0].createdAt).toEqual(new Date('2026-01-03T00:00:00Z'));
  });

  it('AC-004-04: importing the same bundle twice does not duplicate document or highlights', async () => {
    await exportDocumentBundle(doc(), [hl()]);
    await importDocumentBundle(asFile(saved[0].content));
    const r = await importDocumentBundle(asFile(saved[0].content));
    expect(r.importedHighlights).toBe(0);
    expect(r.skippedHighlights).toBe(1);
    expect(await db.getAllDocuments()).toHaveLength(1);
    expect(await db.getAllHighlights()).toHaveLength(1);
  });

  it('AC-004-08: duplicates are detected per highlight (offsets + text), several in one bundle', async () => {
    const hs = [hl({ id: 'a' }), hl({ id: 'b', startOffset: 0, endOffset: 4, text: '# Hi' })];
    await exportDocumentBundle(doc(), hs);
    await importDocumentBundle(asFile(saved[0].content));
    const r = await importDocumentBundle(asFile(saved[0].content));
    expect(r).toMatchObject({ importedHighlights: 0, skippedHighlights: 2 });
    expect(await db.getAllHighlights()).toHaveLength(2);
  });

  it('AC-004-05: import into an existing doc (same hash) keeps its own non-empty notes', async () => {
    await exportDocumentBundle(doc(), []);
    const first = await importDocumentBundle(asFile(saved[0].content));
    await db.saveDocument({ ...first.document, notes: 'Meine Notiz' });
    const bundle = JSON.parse(saved[0].content);
    bundle.notes = 'Fremde Notiz';
    const r = await importDocumentBundle(asFile(JSON.stringify(bundle)));
    expect(r.document.notes).toBe('Meine Notiz');
  });

  it('AC-004-06: import fills empty notes of an existing doc from the bundle', async () => {
    await exportDocumentBundle(doc({ notes: '' }), []);
    const first = await importDocumentBundle(asFile(saved[0].content));
    const bundle = JSON.parse(saved[0].content);
    bundle.notes = 'Aus Bundle';
    const r = await importDocumentBundle(asFile(JSON.stringify(bundle)));
    expect(r.document.id).toBe(first.document.id);
    expect(r.document.notes).toBe('Aus Bundle');
  });

  it('AC-004-07: import rejects files that are not readlighting bundles', async () => {
    await expect(importDocumentBundle(asFile('{"kind":"other"}'))).rejects.toThrow('Keine gültige Readlighting-Datei');
  });
});

describe('AC-005 plain exports', () => {
  it('AC-005-01: JSON export contains document metadata, notes and highlights', async () => {
    await exportAsJSON(doc(), [hl()]);
    expect(saved[0].filename).toBe('mein-text-über-äpfel.json');
    const j = JSON.parse(saved[0].content);
    expect(j.document).toMatchObject({ title: doc().title, type: 'markdown', url: 'https://x.test/a' });
    expect(j.notes).toBe('Note');
    expect(j.highlights[0]).toMatchObject({ text: 'Apfel', color: 'pink', comment: 'lecker' });
  });

  it('AC-005-02: JSON export uses null for a missing url and empty string for a missing comment', async () => {
    await exportAsJSON(doc({ url: undefined }), [hl({ comment: undefined })]);
    const j = JSON.parse(saved[0].content);
    expect(j.document.url).toBeNull();
    expect(j.highlights[0].comment).toBe('');
  });

  it('AC-005-03: Markdown export lists highlights with color emoji and comments as quotes, then notes', async () => {
    await exportAsMarkdown(doc(), [hl()]);
    const md = saved[0].content;
    expect(saved[0].filename).toBe('mein-text-über-äpfel.md');
    expect(md).toContain('# Mein Text: Über Äpfel!');
    expect(md).toContain('Quelle: https://x.test/a');
    expect(md).toContain('## Markierungen');
    expect(md).toContain('🩷 "Apfel"\n> lecker');
    expect(md.indexOf('## Notizen')).toBeGreaterThan(md.indexOf('## Markierungen'));
    expect(md).toContain('Note');
  });

  it('AC-005-04: Markdown export omits Markierungen and Notizen sections when empty', async () => {
    await exportAsMarkdown(doc({ notes: '  ' }), []);
    expect(saved[0].content).not.toContain('## Markierungen');
    expect(saved[0].content).not.toContain('## Notizen');
  });
});

describe('AC-006 database backup', () => {
  it('AC-006-01: backup contains all documents, highlights and folder names', async () => {
    await db.saveDocument(doc());
    await db.saveHighlight(hl());
    await exportDatabaseBackup();
    expect(saved[0].filename).toMatch(/^readlighting-backup-\d{4}-\d{2}-\d{2}\.json$/);
    const b = JSON.parse(saved[0].content);
    expect(b.version).toBe(1);
    expect(b.documents).toHaveLength(1);
    expect(b.highlights).toHaveLength(1);
    expect(b.folderNames).toEqual([]);
  });

  it('AC-006-02: restoring a backup into an empty DB reproduces documents and highlights', async () => {
    await db.saveDocument(doc());
    await db.saveHighlight(hl());
    await exportDatabaseBackup();
    await db.deleteDocument('d1');
    const r = await importDatabaseBackup(asFile(saved[0].content));
    expect(r).toEqual({ documents: 1, highlights: 1 });
    expect((await db.getDocument('d1'))?.createdAt).toEqual(new Date('2026-01-01T00:00:00Z'));
    expect((await db.getAllHighlights())[0].createdAt).toEqual(new Date('2026-01-03T00:00:00Z'));
  });

  it('AC-006-03: restoring overwrites documents with the same id', async () => {
    await db.saveDocument(doc());
    await exportDatabaseBackup();
    await db.saveDocument(doc({ title: 'Geändert' }));
    await importDatabaseBackup(asFile(saved[0].content));
    expect((await db.getDocument('d1'))?.title).toBe(doc().title);
  });

  it('AC-006-04: restore rejects malformed backups', async () => {
    await expect(importDatabaseBackup(asFile('{"documents":1}'))).rejects.toThrow('Ungültiges Backup-Format');
  });

  it('AC-006-05: deletedAt/completedAt of restored documents stay ISO strings (known quirk: only createdAt/updatedAt become Dates)', async () => {
    await db.saveDocument(doc({ deletedAt: new Date('2026-02-01T00:00:00Z') }));
    await exportDatabaseBackup();
    await importDatabaseBackup(asFile(saved[0].content));
    expect(typeof (await db.getDocument('d1'))?.deletedAt).toBe('string');
  });
});
