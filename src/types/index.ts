export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

export interface Highlight {
  id: string;
  documentId: string;
  startOffset: number;
  endOffset: number;
  text: string;
  color: HighlightColor;
  comment?: string;
  createdAt: Date;
}

export interface DocumentFsLink {
  contentHash: string;
  folderId?: string;
  relativePath?: string;
  fileName?: string;
}

export interface Document {
  id: string;
  title: string;
  type: 'html' | 'text' | 'markdown';
  content: string;
  url?: string;
  notes: string;
  source: 'local' | 'filesystem';
  fs?: DocumentFsLink;
  createdAt: Date;
  updatedAt: Date;
}

export interface VaultFolder {
  id: string;
  name: string;
  handle: FileSystemDirectoryHandle;
  lastOpenedAt: Date;
}

export interface SearchMatch {
  index: number;
  start: number;
  end: number;
}
