import { useState } from 'react';
import type { InputDomRef } from '@ui5/webcomponents-react';
import type { Ui5CustomEvent } from '@ui5/webcomponents-react-base';
import {
  Input,
  Button,
  List,
  ListItemStandard,
  Dialog,
  Label,
  Text,
  FlexBox,
  Icon,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/delete.js';
import '@ui5/webcomponents-icons/dist/edit.js';
import '@ui5/webcomponents-icons/dist/document-text.js';
import '@ui5/webcomponents-icons/dist/world.js';
import type { Document } from '../types';

interface DocumentListProps {
  documents: Document[];
  searchQuery: string;
  selectedId: string | null;
  onSelect: (doc: Document) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

export function DocumentList({ documents, searchQuery, selectedId, onSelect, onRename, onDelete }: DocumentListProps) {
  const [renameDocId, setRenameDocId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const filtered = documents.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function openRename(doc: Document, e: { stopPropagation: () => void }) {
    e.stopPropagation();
    setRenameDocId(doc.id);
    setRenameValue(doc.title);
  }

  function confirmRename() {
    if (renameDocId && renameValue.trim()) {
      onRename(renameDocId, renameValue.trim());
    }
    setRenameDocId(null);
    setRenameValue('');
  }

  function getDocIcon(type: Document['type']) {
    return type === 'html' ? 'world' : 'document-text';
  }

  return (
    <div className="document-list-panel">
      <div className="document-list-header">
        <Text style={{ fontWeight: '600', fontSize: '13px' }}>Highlights</Text>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Icon name="document-text" style={{ fontSize: '48px', color: 'var(--sapNeutralColor)' }} />
          <Text style={{ marginTop: '16px', color: 'var(--sapNeutralColor)', textAlign: 'center' }}>
            {searchQuery ? 'Keine Dokumente gefunden.' : 'Noch keine Dokumente.\nDatei hochladen oder URL laden.'}
          </Text>
        </div>
      ) : (
        <List className="document-list">
          {filtered.map((doc) => (
            <ListItemStandard
              key={doc.id}
              icon={getDocIcon(doc.type)}
              description={new Date(doc.updatedAt).toLocaleDateString('de-DE')}
              selected={doc.id === selectedId}
              onClick={() => onSelect(doc)}
              additionalText={doc.type.toUpperCase()}
            >
              <div className="doc-list-item-content">
                <span className="doc-title">{doc.title}</span>
                <div className="doc-item-actions">
                  <Button
                    icon="edit"
                    design="Transparent"
                    className="item-action-btn"
                    tooltip="Umbenennen"
                    onClick={(e) => openRename(doc, e)}
                  />
                  <Button
                    icon="delete"
                    design="Transparent"
                    className="item-action-btn"
                    tooltip="Löschen"
                    onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                  />
                </div>
              </div>
            </ListItemStandard>
          ))}
        </List>
      )}

      {/* Rename Dialog */}
      <Dialog
        open={renameDocId !== null}
        headerText="Dokument umbenennen"
        onClose={() => { setRenameDocId(null); setRenameValue(''); }}
        footer={
          <FlexBox justifyContent="End" gap="8px" style={{ padding: '8px' }}>
            <Button design="Emphasized" onClick={confirmRename} disabled={!renameValue.trim()}>
              Umbenennen
            </Button>
            <Button design="Transparent" onClick={() => { setRenameDocId(null); setRenameValue(''); }}>
              Abbrechen
            </Button>
          </FlexBox>
        }
      >
        <div style={{ padding: '16px', minWidth: '360px' }}>
          <Label>Neuer Name</Label>
          <Input
            value={renameValue}
            onInput={(e: Ui5CustomEvent<InputDomRef>) => setRenameValue(e.target.value ?? '')}
            style={{ width: '100%', marginTop: '4px' }}
            onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); }}
            autoFocus
          />
        </div>
      </Dialog>
    </div>
  );
}
