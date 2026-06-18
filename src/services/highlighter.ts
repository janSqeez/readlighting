import type { Highlight } from '../types';

export function getTextOffsets(
  container: HTMLElement,
  range: Range
): { start: number; end: number } | null {
  const fullText = container.textContent ?? '';
  if (!fullText) return null;

  const preStartRange = document.createRange();
  preStartRange.setStart(container, 0);
  preStartRange.setEnd(range.startContainer, range.startOffset);
  const start = preStartRange.toString().length;

  const preEndRange = document.createRange();
  preEndRange.setStart(container, 0);
  preEndRange.setEnd(range.endContainer, range.endOffset);
  const end = preEndRange.toString().length;

  return { start, end };
}

interface AnnotationSpan {
  start: number;
  end: number;
  openTag: string;
}

export function applyHighlightsToContent(
  content: string,
  type: 'html' | 'text' | 'markdown',
  highlights: Highlight[],
  searchMatches: Array<{ start: number; end: number }>,
  activeSearchIndex: number
): string {
  const spans: AnnotationSpan[] = [
    ...highlights.map((h) => ({
      start: h.startOffset,
      end: h.endOffset,
      openTag: `<mark class="highlight highlight-${h.color}" data-highlight-id="${h.id}">`,
    })),
    ...searchMatches.map((m, i) => ({
      start: m.start,
      end: m.end,
      openTag: `<mark class="${i === activeSearchIndex ? 'search-match search-match-active' : 'search-match'}" data-search-index="${i}">`,
    })),
  ].sort((a, b) => a.start - b.start);

  if (type === 'html') {
    return applyHighlightsToHTML(content, spans);
  }
  return applyHighlightsToText(content, spans);
}

function applyHighlightsToHTML(html: string, spans: AnnotationSpan[]): string {
  if (spans.length === 0) return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const state = { offset: 0 };

  walkAndAnnotate(doc.body, spans, state, doc);

  return doc.body.innerHTML;
}

function walkAndAnnotate(
  node: Node,
  spans: AnnotationSpan[],
  state: { offset: number },
  doc: Document
): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? '';
    const nodeStart = state.offset;
    state.offset += text.length;
    const nodeEnd = state.offset;

    const relevant = spans.filter((s) => s.end > nodeStart && s.start < nodeEnd);
    if (relevant.length === 0) return;

    let result = '';
    let pos = 0;

    for (const span of relevant) {
      const start = Math.max(pos, span.start - nodeStart);
      const end = Math.min(text.length, span.end - nodeStart);
      if (start >= end) continue;

      if (start > pos) result += escapeHTML(text.slice(pos, start));
      result += span.openTag + escapeHTML(text.slice(start, end)) + '</mark>';
      pos = end;
    }
    result += escapeHTML(text.slice(pos));

    const wrapper = doc.createElement('span');
    wrapper.innerHTML = result;
    node.parentNode?.replaceChild(wrapper, node);
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    for (const child of Array.from(node.childNodes)) {
      walkAndAnnotate(child, spans, state, doc);
    }
  }
}

function applyHighlightsToText(text: string, spans: AnnotationSpan[]): string {
  if (spans.length === 0) {
    return `<pre style="white-space:pre-wrap;font-family:inherit">${escapeHTML(text)}</pre>`;
  }

  let result = '';
  let pos = 0;

  for (const span of spans) {
    const start = Math.max(pos, span.start);
    const end = Math.min(text.length, span.end);
    if (start >= end) continue;

    if (start > pos) result += escapeHTML(text.slice(pos, start));
    result += span.openTag + escapeHTML(text.slice(start, end)) + '</mark>';
    pos = end;
  }
  result += escapeHTML(text.slice(pos));

  return `<pre style="white-space:pre-wrap;font-family:inherit">${result}</pre>`;
}

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
