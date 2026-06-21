import type { Document, Highlight } from '../types';
import { saveOrShareTextFile } from './fileExport';

const COLOR_EMOJI: Record<string, string> = {
  yellow: '🟡',
  green: '🟢',
  blue: '🔵',
  pink: '🩷',
  orange: '🟠',
};

export async function exportAsJSON(doc: Document, highlights: Highlight[]): Promise<void> {
  const data = {
    document: {
      title: doc.title,
      type: doc.type,
      url: doc.url ?? null,
      createdAt: doc.createdAt,
      exportedAt: new Date().toISOString(),
    },
    notes: doc.notes,
    highlights: highlights.map((h) => ({
      text: h.text,
      color: h.color,
      comment: h.comment ?? '',
      startOffset: h.startOffset,
      endOffset: h.endOffset,
      createdAt: h.createdAt,
    })),
  };

  await saveOrShareTextFile(
    JSON.stringify(data, null, 2),
    `${slugify(doc.title)}.json`,
    'application/json'
  );
}

export async function exportAsMarkdown(doc: Document, highlights: Highlight[]): Promise<void> {
  const lines: string[] = [];

  lines.push(`# ${doc.title}`);
  if (doc.url) lines.push(`Quelle: ${doc.url}`);
  lines.push(`Exportiert: ${formatDate(new Date())}`);
  lines.push('');

  if (highlights.length > 0) {
    lines.push('## Markierungen');
    lines.push('');
    for (const h of highlights) {
      const emoji = COLOR_EMOJI[h.color] ?? '▪️';
      lines.push(`${emoji} "${h.text}"`);
      if (h.comment) lines.push(`> ${h.comment}`);
      lines.push('');
    }
  }

  if (doc.notes.trim()) {
    lines.push('---');
    lines.push('');
    lines.push('## Notizen');
    lines.push('');
    lines.push(doc.notes.trim());
  }

  await saveOrShareTextFile(
    lines.join('\n'),
    `${slugify(doc.title)}.md`,
    'text/markdown'
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
