browser.runtime.onMessage.addListener((message) => {
  if (message.action !== 'clip') return;

  const selectors = [
    'main', 'article', '[role="main"]',
    '#main', '#content', '#article',
    '.content', '.article', '.article-body',
    '.post-content', '.entry-content', '.reader-content'
  ];

  let container = null;
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim().length > 200) {
      container = el;
      break;
    }
  }
  if (!container) container = document.body;

  const clone = container.cloneNode(true);
  clone.querySelectorAll(
    'script, style, noscript, nav, footer, header, aside, iframe, [class*="cookie"], [class*="banner"], [class*="popup"], [class*="ad-"], [id*="cookie"], [id*="banner"]'
  ).forEach((el) => el.remove());

  return Promise.resolve({
    title: document.title,
    url: location.href,
    content: clone.innerHTML,
  });
});
