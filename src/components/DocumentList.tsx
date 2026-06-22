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
import '@ui5/webcomponents-icons/dist/undo.js';
import '@ui5/webcomponents-icons/dist/color-fill.js';
import '@ui5/webcomponents-icons/dist/navigation-down-arrow.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import type { Document } from '../types';

type DocFilter = 'favorite' | 'unread' | 'completed';

interface DocumentListProps {
  documents: Document[];
  trashedDocuments: Document[];
  highlightedDocIds: Set<string>;
  searchQuery: string;
  selectedId: string | null;
  onSelect: (doc: Document) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
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

function getDocIcon(type: Document['type']) {
  return type === 'html' ? 'world' : 'document-text';
}

export function DocumentList({
  documents,
  trashedDocuments,
  highlightedDocIds,
  searchQuery,
  selectedId,
  onSelect,
  onRename,
  onDelete,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
  onToggleRead,
  onToggleFavorite,
}: DocumentListProps) {
  const [renameDocId, setRenameDocId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<DocFilter>>(new Set());
  const [trashOpen, setTrashOpen] = useState(false);
  // Pending-confirmation state for the three destructive actions.
  const [trashConfirmId, setTrashConfirmId] = useState<string | null>(null);
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null);
  const [emptyTrashConfirm, setEmptyTrashConfirm] = useState(false);

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

  // A document is "in Bearbeitung" once it has any highlight or non-empty notes.
  function hasProgress(doc: Document): boolean {
    return highlightedDocIds.has(doc.id) || !!doc.notes?.trim();
  }

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

  const trashConfirmDoc = trashConfirmId
    ? documents.find((d) => d.id === trashConfirmId)
    : null;
  const permanentDeleteDoc = permanentDeleteId
    ? trashedDocuments.find((d) => d.id === permanentDeleteId)
    : null;

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
                  {hasProgress(doc) && !doc.read && (
                    <span
                      className="doc-progress-icon"
                      title="In Bearbeitung – Markierungen oder Notizen vorhanden"
                    >
                      <Icon name="color-fill" />
                    </span>
                  )}
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
                      tooltip="In den Papierkorb"
                      onClick={(e) => { e.stopPropagation(); setTrashConfirmId(doc.id); }}
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

      {/* Papierkorb (Trash) */}
      <div className="trash-section">
        <button
          type="button"
          className="trash-header"
          onClick={() => setTrashOpen((o) => !o)}
          aria-expanded={trashOpen}
        >
          <Icon name={trashOpen ? 'navigation-down-arrow' : 'navigation-right-arrow'} className="trash-chevron" />
          <Icon name="delete" />
          <span className="trash-header-label">Papierkorb ({trashedDocuments.length})</span>
        </button>
        {trashOpen && (
          <div className="trash-list">
            {trashedDocuments.length === 0 ? (
              <div className="trash-empty">Papierkorb ist leer.</div>
            ) : (
              <>
                <div className="trash-actions">
                  <Button
                    design="Transparent"
                    icon="delete"
                    onClick={() => setEmptyTrashConfirm(true)}
                  >
                    Papierkorb leeren
                  </Button>
                </div>
                {trashedDocuments.map((doc) => (
                  <div className="trash-row" key={doc.id}>
                    <Icon name={getDocIcon(doc.type)} className="trash-row-icon" />
                    <span className="trash-row-title" title={doc.title}>{doc.title}</span>
                    <Button
                      icon="undo"
                      design="Transparent"
                      className="item-action-btn"
                      tooltip="Wiederherstellen"
                      onClick={() => onRestore(doc.id)}
                    />
                    <Button
                      icon="delete"
                      design="Transparent"
                      className="item-action-btn"
                      tooltip="Endgültig löschen"
                      onClick={() => setPermanentDeleteId(doc.id)}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

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

      {/* Move-to-trash confirmation */}
      <Dialog
        open={trashConfirmId !== null}
        headerText="In den Papierkorb verschieben?"
        onClose={() => setTrashConfirmId(null)}
        footer={
          <FlexBox justifyContent="End" gap="8px" style={{ padding: '8px' }}>
            <Button
              design="Emphasized"
              icon="delete"
              onClick={() => {
                if (trashConfirmId) onDelete(trashConfirmId);
                setTrashConfirmId(null);
              }}
            >
              In den Papierkorb
            </Button>
            <Button design="Transparent" onClick={() => setTrashConfirmId(null)}>
              Abbrechen
            </Button>
          </FlexBox>
        }
      >
        <div style={{ padding: '16px', minWidth: '320px', maxWidth: '420px' }}>
          <Text>
            „{trashConfirmDoc?.title ?? 'Dieses Dokument'}“ wird in den Papierkorb verschoben.
            Du kannst es dort wiederherstellen oder endgültig löschen.
          </Text>
        </div>
      </Dialog>

      {/* Permanent delete confirmation */}
      <Dialog
        open={permanentDeleteId !== null}
        headerText="Endgültig löschen?"
        onClose={() => setPermanentDeleteId(null)}
        footer={
          <FlexBox justifyContent="End" gap="8px" style={{ padding: '8px' }}>
            <Button
              design="Negative"
              icon="delete"
              onClick={() => {
                if (permanentDeleteId) onPermanentDelete(permanentDeleteId);
                setPermanentDeleteId(null);
              }}
            >
              Endgültig löschen
            </Button>
            <Button design="Transparent" onClick={() => setPermanentDeleteId(null)}>
              Abbrechen
            </Button>
          </FlexBox>
        }
      >
        <div style={{ padding: '16px', minWidth: '320px', maxWidth: '420px' }}>
          <Text>
            „{permanentDeleteDoc?.title ?? 'Dieses Dokument'}“ wird mit allen Markierungen und
            Notizen unwiderruflich gelöscht. Dies kann nicht rückgängig gemacht werden.
          </Text>
        </div>
      </Dialog>

      {/* Empty trash confirmation */}
      <Dialog
        open={emptyTrashConfirm}
        headerText="Papierkorb leeren?"
        onClose={() => setEmptyTrashConfirm(false)}
        footer={
          <FlexBox justifyContent="End" gap="8px" style={{ padding: '8px' }}>
            <Button
              design="Negative"
              icon="delete"
              onClick={() => {
                onEmptyTrash();
                setEmptyTrashConfirm(false);
              }}
            >
              Papierkorb leeren
            </Button>
            <Button design="Transparent" onClick={() => setEmptyTrashConfirm(false)}>
              Abbrechen
            </Button>
          </FlexBox>
        }
      >
        <div style={{ padding: '16px', minWidth: '320px', maxWidth: '420px' }}>
          <Text>
            Alle {trashedDocuments.length} Dokument{trashedDocuments.length !== 1 ? 'e' : ''} im
            Papierkorb werden mit ihren Markierungen und Notizen unwiderruflich gelöscht.
          </Text>
        </div>
      </Dialog>
    </div>
  );
}
