import { describe, it, expect } from 'vitest';

describe('test setup', () => {
  it('provides IndexedDB and a DOM', () => {
    expect(indexedDB).toBeDefined();
    expect(document.createElement('div')).toBeDefined();
  });
});
