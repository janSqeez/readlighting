import { useState, useEffect, useCallback, useRef } from 'react';
import type { Document } from '../types';
import * as db from '../services/db';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  // Serializes updateDocument's read-modify-write against IndexedDB - without
  // this, two quick successive updates to the same document (e.g. toggling
  // favorite then read right after) can both read the same stale "existing"
  // snapshot and the later write clobbers the earlier one's change.
  const writeQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    db.getAllDocuments().then((docs) => {
      setDocuments(docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      setLoading(false);
    });
  }, []);

  const addDocument = useCallback(async (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'notes'>) => {
    const newDoc: Document = {
      ...doc,
      id: crypto.randomUUID(),
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.saveDocument(newDoc);
    setDocuments((prev) =>
      [newDoc, ...prev].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    );
    return newDoc;
  }, []);

  const updateDocument = useCallback((id: string, updates: Partial<Document>) => {
    const task = writeQueueRef.current.then(async () => {
      const existing = await db.getDocument(id);
      if (!existing) return;
      const updated: Document = { ...existing, ...updates, updatedAt: new Date() };
      await db.saveDocument(updated);
      setDocuments((prev) =>
        prev
          .map((d) => (d.id === id ? updated : d))
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
    });
    // Swallow errors here so one failed update doesn't permanently wedge the
    // queue for unrelated later updates; callers still get the real error.
    writeQueueRef.current = task.catch(() => {});
    return task;
  }, []);

  const removeDocument = useCallback(async (id: string) => {
    await db.deleteDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const findByHash = useCallback(
    (hash: string) => documents.find((d) => d.fs?.contentHash === hash),
    [documents]
  );

  return { documents, loading, addDocument, updateDocument, removeDocument, findByHash };
}
