import { useState, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  ThemeProvider,
  BusyIndicator,
  Button,
  Text,
  FlexBox,
  Icon,
  Dialog,
  SegmentedButton,
  SegmentedButtonItem,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/AllIcons.js';
import type { Document, FontSize, HighlightColor } from './types';
import { useDocuments } from './hooks/useDocuments';
import { useHighlights } from './hooks/useHighlights';
import { useFolders } from './hooks/useFolders';
import { useShareIntent } from './hooks/useShareIntent';
import { AppShell } from './components/AppShell';
import { SidebarToolbar } from './components/SidebarToolbar';
import { DocumentList } from './components/DocumentList';
import { VaultBrowser } from './components/VaultBrowser';
import { DocumentViewer, type DocumentViewerHandle } from './components/DocumentViewer';
import { CommentPanel } from './components/CommentPanel';
import { NotesEditor } from './components/NotesEditor';
import { exportAsJSON, exportAsMarkdown } from './services/exporter';
import { exportDatabaseBackup, importDatabaseBackup } from './services/backup';
import { exportDocumentBundle, importDocumentBundle } from './services/documentBundle';
import { readFileText, inferDocumentType, isFileSystemAccessSupported } from './services/filesystem';
import { hashContent } from './services/hash';
import { getAllHighlights } from './services/db';
import './App.css';

// showDirectoryPicker is present-but-nonfunctional in Capacitor's Android WebView
// (the JS property exists, calling it does nothing) — feature detection alone is unreliable there.
const VAULT_SUPPORTED = isFileSystemAccessSupported() && Capacitor.getPlatform() !== 'android';

// Auf Android landet ein Export nicht im Download, sondern im nativen Teilen-Menü
// (siehe services/fileExport.ts) — daher zeigen die Buttons dort "Teilen" statt "Export".
const IS_ANDROID = Capacitor.getPlatform() === 'android';

const HIGHLIGHT_COLORS: HighlightColor[] = ['yellow', 'green', 'blue', 'pink', 'orange'];
const FONT_SIZES: FontSize[] = ['S', 'M', 'L', 'XL'];

const HIGHLIGHT_COLOR_STYLES: Record<HighlightColor, string> = {
  yellow: '#FFEB3B',
  green: '#4CAF50',
  blue: '#2196F3',
  pink: '#E91E63',
  orange: '#FF9800',
};

export default function App() {
  const {
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
  } = useDocuments();
  const { folders, openFolderIds, openNewFolder, reopenFolder, closeFolder, forgetFolder } = useFolders();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(
    () => localStorage.getItem('readlighting-sidebar-open') !== 'false'
  );
  const [fontSize, setFontSize] = useState<FontSize>(
    () => (localStorage.getItem('readlighting-font-size') as FontSize | null) ?? 'M'
  );
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [commentPanelOpen, setCommentPanelOpen] = useState(true);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const documentViewerRef = useRef<DocumentViewerHandle>(null);

  const { highlights, addHighlight, updateHighlight, removeHighlight } = useHighlights(
    selectedDoc?.id ?? null
  );

  // Set of document IDs that have at least one highlight — drives the "in
  // progress" marker in the list. Notes-presence is read directly off the doc.
  const [highlightedDocIds, setHighlightedDocIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getAllHighlights().then((hs) => setHighlightedDocIds(new Set(hs.map((h) => h.documentId))));
  }, []);

  // Keep the marker live for the open document as highlights are added/removed.
  useEffect(() => {
    if (!selectedDoc) return;
    const id = selectedDoc.id;
    setHighlightedDocIds((prev) => {
      const has = prev.has(id);
      if (highlights.length > 0 && !has) {
        const next = new Set(prev);
        next.add(id);
        return next;
      }
      if (highlights.length === 0 && has) {
        const next = new Set(prev);
        next.delete(id);
        return next;
      }
      return prev;
    });
  }, [highlights, selectedDoc]);

  useEffect(() => {
    localStorage.setItem('readlighting-sidebar-open', String(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    localStorage.setItem('readlighting-font-size', fontSize);
  }, [fontSize]);

  const addDocumentRef = useRef(addDocument);
  addDocumentRef.current = addDocument;
  const setSelectedDocRef = useRef(setSelectedDoc);
  setSelectedDocRef.current = setSelectedDoc;

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith('#clip=')) return;
    try {
      const data = JSON.parse(decodeURIComponent(hash.slice(6))) as {
        title: string;
        url: string;
        content: string;
      };
      window.history.replaceState(null, '', window.location.pathname);
      addDocumentRef.current({
        title: data.title || data.url || 'Clipped Page',
        content: data.content,
        type: 'html',
        url: data.url,
        source: 'local',
      }).then((doc) => setSelectedDocRef.current(doc));
    } catch {
      // malformed clip data – ignore
    }
  }, []);

  const handleSelectDoc = useCallback((doc: Document) => {
    setSelectedDoc(doc);
    setActiveHighlightId(null);
  }, []);

  const handleAddDoc = useCallback(
    async (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'notes'>) => {
      const hash = await hashContent(doc.content);
      const existing = findByHash(hash);
      if (existing) {
        const updates: Partial<Document> = {};
        if (existing.content !== doc.content) updates.content = doc.content;
        // Re-adding a file that's currently in the trash brings it back.
        if (existing.deletedAt) updates.deletedAt = undefined;
        if (Object.keys(updates).length > 0) {
          await updateDocument(existing.id, updates);
          return { ...existing, ...updates };
        }
        return existing;
      }
      return addDocument({ ...doc, fs: { contentHash: hash } });
    },
    [addDocument, updateDocument, findByHash]
  );

  useShareIntent(handleAddDoc, handleSelectDoc);

  // Move to trash (the destructive-confirm prompt lives in DocumentList).
  const handleTrashDoc = useCallback(
    (id: string) => {
      trashDocument(id);
      if (selectedDoc?.id === id) setSelectedDoc(null);
    },
    [trashDocument, selectedDoc]
  );

  const handleRestoreDoc = useCallback(
    (id: string) => {
      restoreDocument(id);
    },
    [restoreDocument]
  );

  const handlePermanentDelete = useCallback(
    (id: string) => {
      deleteDocumentPermanently(id);
      setHighlightedDocIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (selectedDoc?.id === id) setSelectedDoc(null);
    },
    [deleteDocumentPermanently, selectedDoc]
  );

  const handleEmptyTrash = useCallback(() => {
    const trashedIds = new Set(trashedDocuments.map((d) => d.id));
    emptyTrash();
    setHighlightedDocIds((prev) => {
      const next = new Set([...prev].filter((id) => !trashedIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
    if (selectedDoc && trashedIds.has(selectedDoc.id)) setSelectedDoc(null);
  }, [emptyTrash, trashedDocuments, selectedDoc]);

  const handleRenameDoc = useCallback(
    (id: string, newTitle: string) => {
      updateDocument(id, { title: newTitle });
      if (selectedDoc?.id === id) setSelectedDoc((prev) => prev ? { ...prev, title: newTitle } : null);
    },
    [updateDocument, selectedDoc]
  );

  const handleToggleRead = useCallback(
    (id: string) => {
      const doc = documents.find((d) => d.id === id);
      if (!doc) return;
      const read = !doc.read;
      const completedAt = read ? new Date() : undefined;
      updateDocument(id, { read, completedAt });
      if (selectedDoc?.id === id) setSelectedDoc((prev) => prev ? { ...prev, read, completedAt } : null);
    },
    [documents, updateDocument, selectedDoc]
  );

  const handleToggleFavorite = useCallback(
    (id: string) => {
      const doc = documents.find((d) => d.id === id);
      if (!doc) return;
      const favorite = !doc.favorite;
      updateDocument(id, { favorite });
      if (selectedDoc?.id === id) setSelectedDoc((prev) => prev ? { ...prev, favorite } : null);
    },
    [documents, updateDocument, selectedDoc]
  );

  const handleFsFileSelect = useCallback(
    async (handle: FileSystemFileHandle, meta: { folderId: string; relativePath: string; fileName: string }) => {
      const content = await readFileText(handle);
      const hash = await hashContent(content);
      const existing = findByHash(hash);
      const fs = { folderId: meta.folderId, relativePath: meta.relativePath, fileName: meta.fileName, contentHash: hash };
      if (existing) {
        const fsChanged =
          existing.fs?.folderId !== fs.folderId ||
          existing.fs?.relativePath !== fs.relativePath ||
          existing.fs?.fileName !== fs.fileName;
        // Opening a file that's in the trash restores it.
        const wasTrashed = !!existing.deletedAt;
        if (existing.content !== content || fsChanged || existing.source !== 'filesystem' || wasTrashed) {
          await updateDocument(existing.id, {
            content,
            fs,
            source: 'filesystem',
            ...(wasTrashed ? { deletedAt: undefined } : {}),
          });
        }
        setSelectedDoc({ ...existing, content, fs, source: 'filesystem', deletedAt: undefined });
        setActiveHighlightId(null);
        return;
      }
      const newDoc = await addDocument({
        title: meta.fileName,
        content,
        type: inferDocumentType(meta.fileName),
        source: 'filesystem',
        fs,
      });
      setSelectedDoc(newDoc);
      setActiveHighlightId(null);
    },
    [findByHash, addDocument, updateDocument]
  );

  const handleHighlight = useCallback(
    async (start: number, end: number, text: string, color: HighlightColor) => {
      if (!selectedDoc) return;
      const h = await addHighlight({
        documentId: selectedDoc.id,
        startOffset: start,
        endOffset: end,
        text,
        color,
      });
      setActiveHighlightId(h.id);
    },
    [selectedDoc, addHighlight]
  );

  const handleHighlightClick = useCallback((id: string) => {
    setActiveHighlightId(id);
    setCommentPanelOpen(true);
  }, []);

  // Below the narrow-viewport breakpoint (matches App.css), the comments
  // panel overlays the document instead of squeezing it — closing it when
  // search opens keeps the search bar from being hidden underneath.
  const handleSearchOpen = useCallback(() => {
    if (window.matchMedia('(max-width: 700px)').matches) {
      setCommentPanelOpen(false);
    }
  }, []);

  const handleCommentSave = useCallback(
    (id: string, comment: string) => {
      updateHighlight(id, { comment });
    },
    [updateHighlight]
  );

  const handleNotesSave = useCallback(
    (notes: string) => {
      if (!selectedDoc) return;
      updateDocument(selectedDoc.id, { notes });
      setSelectedDoc((prev) => (prev ? { ...prev, notes } : null));
    },
    [selectedDoc, updateDocument]
  );

  const handleImportBundle = useCallback(async (file: File) => {
    const result = await importDocumentBundle(file);
    alert(
      `Importiert: ${result.importedHighlights} neue Markierung(en)` +
      (result.skippedHighlights ? `, ${result.skippedHighlights} bereits vorhanden.` : '.')
    );
    return result.document;
  }, []);

  const handleBackupImport = useCallback(async (file: File) => {
    try {
      const result = await importDatabaseBackup(file);
      alert(`Backup importiert: ${result.documents} Dokument(e), ${result.highlights} Markierung(en).`);
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Import fehlgeschlagen');
    }
  }, []);

  if (loading) {
    return (
      <ThemeProvider>
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <BusyIndicator active size="L" />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AppShell
        documentTitle={selectedDoc?.title}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        onBackupExport={() => void exportDatabaseBackup().catch(console.error)}
        onBackupImport={handleBackupImport}
      >
        <div className="main-layout">
          {sidebarOpen && (
            <aside className="sidebar-left">
              <SidebarToolbar
                searchQuery={search}
                onSearchChange={setSearch}
                onAdd={handleAddDoc}
                onSelect={handleSelectDoc}
                onImportBundle={handleImportBundle}
              />
              {VAULT_SUPPORTED && (
                <VaultBrowser
                  folders={folders}
                  openFolderIds={openFolderIds}
                  selectedFsKey={selectedDoc?.fs ? `${selectedDoc.fs.folderId}:${selectedDoc.fs.relativePath}` : null}
                  searchQuery={search}
                  onOpenNew={openNewFolder}
                  onReopen={reopenFolder}
                  onClose={closeFolder}
                  onForget={forgetFolder}
                  onFileSelect={handleFsFileSelect}
                />
              )}
              <DocumentList
                documents={documents}
                trashedDocuments={trashedDocuments}
                highlightedDocIds={highlightedDocIds}
                searchQuery={search}
                selectedId={selectedDoc?.id ?? null}
                onSelect={handleSelectDoc}
                onRename={handleRenameDoc}
                onDelete={handleTrashDoc}
                onRestore={handleRestoreDoc}
                onPermanentDelete={handlePermanentDelete}
                onEmptyTrash={handleEmptyTrash}
                onToggleRead={handleToggleRead}
                onToggleFavorite={handleToggleFavorite}
              />
            </aside>
          )}

          <main className="content-area">
            {selectedDoc ? (
              <>
                <div className="viewer-toolbar">
                  <FlexBox alignItems="Center" justifyContent="End" gap="8px" style={{ padding: '0 8px' }}>
                    <FlexBox alignItems="Center" gap="6px" title="Text markieren, dann Farbe wählen">
                      {HIGHLIGHT_COLORS.map((color) => (
                        <button
                          key={color}
                          className="color-swatch"
                          style={{ background: HIGHLIGHT_COLOR_STYLES[color] }}
                          title={color}
                          onClick={() => documentViewerRef.current?.applyHighlightToSelection(color)}
                        />
                      ))}
                    </FlexBox>
                    <SegmentedButton itemsFitContent title="Schriftgröße">
                      {FONT_SIZES.map((size) => (
                        <SegmentedButtonItem
                          key={size}
                          selected={fontSize === size}
                          onClick={() => setFontSize(size)}
                        >
                          {size}
                        </SegmentedButtonItem>
                      ))}
                    </SegmentedButton>
                    <Button
                      icon="search"
                      design="Default"
                      onClick={() => documentViewerRef.current?.openSearch()}
                    />
                    <Button
                      design={commentPanelOpen ? 'Emphasized' : 'Default'}
                      onClick={() => setCommentPanelOpen((o) => !o)}
                      icon="comment"
                    >
                      Kommentare ({highlights.length})
                    </Button>
                    <Button
                      icon={IS_ANDROID ? 'action' : 'download'}
                      design="Default"
                      onClick={() => setExportDialogOpen(true)}
                    >
                      {IS_ANDROID ? 'Teilen' : 'Export'}
                    </Button>
                  </FlexBox>
                </div>

                <div className="viewer-and-comments">
                  <div className="viewer-wrapper">
                    <DocumentViewer
                      ref={documentViewerRef}
                      document={selectedDoc}
                      highlights={highlights}
                      activeHighlightId={activeHighlightId}
                      fontSize={fontSize}
                      onHighlight={handleHighlight}
                      onHighlightClick={handleHighlightClick}
                      onSearchOpen={handleSearchOpen}
                    />
                  </div>

                  {commentPanelOpen && (
                    <aside className="sidebar-right">
                      <div className="comment-panel-header">
                        <Text style={{ fontWeight: '600', fontSize: '14px' }}>Comments</Text>
                        <Button
                          design="Transparent"
                          icon="decline"
                          onClick={() => setCommentPanelOpen(false)}
                        />
                      </div>
                      <div className="comment-panel-scroll">
                        <CommentPanel
                          highlights={highlights}
                          activeHighlightId={activeHighlightId}
                          onHighlightClick={handleHighlightClick}
                          onCommentSave={handleCommentSave}
                          onDelete={removeHighlight}
                        />
                      </div>
                    </aside>
                  )}
                </div>

                <div className="notes-section">
                  <NotesEditor notes={selectedDoc.notes} onSave={handleNotesSave} />
                </div>
              </>
            ) : (
              <div className="welcome-screen">
                <Icon name="color-fill" style={{ fontSize: '64px', color: 'var(--sapBrandColor)' }} />
                <h1 style={{ color: 'var(--sapTextColor)', marginTop: '16px' }}>Welcome to Readlighting</h1>
                <p style={{ color: 'var(--sapNeutralColor)', maxWidth: '480px', textAlign: 'center', lineHeight: '1.6' }}>
                  Upload a document or fetch a web URL from the sidebar to get started.
                  You can highlight text in multiple colors, add comments, and take notes.
                </p>
                <FlexBox gap="12px" style={{ marginTop: '24px' }}>
                  <div className="feature-chip">
                    <Icon name="color-fill" />
                    <span>Color Highlights</span>
                  </div>
                  <div className="feature-chip">
                    <Icon name="comment" />
                    <span>Comments</span>
                  </div>
                  <div className="feature-chip">
                    <Icon name="document-text" />
                    <span>Notes</span>
                  </div>
                  <div className="feature-chip">
                    <Icon name="search" />
                    <span>In-doc Search</span>
                  </div>
                </FlexBox>
              </div>
            )}
          </main>
        </div>
      </AppShell>

      <Dialog
        open={exportDialogOpen}
        headerText={`${IS_ANDROID ? 'Teilen' : 'Export'}: ${selectedDoc?.title ?? ''}`}
        onClose={() => setExportDialogOpen(false)}
        footer={
          <FlexBox justifyContent="End" style={{ padding: '8px' }}>
            <Button design="Transparent" onClick={() => setExportDialogOpen(false)}>
              Schließen
            </Button>
          </FlexBox>
        }
      >
        <div style={{ padding: '20px', minWidth: '340px' }}>
          <Text style={{ color: 'var(--sapNeutralColor)', fontSize: '13px', display: 'block', marginBottom: '16px' }}>
            {highlights.length} Markierung{highlights.length !== 1 ? 'en' : ''} · {selectedDoc?.notes.trim() ? 'Notizen vorhanden' : 'Keine Notizen'}
          </Text>
          <FlexBox direction="Column" gap="10px">
            <Button
              icon={IS_ANDROID ? 'action' : 'download'}
              design="Emphasized"
              style={{ width: '100%' }}
              onClick={() => {
                if (selectedDoc) void exportAsMarkdown(selectedDoc, highlights).catch(console.error);
                setExportDialogOpen(false);
              }}
            >
              {IS_ANDROID ? 'Als Markdown teilen (.md)' : 'Als Markdown exportieren (.md)'}
            </Button>
            <Button
              icon={IS_ANDROID ? 'action' : 'download'}
              design="Default"
              style={{ width: '100%' }}
              onClick={() => {
                if (selectedDoc) void exportAsJSON(selectedDoc, highlights).catch(console.error);
                setExportDialogOpen(false);
              }}
            >
              {IS_ANDROID ? 'Als JSON teilen (.json)' : 'Als JSON exportieren (.json)'}
            </Button>
          </FlexBox>
          <Text style={{ color: 'var(--sapNeutralColor)', fontSize: '12px', display: 'block', margin: '12px 0' }}>
            Markdown/JSON enthalten nur Markierungen, Kommentare und Notizen – nicht den Original-Inhalt.
          </Text>
          <Button
            icon="attachment"
            design="Emphasized"
            style={{ width: '100%' }}
            onClick={() => {
              if (selectedDoc) void exportDocumentBundle(selectedDoc, highlights).catch(console.error);
              setExportDialogOpen(false);
            }}
          >
            {IS_ANDROID ? 'Als Readlighting-Datei teilen (.json)' : 'Als Readlighting-Datei exportieren (.json)'}
          </Button>
          <Text style={{ color: 'var(--sapNeutralColor)', fontSize: '12px', display: 'block', marginTop: '8px' }}>
            Enthält Inhalt + Markierungen + Notizen – zum Übertragen auf ein anderes Gerät (z. B. Android → Ubuntu) per Import.
          </Text>
        </div>
      </Dialog>
    </ThemeProvider>
  );
}
