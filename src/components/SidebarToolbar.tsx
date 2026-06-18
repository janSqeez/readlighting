import { useState, useRef } from 'react';
import type { InputDomRef } from '@ui5/webcomponents-react';
import type { Ui5CustomEvent } from '@ui5/webcomponents-react-base';
import { Input, Button, Dialog, Label, BusyIndicator, Text, FlexBox, Icon } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/search.js';
import '@ui5/webcomponents-icons/dist/upload.js';
import '@ui5/webcomponents-icons/dist/chain-link.js';
import '@ui5/webcomponents-icons/dist/attachment.js';
import type { Document } from '../types';
import { fetchUrl } from '../services/crawler';

interface SidebarToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAdd: (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'notes'>) => Promise<Document>;
  onSelect: (doc: Document) => void;
  onImportBundle: (file: File) => Promise<Document>;
}

export function SidebarToolbar({ searchQuery, onSearchChange, onAdd, onSelect, onImportBundle }: SidebarToolbarProps) {
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bundleInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    const ext = file.name.split('.').pop()?.toLowerCase();
    const type =
      ext === 'md' || ext === 'markdown' ? 'markdown'
      : ext === 'html' || ext === 'htm' ? 'html'
      : 'text';
    const doc = await onAdd({ title: file.name, content, type, source: 'local' });
    onSelect(doc);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleBundleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const doc = await onImportBundle(file);
      onSelect(doc);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Import fehlgeschlagen');
    }
    if (bundleInputRef.current) bundleInputRef.current.value = '';
  }

  async function handleFetchUrl() {
    if (!urlInput.trim()) return;
    setFetching(true);
    setFetchError('');
    try {
      const result = await fetchUrl(urlInput.trim());
      const doc = await onAdd({
        title: result.title,
        content: result.content,
        type: result.type,
        url: urlInput.trim(),
        source: 'local',
      });
      onSelect(doc);
      setUrlDialogOpen(false);
      setUrlInput('');
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Fehler beim Laden');
    } finally {
      setFetching(false);
    }
  }

  return (
    <div className="sidebar-toolbar">
      <Input
        placeholder="Suchen..."
        value={searchQuery}
        onInput={(e: Ui5CustomEvent<InputDomRef>) => onSearchChange(e.target.value ?? '')}
        icon={<Icon name="search" />}
        style={{ width: '100%' }}
      />
      <FlexBox gap="8px" style={{ marginTop: '8px' }}>
        <Button icon="upload" design="Emphasized" style={{ flex: 1 }} onClick={() => fileInputRef.current?.click()}>
          Upload
        </Button>
        <Button icon="chain-link" design="Default" style={{ flex: 1 }} onClick={() => setUrlDialogOpen(true)}>
          Fetch URL
        </Button>
      </FlexBox>
      <Button
        icon="attachment"
        design="Transparent"
        style={{ width: '100%', marginTop: '4px' }}
        tooltip="Readlighting-Datei importieren (von einem anderen Gerät)"
        onClick={() => bundleInputRef.current?.click()}
      >
        Readlighting-Datei importieren
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.html,.htm,.md,.markdown"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
      <input
        ref={bundleInputRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={handleBundleImport}
      />

      <Dialog
        open={urlDialogOpen}
        headerText="Webseite laden"
        onClose={() => { setUrlDialogOpen(false); setFetchError(''); }}
        footer={
          <FlexBox justifyContent="End" gap="8px" style={{ padding: '8px' }}>
            <Button design="Emphasized" onClick={handleFetchUrl} disabled={fetching || !urlInput.trim()}>
              {fetching ? 'Wird geladen...' : 'Laden'}
            </Button>
            <Button design="Transparent" onClick={() => { setUrlDialogOpen(false); setFetchError(''); }}>
              Abbrechen
            </Button>
          </FlexBox>
        }
      >
        <div style={{ padding: '16px', minWidth: '400px' }}>
          <Label>URL</Label>
          <Input
            placeholder="https://example.com/artikel"
            value={urlInput}
            onInput={(e: Ui5CustomEvent<InputDomRef>) => setUrlInput(e.target.value ?? '')}
            style={{ width: '100%', marginTop: '4px' }}
            disabled={fetching}
          />
          {fetching && (
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BusyIndicator active size="S" />
              <Text>Inhalt wird geladen...</Text>
            </div>
          )}
          {fetchError && (
            <Text style={{ color: 'var(--sapErrorColor)', marginTop: '8px' }}>{fetchError}</Text>
          )}
        </div>
      </Dialog>
    </div>
  );
}
