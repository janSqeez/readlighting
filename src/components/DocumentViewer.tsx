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
import type { Document, FontSize, Highlight, HighlightColor } from '../types';
import type { SearchMatch } from '../types';
import { applyHighlightsToContent } from '../services/highlighter';
import { getTextOffsets } from '../services/highlighter';

// M matches the font-size that .document-content always had before the
// font-size feature was added, so existing readers see no visual change.
const FONT_SIZE_PX: Record<FontSize, string> = {
  S: '14px',
  M: '16px',
  L: '19px',
  XL: '22px',
};

// Words per "book page" for the page-count estimate — a typical paperback page
// holds ~250 words. Used only for the rough reading-length stat in the footer.
const WORDS_PER_PAGE = 250;

interface DocumentViewerProps {
  document: Document;
  highlights: Highlight[];
  activeHighlightId: string | null;
  fontSize: FontSize;
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
  fontSize,
  onHighlight,
  onHighlightClick,
  onSearchOpen,
}, ref) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [searchVisible, setSearchVisible] = useState(false);
  // Fraction (0..1) of the document scrolled through — drives the reading-progress footer.
  const [scrollProgress, setScrollProgress] = useState(0);

  // Plain text of the document, used both for word count and in-document search.
  const plainText = useMemo(() => {
    if (document.type === 'text') return document.content;
    const html =
      document.type === 'markdown'
        ? (marked.parse(document.content, { async: false }) as string)
        : document.content;
    const el = window.document.createElement('div');
    el.innerHTML = html;
    return el.textContent ?? '';
  }, [document.content, document.type]);

  const wordCount = useMemo(
    () => plainText.trim().split(/\s+/).filter(Boolean).length,
    [plainText],
  );
  const pageCount = Math.max(1, Math.ceil(wordCount / WORDS_PER_PAGE));
  const progressPercent = Math.round(scrollProgress * 100);
  // Pages "read" so far = how far the scroll has progressed through the page total.
  const pagesRead = Math.min(pageCount, Math.floor(scrollProgress * pageCount));

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
    setScrollProgress(0);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [document.id]);

  // Track reading progress as the user scrolls through .document-content (the
  // element that actually scrolls). Recomputed when the rendered content changes
  // so the scrollable height reflects the new document.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const maxScroll = el.scrollHeight - el.clientHeight;
      setScrollProgress(maxScroll > 0 ? Math.min(1, el.scrollTop / maxScroll) : 1);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [document.id, document.content, fontSize]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMatches([]);
      setActiveMatchIndex(0);
      return;
    }

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
  }, [searchQuery, plainText]);

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
          style={{ fontSize: FONT_SIZE_PX[fontSize] }}
          dangerouslySetInnerHTML={{ __html: renderedContent ?? '' }}
        />
      </div>

      <div className="document-stats-bar">
        <Text className="document-stats-length">
          {wordCount.toLocaleString('de-DE')} Wörter · ~{pageCount} {pageCount === 1 ? 'Seite' : 'Seiten'}
        </Text>
        <div className="document-stats-progress">
          <div
            className="document-stats-progress-track"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Lesefortschritt"
          >
            <div className="document-stats-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <Text className="document-stats-progress-label">
            {progressPercent}% · {pagesRead}/{pageCount} Seiten
          </Text>
        </div>
      </div>
    </div>
  );
});
