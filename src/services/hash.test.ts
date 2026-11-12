import { describe, it, expect } from 'vitest';
import { hashContent, normalizeLineEndings, stripFrontmatter } from './hash';

describe('AC-002 content hashing', () => {
  it('AC-002-01: stripFrontmatter removes a leading --- block', () => {
    expect(stripFrontmatter('---\ntitle: x\n---\nBody')).toBe('Body');
  });

  it('AC-002-02: stripFrontmatter leaves content without frontmatter, or with --- not at the start, untouched', () => {
    expect(stripFrontmatter('Body')).toBe('Body');
    expect(stripFrontmatter('Intro\n---\na: b\n---\nBody')).toBe('Intro\n---\na: b\n---\nBody');
  });

  it('AC-002-03: normalizeLineEndings converts CRLF to LF', () => {
    expect(normalizeLineEndings('a\r\nb\r\n')).toBe('a\nb\n');
  });

  it('AC-002-04: hashContent is a 64-char lowercase hex SHA-256', async () => {
    expect(await hashContent('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('AC-002-05: hash is identical for CRLF/LF and with/without frontmatter', async () => {
    const a = await hashContent('---\nx: 1\n---\nline1\r\nline2');
    const b = await hashContent('line1\nline2');
    expect(a).toBe(b);
  });

  it('AC-002-06: different content gives a different hash', async () => {
    expect(await hashContent('a')).not.toBe(await hashContent('b'));
  });
});
