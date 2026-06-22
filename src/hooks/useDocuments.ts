import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Document } from '../types';
import * as db from '../services/db';

function byUpdatedDesc(a: Document, b: Document): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export function useDocuments() {
  // Holds *all* documents including trashed ones — the active list and the
  // trash view are both derived from this so a soft-deleted doc (and its
  // highlights) survive in IndexedDB until it's permanently deleted.
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  // Serializes updateDocument's read-modify-write against IndexedDB - without
  // this, two quick successive updates to the same document (e.g. toggling
  // favorite then read right after) can both read the same stale "existing"
  // snapshot and the later write clobbers the earlier one's change.
  const writeQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    db.getAllDocuments().then((docs) => {
      setAllDocuments(docs.sort(byUpdatedDesc));
      setLoading(false);
    });
  }, []);

  const documents = useMemo(() => allDocuments.filter((d) => !d.deletedAt), [allDocuments]);
  const trashedDocuments = useMemo(
    () =>
      allDocuments
        .filter((d) => d.deletedAt)
        .sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()),
    [allDocuments]
  );

  const addDocument = useCallback(async (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'notes'>) => {
    const newDoc: Document = {
      ...doc,
      id: crypto.randomUUID(),
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.saveDocument(newDoc);
    setAllDocuments((prev) => [newDoc, ...prev].sort(byUpdatedDesc));
    return newDoc;
  }, []);

  const updateDocument = useCallback((id: string, updates: Partial<Document>) => {
    const task = writeQueueRef.current.then(async () => {
      const existing = await db.getDocument(id);
      if (!existing) return;
      const updated: Document = { ...existing, ...updates, updatedAt: new Date() };
      await db.saveDocument(updated);
      setAllDocuments((prev) =>
        prev.map((d) => (d.id === id ? updated : d)).sort(byUpdatedDesc)
      );
    });
    // Swallow errors here so one failed update doesn't permanently wedge the
    // queue for unrelated later updates; callers still get the real error.
    writeQueueRef.current = task.catch(() => {});
    return task;
  }, []);

  // Soft-delete: move to trash (keeps the doc + its highlights in IndexedDB).
  const trashDocument = useCallback(
    (id: string) => updateDocument(id, { deletedAt: new Date() }),
    [updateDocument]
  );

  // Restore from trash back into the active list.
  const restoreDocument = useCallback(
    (id: string) => updateDocument(id, { deletedAt: undefined }),
    [updateDocument]
  );

  // Hard delete: removes the document and its highlights for good.
  const deleteDocumentPermanently = useCallback(async (id: string) => {
    await db.deleteDocument(id);
    setAllDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // Permanently delete everything currently in the trash.
  const emptyTrash = useCallback(async () => {
    const ids = allDocuments.filter((d) => d.deletedAt).map((d) => d.id);
    for (const id of ids) {
      await db.deleteDocument(id);
    }
    setAllDocuments((prev) => prev.filter((d) => !d.deletedAt));
  }, [allDocuments]);

  // Searches all documents (including trashed) so re-adding/opening a file that
  // is currently in the trash resolves to the same doc — the caller restores it.
  const findByHash = useCallback(
    (hash: string) => allDocuments.find((d) => d.fs?.contentHash === hash),
    [allDocuments]
  );

  return {
    documents,
    trashedDocuments,
    loading,
    addDocument,
    updateDocument,
    trashDocument,
    restoreDocument,
    deleteDocumentPermanently,
    emptyTrash,
    findByHash,
  };
}
