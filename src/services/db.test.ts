import { describe, it, expect, beforeEach } from 'vitest';
import * as db from './db';
import type { Document, Highlight } from '../types';

function doc(p: Partial<Document> = {}): Document {
  return {
    id: 'd1', title: 'T', type: 'text', content: 'c', notes: '', source: 'local',
    createdAt: new Date(1), updatedAt: new Date(2), ...p,
  };
}
function hl(p: Partial<Highlight> = {}): Highlight {
  return { id: 'h1', documentId: 'd1', startOffset: 0, endOffset: 1, text: 'c', color: 'yellow', createdAt: new Date(3), ...p };
}

beforeEach(async () => {
  for (const d of await db.getAllDocuments()) await db.deleteDocument(d.id);
  for (const h of await db.getAllHighlights()) await db.deleteHighlight(h.id);
  for (const f of await db.getAllFolders()) await db.deleteFolder(f.id);
});

describe('AC-003 persistence', () => {
  it('AC-003-01: a saved document can be read back with Date fields intact', async () => {
    await db.saveDocument(doc());
    const d = await db.getDocument('d1');
    expect(d?.title).toBe('T');
    expect(d?.createdAt).toEqual(new Date(1));
  });

  it('AC-003-02: saving a document with an existing id replaces it', async () => {
    await db.saveDocument(doc());
    await db.saveDocument(doc({ title: 'New' }));
    expect(await db.getAllDocuments()).toHaveLength(1);
    expect((await db.getDocument('d1'))?.title).toBe('New');
  });

  it('AC-003-03: getDocument returns undefined for an unknown id', async () => {
    expect(await db.getDocument('nope')).toBeUndefined();
  });

  it('AC-003-04: highlights are returned per document', async () => {
    await db.saveHighlight(hl({ id: 'a', documentId: 'd1' }));
    await db.saveHighlight(hl({ id: 'b', documentId: 'd2' }));
    expect((await db.getHighlightsForDocument('d1')).map((h) => h.id)).toEqual(['a']);
    expect(await db.getAllHighlights()).toHaveLength(2);
  });

  it('AC-003-05: deleting a document also deletes its highlights but not others', async () => {
    await db.saveDocument(doc());
    await db.saveHighlight(hl({ id: 'a', documentId: 'd1' }));
    await db.saveHighlight(hl({ id: 'b', documentId: 'd2' }));
    await db.deleteDocument('d1');
    expect(await db.getDocument('d1')).toBeUndefined();
    expect((await db.getAllHighlights()).map((h) => h.id)).toEqual(['b']);
  });

  it('AC-003-06: a single highlight can be deleted', async () => {
    await db.saveHighlight(hl());
    await db.deleteHighlight('h1');
    expect(await db.getAllHighlights()).toEqual([]);
  });

  it('AC-003-07: documents are found by fs.contentHash', async () => {
    await db.saveDocument(doc({ fs: { contentHash: 'abc' } }));
    expect((await db.getDocumentByContentHash('abc'))?.id).toBe('d1');
    expect(await db.getDocumentByContentHash('zzz')).toBeUndefined();
  });

  it('AC-003-08: soft-deleted documents (deletedAt) stay stored and keep their highlights', async () => {
    await db.saveDocument(doc({ deletedAt: new Date(9) }));
    await db.saveHighlight(hl());
    expect((await db.getDocument('d1'))?.deletedAt).toEqual(new Date(9));
    expect(await db.getHighlightsForDocument('d1')).toHaveLength(1);
  });

  it('AC-003-09: vault folders can be saved, listed and deleted', async () => {
    const f = { id: 'f1', name: 'Vault', handle: {} as FileSystemDirectoryHandle, lastOpenedAt: new Date(5) };
    await db.saveFolder(f);
    expect((await db.getAllFolders()).map((x) => x.name)).toEqual(['Vault']);
    await db.deleteFolder('f1');
    expect(await db.getAllFolders()).toEqual([]);
  });
});
