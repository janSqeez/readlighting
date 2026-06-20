import { useState } from 'react';
import type { InputDomRef } from '@ui5/webcomponents-react';
import type { Ui5CustomEvent } from '@ui5/webcomponents-react-base';
import {
  Input,
  Button,
  ToggleButton,
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
import '@ui5/webcomponents-icons/dist/favorite.js';
import '@ui5/webcomponents-icons/dist/unfavorite.js';
import '@ui5/webcomponents-icons/dist/complete.js';
import '@ui5/webcomponents-icons/dist/circle-task.js';
import type { Document } from '../types';

type DocFilter = 'favorite' | 'unread' | 'completed';

interface DocumentListProps {
  documents: Document[];
  searchQuery: string;
  selectedId: string | null;
  onSelect: (doc: Document) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onToggleRead: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

// Sort tier: favorites always float to the top (regardless of read state),
// completed documents always sink to the bottom, unread/non-favorite stay in the middle.
function sortTier(doc: Document): number {
  if (doc.favorite) return 0;
  if (!doc.read) return 1;
  return 2;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('de-DE');
}

export function DocumentList({
  documents,
  searchQuery,
  selectedId,
  onSelect,
  onRename,
  onDelete,
  onToggleRead,
  onToggleFavorite,
}: DocumentListProps) {
  const [renameDocId, setRenameDocId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<DocFilter>>(new Set());

  function toggleFilter(filter: DocFilter) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  }

  function matchesFilters(doc: Document): boolean {
    if (activeFilters.size === 0) return true;
    return (
      (activeFilters.has('favorite') && !!doc.favorite) ||
      (activeFilters.has('unread') && !doc.read) ||
      (activeFilters.has('completed') && !!doc.read)
    );
  }

  const filtered = documents
    .filter((d) => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(matchesFilters)
    .sort((a, b) => sortTier(a) - sortTier(b));

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
        <Text style={{ fontWeight: '600', fontSize: '13px' }}>Dokumente</Text>
        <div className="document-list-filters">
          <ToggleButton
            icon="favorite"
            design="Transparent"
            className="filter-toggle-btn"
            pressed={activeFilters.has('favorite')}
            tooltip="Nur Favoriten"
            onClick={() => toggleFilter('favorite')}
          />
          <ToggleButton
            icon="circle-task"
            design="Transparent"
            className="filter-toggle-btn"
            pressed={activeFilters.has('unread')}
            tooltip="Nur nicht abgeschlossene"
            onClick={() => toggleFilter('unread')}
          />
          <ToggleButton
            icon="complete"
            design="Transparent"
            className="filter-toggle-btn"
            pressed={activeFilters.has('completed')}
            tooltip="Nur abgeschlossene"
            onClick={() => toggleFilter('completed')}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Icon name="document-text" style={{ fontSize: '48px', color: 'var(--sapNeutralColor)' }} />
          <Text style={{ marginTop: '16px', color: 'var(--sapNeutralColor)', textAlign: 'center' }}>
            {documents.length === 0
              ? 'Noch keine Dokumente.\nDatei hochladen oder URL laden.'
              : 'Keine Dokumente gefunden.'}
          </Text>
        </div>
      ) : (
        <List className="document-list">
          {filtered.map((doc) => (
            <ListItemStandard
              key={doc.id}
              icon={getDocIcon(doc.type)}
              selected={doc.id === selectedId}
              onClick={() => onSelect(doc)}
            >
              <div className="doc-list-item-content">
                <div className="doc-title-row">
                  <Button
                    icon={doc.favorite ? 'favorite' : 'unfavorite'}
                    design="Transparent"
                    className={`item-action-btn favorite-btn${doc.favorite ? ' is-favorite' : ''}`}
                    tooltip={doc.favorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(doc.id); }}
                  />
                  <span className={`doc-title${doc.read ? ' doc-title-read' : ''}`}>{doc.title}</span>
                  <Button
                    icon={doc.read ? 'complete' : 'circle-task'}
                    design="Transparent"
                    className={`item-action-btn read-btn${doc.read ? ' is-read' : ''}`}
                    tooltip={doc.read ? 'Als ungelesen markieren' : 'Als gelesen markieren'}
                    onClick={(e) => { e.stopPropagation(); onToggleRead(doc.id); }}
                  />
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
                <div className="doc-meta-row">
                  <span className="doc-date">Erstellt {formatDate(doc.createdAt)}</span>
                  {doc.read && doc.completedAt && (
                    <span className="doc-date doc-date-completed">Abgeschlossen {formatDate(doc.completedAt)}</span>
                  )}
                  <span className="doc-type-badge">{doc.type.toUpperCase()}</span>
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
