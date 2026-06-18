import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Document, Highlight, VaultFolder } from '../types';

interface ReadlightingDB extends DBSchema {
  documents: {
    key: string;
    value: Document;
    indexes: { 'by-contentHash': string };
  };
  highlights: {
    key: string;
    value: Highlight;
    indexes: { 'by-documentId': string };
  };
  folders: {
    key: string;
    value: VaultFolder;
  };
}

let dbPromise: Promise<IDBPDatabase<ReadlightingDB>> | null = null;

function getDB(): Promise<IDBPDatabase<ReadlightingDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ReadlightingDB>('readlighting', 2, {
      upgrade(db, oldVersion, _newVersion, tx) {
        let documentStore;
        if (oldVersion < 1) {
          documentStore = db.createObjectStore('documents', { keyPath: 'id' });
          const highlightStore = db.createObjectStore('highlights', { keyPath: 'id' });
          highlightStore.createIndex('by-documentId', 'documentId');
        } else {
          documentStore = tx.objectStore('documents');
        }
        if (oldVersion < 2) {
          documentStore.createIndex('by-contentHash', 'fs.contentHash');
          db.createObjectStore('folders', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllDocuments(): Promise<Document[]> {
  const db = await getDB();
  return db.getAll('documents');
}

export async function getDocument(id: string): Promise<Document | undefined> {
  const db = await getDB();
  return db.get('documents', id);
}

export async function saveDocument(doc: Document): Promise<void> {
  const db = await getDB();
  await db.put('documents', doc);
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['documents', 'highlights'], 'readwrite');
  await tx.objectStore('documents').delete(id);
  const highlights = await tx.objectStore('highlights').index('by-documentId').getAll(id);
  for (const h of highlights) {
    await tx.objectStore('highlights').delete(h.id);
  }
  await tx.done;
}

export async function getAllHighlights(): Promise<Highlight[]> {
  const db = await getDB();
  return db.getAll('highlights');
}

export async function getHighlightsForDocument(documentId: string): Promise<Highlight[]> {
  const db = await getDB();
  return db.getAllFromIndex('highlights', 'by-documentId', documentId);
}

export async function saveHighlight(highlight: Highlight): Promise<void> {
  const db = await getDB();
  await db.put('highlights', highlight);
}

export async function deleteHighlight(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('highlights', id);
}

export async function getDocumentByContentHash(hash: string): Promise<Document | undefined> {
  const db = await getDB();
  return db.getFromIndex('documents', 'by-contentHash', hash);
}

export async function getAllFolders(): Promise<VaultFolder[]> {
  const db = await getDB();
  return db.getAll('folders');
}

export async function saveFolder(folder: VaultFolder): Promise<void> {
  const db = await getDB();
  await db.put('folders', folder);
}

export async function deleteFolder(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('folders', id);
}
