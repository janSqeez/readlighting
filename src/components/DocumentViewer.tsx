import { forwardRef, useRef, useEffect, useImperativeHandle, useMemo, useState, useCallback } from 'react';
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
import { getTextOffsets } from '../services/highlighter';

interface DocumentViewerProps {
  document: Document;
  highlights: Highlight[];
  activeHighlightId: string | null;
  onHighlight: (start: number, end: number, text: string, color: HighlightColor) => void;
  onHighlightClick: (id: string) => void;
  onSearchOpen?: () => void;
}

export interface DocumentViewerHandle {
  applyHighlightToSelection: (color: HighlightColor) => void;
  openSearch: () => void;
}

export const DocumentViewer = forwardRef<DocumentViewerHandle, DocumentViewerProps>(function DocumentViewer({
  document,
  highlights,
  activeHighlightId,
  onHighlight,
  onHighlightClick,
  onSearchOpen,
}, ref) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [searchVisible, setSearchVisible] = useState(false);

  const openSearch = useCallback(() => {
    setSearchVisible(true);
    onSearchOpen?.();
  }, [onSearchOpen]);

  useImperativeHandle(ref, () => ({
    applyHighlightToSelection(color: HighlightColor) {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();
      if (!selectedText) return;

      if (!contentRef.current?.contains(range.commonAncestorContainer)) return;

      const offsets = getTextOffsets(contentRef.current, range);
      if (!offsets || offsets.start === offsets.end) return;

      onHighlight(offsets.start, offsets.end, selectedText, color);
      selection.removeAllRanges();
    },
    openSearch,
  }), [onHighlight, openSearch]);

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
        openSearch();
      }
      if (e.key === 'Escape' && searchVisible) {
        setSearchVisible(false);
        setSearchQuery('');
      }
    }
    window.document.addEventListener('keydown', handleKeyDown);
    return () => window.document.removeEventListener('keydown', handleKeyDown);
  }, [searchVisible, openSearch]);

  useEffect(() => {
    function handleHighlightClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const mark = target.closest('mark[data-highlight-id]');
      if (mark) {
        const id = mark.getAttribute('data-highlight-id');
        if (id) {
          e.stopPropagation();
          onHighlightClick(id);
        }
      }
    }

    const container = contentRef.current;
    container?.addEventListener('click', handleHighlightClick);
    return () => container?.removeEventListener('click', handleHighlightClick);
  }, [onHighlightClick]);

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
      </div>
    </div>
  );
});
