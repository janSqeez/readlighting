import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { marked } from 'marked';
import type { InputDomRef } from '@ui5/webcomponents-react';
import type { Ui5CustomEvent } from '@ui5/webcomponents-react-base';
import {
  Input,
  Button,
  Text,
  FlexBox,
  Icon,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/search.js';
import '@ui5/webcomponents-icons/dist/navigation-up-arrow.js';
import '@ui5/webcomponents-icons/dist/navigation-down-arrow.js';
import '@ui5/webcomponents-icons/dist/decline.js';
import type { Document, Highlight, HighlightColor } from '../types';
import type { SearchMatch } from '../types';
import { applyHighlightsToContent } from '../services/highlighter';
import { HighlightLayer } from './HighlightLayer';

interface DocumentViewerProps {
  document: Document;
  highlights: Highlight[];
  activeHighlightId: string | null;
  onHighlight: (start: number, end: number, text: string, color: HighlightColor) => void;
  onHighlightClick: (id: string) => void;
}

export function DocumentViewer({
  document,
  highlights,
  activeHighlightId,
  onHighlight,
  onHighlightClick,
}: DocumentViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [searchVisible, setSearchVisible] = useState(false);

  useEffect(() => {
    setSearchQuery('');
    setSearchMatches([]);
    setActiveMatchIndex(0);
    setSearchVisible(false);
  }, [document.id]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMatches([]);
      setActiveMatchIndex(0);
      return;
    }

    const plainText = (() => {
      if (document.type === 'text') return document.content;
      const html =
        document.type === 'markdown'
          ? (marked.parse(document.content, { async: false }) as string)
          : document.content;
      const el = window.document.createElement('div');
      el.innerHTML = html;
      return el.textContent ?? '';
    })();

    const query = searchQuery.toLowerCase();
    const matches: SearchMatch[] = [];
    let idx = 0;
    let pos = plainText.toLowerCase().indexOf(query, idx);
    while (pos !== -1) {
      matches.push({ index: matches.length, start: pos, end: pos + query.length });
      idx = pos + 1;
      pos = plainText.toLowerCase().indexOf(query, idx);
    }
    setSearchMatches(matches);
    setActiveMatchIndex(0);
  }, [searchQuery, document.content, document.type]);

  useEffect(() => {
    if (!contentRef.current) return;
    const el = contentRef.current.querySelector('.search-match-active');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeMatchIndex, searchMatches]);

  useEffect(() => {
    if (!contentRef.current || !activeHighlightId) return;
    const el = contentRef.current.querySelector(`[data-highlight-id="${activeHighlightId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeHighlightId]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchVisible(true);
      }
      if (e.key === 'Escape' && searchVisible) {
        setSearchVisible(false);
        setSearchQuery('');
      }
    }
    window.document.addEventListener('keydown', handleKeyDown);
    return () => window.document.removeEventListener('keydown', handleKeyDown);
  }, [searchVisible]);

  const navigateSearch = useCallback((dir: 'prev' | 'next') => {
    setActiveMatchIndex((prev) => {
      if (searchMatches.length === 0) return 0;
      if (dir === 'next') return (prev + 1) % searchMatches.length;
      return (prev - 1 + searchMatches.length) % searchMatches.length;
    });
  }, [searchMatches.length]);

  const renderedContent = useMemo(() => {
    if (document.type === 'markdown') {
      const html = marked.parse(document.content, { async: false }) as string;
      return applyHighlightsToContent(html, 'html', highlights, searchMatches, activeMatchIndex);
    }
    return applyHighlightsToContent(document.content, document.type, highlights, searchMatches, activeMatchIndex);
  }, [document.content, document.type, highlights, searchMatches, activeMatchIndex]);

  return (
    <div className="document-viewer">
      {searchVisible && (
        <div className="search-bar">
          <FlexBox alignItems="Center" gap="8px">
            <Icon name="search" />
            <Input
              placeholder="Search in document..."
              value={searchQuery}
              onInput={(e: Ui5CustomEvent<InputDomRef>) => setSearchQuery(e.target.value ?? '')}
              style={{ flex: 1 }}
              autoFocus
            />
            {searchMatches.length > 0 && (
              <Text style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                {activeMatchIndex + 1} / {searchMatches.length}
              </Text>
            )}
            <Button icon="navigation-up-arrow" design="Transparent" onClick={() => navigateSearch('prev')} disabled={searchMatches.length === 0} />
            <Button icon="navigation-down-arrow" design="Transparent" onClick={() => navigateSearch('next')} disabled={searchMatches.length === 0} />
            <Button icon="decline" design="Transparent" onClick={() => { setSearchVisible(false); setSearchQuery(''); }} />
          </FlexBox>
        </div>
      )}

      <div className="document-content-wrapper">
        <div
          ref={contentRef}
          className={`document-content${document.type === 'markdown' ? ' markdown-content' : ''}`}
          dangerouslySetInnerHTML={{ __html: renderedContent ?? '' }}
        />
        <HighlightLayer
          containerRef={contentRef}
          onHighlight={onHighlight}
          onHighlightClick={onHighlightClick}
        />
      </div>
    </div>
  );
}
