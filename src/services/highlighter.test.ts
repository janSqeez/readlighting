import { describe, it, expect } from 'vitest';
import { applyHighlightsToContent, getTextOffsets } from './highlighter';
import type { Highlight } from '../types';

function hl(p: Partial<Highlight>): Highlight {
  return {
    id: 'h1', documentId: 'd1', startOffset: 0, endOffset: 0, text: '', color: 'yellow',
    createdAt: new Date(0), ...p,
  };
}

describe('AC-001 highlighter', () => {
  it('AC-001-01: wraps a plaintext range in a colored mark with its highlight id', () => {
    const out = applyHighlightsToContent('Hello world', 'text', [hl({ startOffset: 6, endOffset: 11, color: 'green' })], [], 0);
    expect(out).toContain('<mark class="highlight highlight-green" data-highlight-id="h1">world</mark>');
    expect(out.startsWith('<pre style="white-space:pre-wrap;font-family:inherit">Hello ')).toBe(true);
  });

  it('AC-001-02: plaintext/markdown without annotations is returned as escaped <pre>', () => {
    const out = applyHighlightsToContent('a <b> & "c"', 'text', [], [], 0);
    expect(out).toBe('<pre style="white-space:pre-wrap;font-family:inherit">a &lt;b&gt; &amp; &quot;c&quot;</pre>');
  });

  it('AC-001-03: HTML without annotations is returned unchanged', () => {
    const html = '<p>Hi <b>there</b></p>';
    expect(applyHighlightsToContent(html, 'html', [], [], 0)).toBe(html);
  });

  it('AC-001-04: HTML offsets count text characters only, across element boundaries', () => {
    const out = applyHighlightsToContent('<p>Hello <b>big</b> world</p>', 'html', [hl({ startOffset: 6, endOffset: 9 })], [], 0);
    expect(out).toContain('<mark class="highlight highlight-yellow" data-highlight-id="h1">big</mark>');
  });

  it('AC-001-05: a highlight spanning several text nodes is split into one mark per node', () => {
    const out = applyHighlightsToContent('<p>ab<b>cd</b>ef</p>', 'html', [hl({ startOffset: 1, endOffset: 5 })], [], 0);
    expect(out.match(/data-highlight-id="h1"/g)).toHaveLength(3);
  });

  it('AC-001-06: text content is HTML-escaped inside marks (no markup injection)', () => {
    const out = applyHighlightsToContent('x <script> y', 'text', [hl({ startOffset: 2, endOffset: 10 })], [], 0);
    expect(out).toContain('&lt;script&gt;');
    expect(out).not.toContain('<script>');
  });

  it('AC-001-07: search matches get search-match, the active one also search-match-active', () => {
    const out = applyHighlightsToContent('foo foo', 'text', [], [{ start: 0, end: 3 }, { start: 4, end: 7 }], 1);
    expect(out).toContain('<mark class="search-match" data-search-index="0">foo</mark>');
    expect(out).toContain('<mark class="search-match search-match-active" data-search-index="1">foo</mark>');
  });

  it('AC-001-08: overlapping plaintext highlights: the later one is clipped at the earlier one (known quirk)', () => {
    const out = applyHighlightsToContent('abcdef', 'text', [
      hl({ id: 'a', startOffset: 0, endOffset: 4 }),
      hl({ id: 'b', startOffset: 2, endOffset: 6 }),
    ], [], 0);
    expect(out).toContain('data-highlight-id="a">abcd</mark>');
    expect(out).toContain('data-highlight-id="b">ef</mark>');
  });

  it('AC-001-09: spans outside the content range produce no mark', () => {
    const out = applyHighlightsToContent('abc', 'text', [hl({ startOffset: 10, endOffset: 20 })], [], 0);
    expect(out).not.toContain('<mark');
  });

  it('AC-001-10: getTextOffsets returns selection offsets relative to the container text', () => {
    const container = document.createElement('div');
    container.innerHTML = '<p>Hello <b>big</b> world</p>';
    const bold = container.querySelector('b')!.firstChild!;
    const range = document.createRange();
    range.setStart(bold, 0);
    range.setEnd(bold, 3);
    expect(getTextOffsets(container, range)).toEqual({ start: 6, end: 9 });
  });

  it('AC-001-11: getTextOffsets returns null for an empty container', () => {
    const container = document.createElement('div');
    const range = document.createRange();
    range.setStart(container, 0);
    range.setEnd(container, 0);
    expect(getTextOffsets(container, range)).toBeNull();
  });
});
