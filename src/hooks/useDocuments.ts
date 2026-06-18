import { useState, useEffect, useCallback } from 'react';
import type { Document } from '../types';
import * as db from '../services/db';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

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

  const updateDocument = useCallback(async (id: string, updates: Partial<Document>) => {
    const existing = await db.getDocument(id);
    if (!existing) return;
    const updated: Document = { ...existing, ...updates, updatedAt: new Date() };
    await db.saveDocument(updated);
    setDocuments((prev) =>
      prev
        .map((d) => (d.id === id ? updated : d))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    );
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
