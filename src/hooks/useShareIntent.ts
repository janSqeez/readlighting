import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Encoding } from '@capacitor/filesystem';
import { SendIntent, type Intent } from '@mindlib-capacitor/send-intent';
import type { Document } from '../types';
import { inferDocumentType } from '../services/filesystem';

type AddDocFn = (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'notes'>) => Promise<Document>;

function titleFromIntent(intent: Intent): string {
  if (intent.title) return intent.title;
  if (intent.url) {
    const last = intent.url.split('/').pop();
    if (last) return decodeURIComponent(last);
  }
  return 'Geteiltes Dokument';
}

async function addDocFromIntent(intent: Intent, onAdd: AddDocFn): Promise<Document | null> {
  if (!intent.url) return null;
  // A shared file arrives as a file:// path (copied into app storage by the plugin); a
  // shared text snippet/link (no attachment, e.g. "share selected text") arrives as the
  // raw text itself in the same field.
  const isFileUri = intent.url.startsWith('file://') || intent.url.startsWith('content://');
  if (!isFileUri) {
    return onAdd({
      title: intent.title || intent.url.slice(0, 60),
      content: intent.url,
      type: 'text',
      source: 'local',
    });
  }
  const title = titleFromIntent(intent);
  const content = await Filesystem.readFile({ path: intent.url, encoding: Encoding.UTF8 });
  return onAdd({
    title,
    content: content.data as string,
    type: inferDocumentType(title),
    source: 'local',
  });
}

// Android only — other apps "Share" a file (e.g. from Nextcloud) directly into Readlighting.
// @mindlib-capacitor/send-intent's SendIntentActivity copies the shared file into app-private
// storage and hands back a file:// path, which @capacitor/filesystem reads directly.
export function useShareIntent(onAdd: AddDocFn, onSelect: (doc: Document) => void) {
  const onAddRef = useRef(onAdd);
  onAddRef.current = onAdd;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    async function handleIntent(intent: Intent) {
      const docs = [intent, ...((intent.additionalItems as Intent[]) ?? [])];
      for (const item of docs) {
        const doc = await addDocFromIntent(item, onAddRef.current);
        if (doc) onSelectRef.current(doc);
      }
    }

    // Empty deps: the activity's pending intent is consumed once and never re-set by the
    // native side, so this must run exactly once per mount — re-running on a dependency
    // change would re-process the same intent and race with the in-flight hash dedupe.
    SendIntent.checkSendIntentReceived().then(handleIntent).catch(() => {
      // no share intent pending — normal app launch
    });

    const listener = () => {
      SendIntent.checkSendIntentReceived().then(handleIntent).catch(() => {});
    };
    window.addEventListener('sendIntentReceived', listener);
    return () => window.removeEventListener('sendIntentReceived', listener);
  }, []);
}
