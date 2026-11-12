import { describe, it, expect, afterEach, vi } from 'vitest';
import { fetchUrl } from './crawler';

function mockFetch(handler: (url: string) => Response | Promise<Response>) {
  const calls: string[] = [];
  vi.stubGlobal('fetch', async (u: string) => { calls.push(u); return handler(u); });
  return calls;
}
const ok = (body: string) => new Response(body, { status: 200 });

afterEach(() => vi.unstubAllGlobals());

describe('AC-007 URL fetching', () => {
  it('AC-007-01: requests the page through the first proxy with the encoded URL', async () => {
    const calls = mockFetch(() => ok('<html><title>T</title><body><p>x</p></body></html>'));
    await fetchUrl('https://a.test/p?q=1&r=2');
    expect(calls[0]).toBe('https://corsproxy.io/?url=' + encodeURIComponent('https://a.test/p?q=1&r=2'));
  });

  it('AC-007-02: falls back to the second proxy (JSON .contents) when the first fails', async () => {
    const calls = mockFetch((u) => u.includes('corsproxy') ? new Response('', { status: 500 }) : ok(JSON.stringify({ contents: '<title>Via2</title><body>b</body>' })));
    const r = await fetchUrl('https://a.test/');
    expect(calls).toHaveLength(2);
    expect(r.title).toBe('Via2');
  });

  it('AC-007-03: throws a German error with the last cause when all proxies fail', async () => {
    mockFetch(() => new Response('', { status: 503 }));
    await expect(fetchUrl('https://a.test/')).rejects.toThrow('Artikel konnte nicht geladen werden: HTTP 503');
  });

  it('AC-007-04: .md/.markdown URLs return raw content as markdown titled by the file name', async () => {
    mockFetch(() => ok('# Hi'));
    expect(await fetchUrl('https://a.test/docs/README.md')).toEqual({ title: 'README.md', content: '# Hi', type: 'markdown' });
    expect((await fetchUrl('https://a.test/x.MARKDOWN')).type).toBe('markdown');
  });

  it('AC-007-05: .txt URLs return raw content as text', async () => {
    mockFetch(() => ok('plain'));
    expect(await fetchUrl('https://a.test/n.txt')).toEqual({ title: 'n.txt', content: 'plain', type: 'text' });
  });

  it('AC-007-06: HTML: title from <title>, else first <h1>, else the URL', async () => {
    mockFetch(() => ok('<html><head><title> Ti </title></head><body>b</body></html>'));
    expect((await fetchUrl('https://a.test/')).title).toBe('Ti');
    mockFetch(() => ok('<body><h1>Head</h1></body>'));
    expect((await fetchUrl('https://a.test/')).title).toBe('Head');
    mockFetch(() => ok('<body><p>x</p></body>'));
    expect((await fetchUrl('https://a.test/z')).title).toBe('https://a.test/z');
  });

  it('AC-007-07: HTML: removes scripts, styles, nav, footer, header, aside and ad/cookie elements', async () => {
    mockFetch(() => ok('<body><header>H</header><nav>N</nav><script>s()</script><style>.a{}</style><div class="ad">AD</div><div id="cookie-banner">C</div><aside>A</aside><p>Keep</p><footer>F</footer></body>'));
    const r = await fetchUrl('https://a.test/');
    expect(r.type).toBe('html');
    expect(r.content).toBe('<p>Keep</p>');
  });

  it('AC-007-08: HTML: prefers <main>, then <article>, then [role=main], else <body>', async () => {
    mockFetch(() => ok('<body><p>out</p><article>art</article><main>mn</main></body>'));
    expect((await fetchUrl('https://a.test/')).content).toBe('mn');
    mockFetch(() => ok('<body><p>out</p><article>art</article></body>'));
    expect((await fetchUrl('https://a.test/')).content).toBe('art');
    mockFetch(() => ok('<body><p>out</p><div role="main">rm</div></body>'));
    expect((await fetchUrl('https://a.test/')).content).toBe('rm');
  });
});
