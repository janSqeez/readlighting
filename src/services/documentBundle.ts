import type { Document, Highlight, HighlightColor } from '../types';
import * as db from './db';
import { hashContent } from './hash';
import { saveOrShareTextFile } from './fileExport';

interface BundleHighlight {
  startOffset: number;
  endOffset: number;
  text: string;
  color: HighlightColor;
  comment?: string;
  createdAt: string;
}

interface DocumentBundle {
  version: 1;
  kind: 'readlighting-document';
  exportedAt: string;
  title: string;
  type: Document['type'];
  url?: string;
  notes: string;
  content: string;
  contentHash: string;
  fileName?: string;
  relativePath?: string;
  highlights: BundleHighlight[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function exportDocumentBundle(doc: Document, highlights: Highlight[]): Promise<void> {
  const contentHash = doc.fs?.contentHash ?? (await hashContent(doc.content));
  const bundle: DocumentBundle = {
    version: 1,
    kind: 'readlighting-document',
    exportedAt: new Date().toISOString(),
    title: doc.title,
    type: doc.type,
    url: doc.url,
    notes: doc.notes,
    content: doc.content,
    contentHash,
    fileName: doc.fs?.fileName,
    relativePath: doc.fs?.relativePath,
    highlights: highlights.map((h) => ({
      startOffset: h.startOffset,
      endOffset: h.endOffset,
      text: h.text,
      color: h.color,
      comment: h.comment,
      createdAt: new Date(h.createdAt).toISOString(),
    })),
  };

  await saveOrShareTextFile(
    JSON.stringify(bundle, null, 2),
    `${slugify(doc.title)}.readlighting.json`,
    'application/json',
  );
}

export async function importDocumentBundle(file: File): Promise<{
  document: Document;
  importedHighlights: number;
  skippedHighlights: number;
}> {
  const text = await file.text();
  const bundle = JSON.parse(text) as DocumentBundle;
  if (bundle.kind !== 'readlighting-document') {
    throw new Error('Keine gültige Readlighting-Datei');
  }

  let doc = await db.getDocumentByContentHash(bundle.contentHash);
  const now = new Date();
  if (doc) {
    if (doc.content !== bundle.content || (!doc.notes.trim() && bundle.notes.trim())) {
      doc = {
        ...doc,
        content: bundle.content,
        notes: doc.notes.trim() ? doc.notes : bundle.notes,
        updatedAt: now,
      };
      await db.saveDocument(doc);
    }
  } else {
    doc = {
      id: crypto.randomUUID(),
      title: bundle.title,
      type: bundle.type,
      content: bundle.content,
      url: bundle.url,
      notes: bundle.notes,
      source: 'local',
      fs: { contentHash: bundle.contentHash, fileName: bundle.fileName, relativePath: bundle.relativePath },
      createdAt: now,
      updatedAt: now,
    };
    await db.saveDocument(doc);
  }

  const existingHighlights = await db.getHighlightsForDocument(doc.id);
  const existingKeys = new Set(existingHighlights.map((h) => `${h.startOffset}:${h.endOffset}:${h.text}`));

  let importedHighlights = 0;
  let skippedHighlights = 0;
  for (const h of bundle.highlights) {
    const key = `${h.startOffset}:${h.endOffset}:${h.text}`;
    if (existingKeys.has(key)) {
      skippedHighlights++;
      continue;
    }
    await db.saveHighlight({
      id: crypto.randomUUID(),
      documentId: doc.id,
      startOffset: h.startOffset,
      endOffset: h.endOffset,
      text: h.text,
      color: h.color,
      comment: h.comment,
      createdAt: new Date(h.createdAt),
    });
    importedHighlights++;
  }

  return { document: doc, importedHighlights, skippedHighlights };
}
