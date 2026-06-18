const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

export function stripFrontmatter(content: string): string {
  return content.replace(FRONTMATTER_RE, '');
}

export function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n/g, '\n');
}

export async function hashContent(content: string): Promise<string> {
  const normalized = normalizeLineEndings(stripFrontmatter(content));
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
