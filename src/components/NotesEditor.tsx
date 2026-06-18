import { useState, useCallback } from 'react';
import type { TextAreaDomRef } from '@ui5/webcomponents-react';
import type { TextAreaInputEventDetail } from '@ui5/webcomponents/dist/TextArea.js';
import type { Ui5CustomEvent } from '@ui5/webcomponents-react-base';
import {
  SegmentedButton,
  SegmentedButtonItem,
  TextArea,
  Panel,
} from '@ui5/webcomponents-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NotesEditorProps {
  notes: string;
  onSave: (notes: string) => void;
}

export function NotesEditor({ notes, onSave }: NotesEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [localNotes, setLocalNotes] = useState(notes);

  const handleChange = useCallback(
    (value: string) => {
      setLocalNotes(value);
      onSave(value);
    },
    [onSave]
  );

  return (
    <Panel
      headerText="Notes"
      collapsed={false}
      className="notes-panel"
    >
      <div className="notes-editor">
        <div className="notes-toolbar">
          <SegmentedButton>
            <SegmentedButtonItem
              selected={mode === 'edit'}
              onClick={() => setMode('edit')}
            >
              Edit
            </SegmentedButtonItem>
            <SegmentedButtonItem
              selected={mode === 'preview'}
              onClick={() => setMode('preview')}
            >
              Preview
            </SegmentedButtonItem>
          </SegmentedButton>
        </div>

        {mode === 'edit' ? (
          <TextArea
            value={localNotes}
            onInput={(e: Ui5CustomEvent<TextAreaDomRef, TextAreaInputEventDetail>) => handleChange(e.target.value ?? '')}
            placeholder="Write your notes in Markdown format..."
            rows={8}
            style={{ width: '100%', fontFamily: 'monospace', marginTop: '8px' }}
            growing
            growingMaxRows={20}
          />
        ) : (
          <div className="markdown-preview">
            {localNotes ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{localNotes}</ReactMarkdown>
            ) : (
              <p style={{ color: 'var(--sapNeutralColor)', fontStyle: 'italic' }}>
                No notes yet. Switch to Edit mode to add notes.
              </p>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
