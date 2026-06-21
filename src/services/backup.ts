import type { Document, Highlight } from '../types';
import * as db from '../services/db';
import { saveOrShareTextFile } from './fileExport';

interface BackupData {
  version: 1;
  exportedAt: string;
  documents: Document[];
  highlights: Highlight[];
  folderNames: string[];
}

export async function exportDatabaseBackup(): Promise<void> {
  const [documents, highlights, folders] = await Promise.all([
    db.getAllDocuments(),
    db.getAllHighlights(),
    db.getAllFolders(),
  ]);
  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    documents,
    highlights,
    folderNames: folders.map((f) => f.name),
  };
  await saveOrShareTextFile(
    JSON.stringify(data, null, 2),
    `readlighting-backup-${dateStamp()}.json`,
    'application/json',
  );
}

export async function importDatabaseBackup(file: File): Promise<{ documents: number; highlights: number }> {
  const text = await file.text();
  const data = JSON.parse(text) as BackupData;
  if (!Array.isArray(data.documents) || !Array.isArray(data.highlights)) {
    throw new Error('Ungültiges Backup-Format');
  }
  for (const doc of data.documents) {
    await db.saveDocument({ ...doc, createdAt: new Date(doc.createdAt), updatedAt: new Date(doc.updatedAt) });
  }
  for (const h of data.highlights) {
    await db.saveHighlight({ ...h, createdAt: new Date(h.createdAt) });
  }
  return { documents: data.documents.length, highlights: data.highlights.length };
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
