const PROXIES = [
  {
    buildUrl: (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    extractContent: async (res: Response) => res.text(),
  },
  {
    buildUrl: (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    extractContent: async (res: Response) => {
      const json = await res.json() as { contents: string };
      return json.contents;
    },
  },
];

export interface FetchResult {
  title: string;
  content: string;
  type: 'html' | 'text' | 'markdown';
}

export async function fetchUrl(url: string): Promise<FetchResult> {
  let rawContent: string | null = null;
  let lastError: Error | null = null;

  for (const proxy of PROXIES) {
    try {
      const proxyUrl = proxy.buildUrl(url);
      const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(15_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      rawContent = await proxy.extractContent(response);
      break;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  if (rawContent === null) {
    throw new Error(`Artikel konnte nicht geladen werden: ${lastError?.message ?? 'Unbekannter Fehler'}`);
  }

  const lowerUrl = url.toLowerCase();
  if (lowerUrl.endsWith('.md') || lowerUrl.endsWith('.markdown')) {
    return {
      title: url.split('/').pop() ?? url,
      content: rawContent,
      type: 'markdown',
    };
  }

  if (lowerUrl.endsWith('.txt')) {
    return {
      title: url.split('/').pop() ?? url,
      content: rawContent,
      type: 'text',
    };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawContent, 'text/html');

  const title =
    doc.querySelector('title')?.textContent?.trim() ||
    doc.querySelector('h1')?.textContent?.trim() ||
    url;

  const elementsToRemove = doc.querySelectorAll(
    'script, style, noscript, nav, footer, header, aside, [role="banner"], [role="navigation"], [role="complementary"], .cookie-banner, #cookie-banner, .ad, .advertisement'
  );
  elementsToRemove.forEach((el) => el.remove());

  const mainContent =
    doc.querySelector('main') ||
    doc.querySelector('article') ||
    doc.querySelector('[role="main"]') ||
    doc.body;

  const content = mainContent?.innerHTML ?? rawContent;

  return { title, content, type: 'html' };
}
