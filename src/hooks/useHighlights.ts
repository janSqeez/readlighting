import { useState, useEffect, useCallback } from 'react';
import type { Highlight } from '../types';
import * as db from '../services/db';

export function useHighlights(documentId: string | null) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  useEffect(() => {
    if (!documentId) {
      setHighlights([]);
      return;
    }
    db.getHighlightsForDocument(documentId).then((hs) => {
      setHighlights(hs.sort((a, b) => a.startOffset - b.startOffset));
    });
  }, [documentId]);

  const addHighlight = useCallback(async (highlight: Omit<Highlight, 'id' | 'createdAt'>) => {
    const newHighlight: Highlight = {
      ...highlight,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    await db.saveHighlight(newHighlight);
    setHighlights((prev) =>
      [...prev, newHighlight].sort((a, b) => a.startOffset - b.startOffset)
    );
    return newHighlight;
  }, []);

  const updateHighlight = useCallback(async (id: string, updates: Partial<Highlight>) => {
    setHighlights((prev) => {
      const existing = prev.find((h) => h.id === id);
      if (!existing) return prev;
      const updated = { ...existing, ...updates };
      db.saveHighlight(updated);
      return prev.map((h) => (h.id === id ? updated : h));
    });
  }, []);

  const removeHighlight = useCallback(async (id: string) => {
    await db.deleteHighlight(id);
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  }, []);

  return { highlights, addHighlight, updateHighlight, removeHighlight };
}
