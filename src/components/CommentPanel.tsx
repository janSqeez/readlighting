import { useState } from 'react';
import type { TextAreaDomRef } from '@ui5/webcomponents-react';
import type { TextAreaInputEventDetail } from '@ui5/webcomponents/dist/TextArea.js';
import type { Ui5CustomEvent } from '@ui5/webcomponents-react-base';
import {
  Text,
  Button,
  TextArea,
  FlexBox,
  Icon,
  Tag,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/comment.js';
import '@ui5/webcomponents-icons/dist/delete.js';
import '@ui5/webcomponents-icons/dist/edit.js';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/decline.js';
import type { Highlight, HighlightColor } from '../types';

const COLOR_LABELS: Record<HighlightColor, string> = {
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  pink: 'Pink',
  orange: 'Orange',
};

interface CommentPanelProps {
  highlights: Highlight[];
  activeHighlightId: string | null;
  onHighlightClick: (id: string) => void;
  onCommentSave: (id: string, comment: string) => void;
  onDelete: (id: string) => void;
}

export function CommentPanel({
  highlights,
  activeHighlightId,
  onHighlightClick,
  onCommentSave,
  onDelete,
}: CommentPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  function startEdit(h: Highlight) {
    setEditingId(h.id);
    setEditText(h.comment ?? '');
  }

  function saveEdit(id: string) {
    onCommentSave(id, editText);
    setEditingId(null);
    setEditText('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText('');
  }

  if (highlights.length === 0) {
    return (
      <div className="comment-panel-empty">
        <Icon name="comment" style={{ fontSize: '32px', color: 'var(--sapNeutralColor)' }} />
        <Text style={{ marginTop: '12px', color: 'var(--sapNeutralColor)', textAlign: 'center', fontSize: '13px' }}>
          Select text in the document to create highlights and comments
        </Text>
      </div>
    );
  }

  return (
    <div className="comment-panel">
      {highlights.map((h) => (
        <div
          key={h.id}
          className={`comment-card ${h.id === activeHighlightId ? 'comment-card-active' : ''}`}
          onClick={() => onHighlightClick(h.id)}
        >
          <div className={`comment-card-stripe highlight-${h.color}`} />
          <div className="comment-card-body">
            <FlexBox justifyContent="SpaceBetween" alignItems="Center">
              <Tag colorScheme={getColorScheme(h.color)}>
                {COLOR_LABELS[h.color]}
              </Tag>
              <FlexBox gap="4px">
                <Button
                  icon="edit"
                  design="Transparent"
                  onClick={(e) => { e.stopPropagation(); startEdit(h); }}
                />
                <Button
                  icon="delete"
                  design="Transparent"
                  onClick={(e) => { e.stopPropagation(); onDelete(h.id); }}
                />
              </FlexBox>
            </FlexBox>

            <Text className="highlight-quote">
              &ldquo;{h.text.length > 120 ? h.text.slice(0, 120) + '…' : h.text}&rdquo;
            </Text>

            {editingId === h.id ? (
              <div onClick={(e) => e.stopPropagation()}>
                <TextArea
                  value={editText}
                  onInput={(e: Ui5CustomEvent<TextAreaDomRef, TextAreaInputEventDetail>) => setEditText(e.target.value ?? '')}
                  placeholder="Add a comment..."
                  rows={3}
                  style={{ width: '100%', marginTop: '8px' }}
                />
                <FlexBox gap="4px" style={{ marginTop: '6px' }}>
                  <Button icon="accept" design="Positive" onClick={() => saveEdit(h.id)}>Save</Button>
                  <Button icon="decline" design="Transparent" onClick={cancelEdit}>Cancel</Button>
                </FlexBox>
              </div>
            ) : (
              h.comment && (
                <Text className="comment-text">{h.comment}</Text>
              )
            )}

            <Text style={{ fontSize: '11px', color: 'var(--sapNeutralColor)', marginTop: '4px' }}>
              {new Date(h.createdAt).toLocaleString()}
            </Text>
          </div>
        </div>
      ))}
    </div>
  );
}

function getColorScheme(color: HighlightColor): string {
  const map: Record<HighlightColor, string> = {
    yellow: '2',
    green: '8',
    blue: '6',
    pink: '1',
    orange: '3',
  };
  return map[color];
}
