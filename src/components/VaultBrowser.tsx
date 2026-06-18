import { useState, useEffect, useCallback } from 'react';
import { Button, Text, FlexBox, Icon, BusyIndicator } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/add-folder.js';
import '@ui5/webcomponents-icons/dist/folder.js';
import '@ui5/webcomponents-icons/dist/open-folder.js';
import '@ui5/webcomponents-icons/dist/document-text.js';
import '@ui5/webcomponents-icons/dist/decline.js';
import '@ui5/webcomponents-icons/dist/disconnected.js';
import '@ui5/webcomponents-icons/dist/slim-arrow-right.js';
import '@ui5/webcomponents-icons/dist/slim-arrow-down.js';
import type { VaultFolder } from '../types';
import { listDirectory, searchFiles, type FsEntry, type FsSearchResult } from '../services/filesystem';

interface FileSelectMeta {
  folderId: string;
  relativePath: string;
  fileName: string;
}

interface VaultBrowserProps {
  folders: VaultFolder[];
  openFolderIds: Set<string>;
  selectedFsKey: string | null;
  searchQuery: string;
  onOpenNew: () => void;
  onReopen: (folder: VaultFolder) => Promise<boolean>;
  onClose: (id: string) => void;
  onForget: (id: string) => void;
  onFileSelect: (handle: FileSystemFileHandle, meta: FileSelectMeta) => void;
}

export function VaultBrowser({
  folders,
  openFolderIds,
  selectedFsKey,
  searchQuery,
  onOpenNew,
  onReopen,
  onClose,
  onForget,
  onFileSelect,
}: VaultBrowserProps) {
  const openFolders = folders.filter((f) => openFolderIds.has(f.id));
  const recentFolders = folders.filter((f) => !openFolderIds.has(f.id));

  return (
    <div className="vault-browser">
      <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ padding: '8px 12px 4px' }}>
        <Text style={{ fontWeight: '600', fontSize: '13px' }}>Filesystem</Text>
        <Button icon="add-folder" design="Transparent" tooltip="Ordner öffnen" onClick={onOpenNew} />
      </FlexBox>

      {openFolders.map((folder) => (
        <OpenFolderSection
          key={folder.id}
          folder={folder}
          selectedFsKey={selectedFsKey}
          searchQuery={searchQuery}
          onClose={() => onClose(folder.id)}
          onFileSelect={onFileSelect}
        />
      ))}

      {recentFolders.length > 0 && (
        <div className="vault-recent-list">
          <Text style={{ fontSize: '12px', color: 'var(--sapNeutralColor)', padding: '4px 12px' }}>
            Zuletzt geöffnet
          </Text>
          {recentFolders.map((folder) => (
            <RecentFolderRow
              key={folder.id}
              folder={folder}
              onReopen={() => onReopen(folder)}
              onForget={() => onForget(folder.id)}
            />
          ))}
        </div>
      )}

      {folders.length === 0 && (
        <Text style={{ fontSize: '12px', color: 'var(--sapNeutralColor)', padding: '4px 12px' }}>
          Noch kein Ordner verbunden.
        </Text>
      )}
    </div>
  );
}

function RecentFolderRow({
  folder,
  onReopen,
  onForget,
}: {
  folder: VaultFolder;
  onReopen: () => Promise<boolean>;
  onForget: () => void;
}) {
  const [error, setError] = useState(false);

  async function handleClick() {
    setError(false);
    const granted = await onReopen();
    if (!granted) setError(true);
  }

  return (
    <div className="vault-recent-row" onClick={handleClick}>
      <Icon name={error ? 'disconnected' : 'folder'} style={{ flexShrink: 0 }} />
      <span className="vault-recent-name">{folder.name}</span>
      <Button
        icon="decline"
        design="Transparent"
        className="item-action-btn"
        tooltip="Aus Liste entfernen"
        onClick={(e) => { e.stopPropagation(); onForget(); }}
      />
    </div>
  );
}

function OpenFolderSection({
  folder,
  selectedFsKey,
  searchQuery,
  onClose,
  onFileSelect,
}: {
  folder: VaultFolder;
  selectedFsKey: string | null;
  searchQuery: string;
  onClose: () => void;
  onFileSelect: (handle: FileSystemFileHandle, meta: FileSelectMeta) => void;
}) {
  const trimmedQuery = searchQuery.trim();

  return (
    <div className="vault-open-folder">
      <div className="vault-open-folder-header">
        <Icon name="open-folder" />
        <span className="vault-open-folder-name">{folder.name}</span>
        <Button icon="decline" design="Transparent" className="item-action-btn" tooltip="Schließen" onClick={onClose} />
      </div>
      {trimmedQuery ? (
        <FolderSearchResults
          folder={folder}
          query={trimmedQuery}
          selectedFsKey={selectedFsKey}
          onFileSelect={onFileSelect}
        />
      ) : (
        <DirectoryNode
          dirHandle={folder.handle}
          folderId={folder.id}
          pathSegments={[]}
          depth={1}
          defaultExpanded
          selectedFsKey={selectedFsKey}
          onFileSelect={onFileSelect}
        />
      )}
    </div>
  );
}

function FolderSearchResults({
  folder,
  query,
  selectedFsKey,
  onFileSelect,
}: {
  folder: VaultFolder;
  query: string;
  selectedFsKey: string | null;
  onFileSelect: (handle: FileSystemFileHandle, meta: FileSelectMeta) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<FsSearchResult[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      searchFiles(folder.handle, query).then((found) => {
        if (!cancelled) {
          setResults(found);
          setLoading(false);
        }
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [folder.handle, query]);

  if (loading) return <BusyIndicator active size="S" style={{ margin: '4px 14px' }} />;
  if (results.length === 0) {
    return <Text style={{ fontSize: '12px', color: 'var(--sapNeutralColor)', paddingLeft: 14 }}>Keine Treffer</Text>;
  }

  return (
    <div>
      {results.map((r) => {
        const key = `${folder.id}:${r.relativePath}`;
        const isSelected = key === selectedFsKey;
        return (
          <div
            key={r.relativePath}
            className={`vault-tree-row vault-file-row${isSelected ? ' vault-file-row-selected' : ''}`}
            style={{ paddingLeft: 14 }}
            onClick={() => onFileSelect(r.handle, { folderId: folder.id, relativePath: r.relativePath, fileName: r.name })}
          >
            <Icon name="document-text" />
            <span className="vault-tree-label">{r.relativePath}</span>
          </div>
        );
      })}
    </div>
  );
}

function DirectoryNode({
  dirHandle,
  folderId,
  pathSegments,
  depth,
  defaultExpanded,
  selectedFsKey,
  onFileSelect,
}: {
  dirHandle: FileSystemDirectoryHandle;
  folderId: string;
  pathSegments: string[];
  depth: number;
  defaultExpanded?: boolean;
  selectedFsKey: string | null;
  onFileSelect: (handle: FileSystemFileHandle, meta: FileSelectMeta) => void;
}) {
  const [expanded, setExpanded] = useState(!!defaultExpanded);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<FsEntry[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await listDirectory(dirHandle);
    setEntries(result);
    setLoading(false);
  }, [dirHandle]);

  useEffect(() => {
    if (expanded && entries === null) load();
  }, [expanded, entries, load]);

  return (
    <div style={{ paddingLeft: depth > 1 ? 14 : 0 }}>
      {depth > 1 && (
        <div className="vault-tree-row" onClick={() => setExpanded((e) => !e)}>
          <Icon name={expanded ? 'slim-arrow-down' : 'slim-arrow-right'} className="vault-tree-chevron" />
          <Icon name={expanded ? 'open-folder' : 'folder'} />
          <span className="vault-tree-label">{dirHandle.name}</span>
        </div>
      )}
      {expanded && (
        <div>
          {loading && <BusyIndicator active size="S" style={{ margin: '4px 14px' }} />}
          {entries?.map((entry) =>
            entry.kind === 'directory' ? (
              <DirectoryNode
                key={entry.name}
                dirHandle={entry.handle as FileSystemDirectoryHandle}
                folderId={folderId}
                pathSegments={[...pathSegments, entry.name]}
                depth={depth + 1}
                selectedFsKey={selectedFsKey}
                onFileSelect={onFileSelect}
              />
            ) : (
              <FileRow
                key={entry.name}
                fileHandle={entry.handle as FileSystemFileHandle}
                name={entry.name}
                folderId={folderId}
                pathSegments={pathSegments}
                selectedFsKey={selectedFsKey}
                onFileSelect={onFileSelect}
              />
            )
          )}
          {entries?.length === 0 && (
            <Text style={{ fontSize: '12px', color: 'var(--sapNeutralColor)', paddingLeft: 28 }}>Leer</Text>
          )}
        </div>
      )}
    </div>
  );
}

function FileRow({
  fileHandle,
  name,
  folderId,
  pathSegments,
  selectedFsKey,
  onFileSelect,
}: {
  fileHandle: FileSystemFileHandle;
  name: string;
  folderId: string;
  pathSegments: string[];
  selectedFsKey: string | null;
  onFileSelect: (handle: FileSystemFileHandle, meta: FileSelectMeta) => void;
}) {
  const relativePath = [...pathSegments, name].join('/');
  const key = `${folderId}:${relativePath}`;
  const isSelected = key === selectedFsKey;

  return (
    <div
      className={`vault-tree-row vault-file-row${isSelected ? ' vault-file-row-selected' : ''}`}
      style={{ paddingLeft: 14 }}
      onClick={() => onFileSelect(fileHandle, { folderId, relativePath, fileName: name })}
    >
      <Icon name="document-text" />
      <span className="vault-tree-label">{name}</span>
    </div>
  );
}
