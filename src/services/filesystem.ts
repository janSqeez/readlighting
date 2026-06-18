export interface FsEntry {
  name: string;
  kind: 'file' | 'directory';
  handle: FileSystemFileHandle | FileSystemDirectoryHandle;
}

const SUPPORTED_EXTENSIONS = ['md', 'markdown', 'txt', 'html', 'htm'];

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  try {
    return await window.showDirectoryPicker({ mode: 'read' });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return null;
    throw err;
  }
}

export async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const opts = { mode: 'read' as const };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  return (await handle.requestPermission(opts)) === 'granted';
}

export async function listDirectory(dirHandle: FileSystemDirectoryHandle): Promise<FsEntry[]> {
  const entries: FsEntry[] = [];
  for await (const handle of dirHandle.values()) {
    if (handle.kind === 'directory') {
      if (handle.name.startsWith('.')) continue;
      entries.push({ name: handle.name, kind: 'directory', handle });
    } else {
      const ext = handle.name.split('.').pop()?.toLowerCase();
      if (ext && SUPPORTED_EXTENSIONS.includes(ext)) {
        entries.push({ name: handle.name, kind: 'file', handle });
      }
    }
  }
  entries.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return entries;
}

export async function readFileText(handle: FileSystemFileHandle): Promise<string> {
  const file = await handle.getFile();
  return file.text();
}

export interface FsSearchResult {
  name: string;
  relativePath: string;
  handle: FileSystemFileHandle;
}

export async function searchFiles(
  dirHandle: FileSystemDirectoryHandle,
  query: string,
  pathSegments: string[] = []
): Promise<FsSearchResult[]> {
  const lowerQuery = query.toLowerCase();
  const entries = await listDirectory(dirHandle);
  const results: FsSearchResult[] = [];
  for (const entry of entries) {
    if (entry.kind === 'file') {
      if (entry.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          name: entry.name,
          relativePath: [...pathSegments, entry.name].join('/'),
          handle: entry.handle as FileSystemFileHandle,
        });
      }
    } else {
      const nested = await searchFiles(entry.handle as FileSystemDirectoryHandle, query, [
        ...pathSegments,
        entry.name,
      ]);
      results.push(...nested);
    }
  }
  return results;
}

export function inferDocumentType(fileName: string): 'html' | 'text' | 'markdown' {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'md' || ext === 'markdown') return 'markdown';
  if (ext === 'html' || ext === 'htm') return 'html';
  return 'text';
}
