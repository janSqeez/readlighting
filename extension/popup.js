const DEFAULT_APP_URL = 'http://localhost:5173';

const clipBtn = document.getElementById('clip-btn');
const status = document.getElementById('status');
const appUrlInput = document.getElementById('app-url');
const saveUrlBtn = document.getElementById('save-url');

// Load saved app URL
browser.storage.local.get('appUrl').then(({ appUrl }) => {
  appUrlInput.value = appUrl || DEFAULT_APP_URL;
});

saveUrlBtn.addEventListener('click', () => {
  browser.storage.local.set({ appUrl: appUrlInput.value.trim() });
  status.textContent = 'URL gespeichert.';
  status.className = 'success';
  setTimeout(() => { status.textContent = ''; status.className = ''; }, 2000);
});

clipBtn.addEventListener('click', async () => {
  clipBtn.disabled = true;
  status.textContent = 'Seite wird gelesen...';
  status.className = '';

  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    let result;
    try {
      result = await browser.tabs.sendMessage(tab.id, { action: 'clip' });
    } catch {
      // Content script not yet injected (e.g. browser internal page) – inject manually
      await browser.tabs.executeScript(tab.id, { file: 'content.js' });
      result = await browser.tabs.sendMessage(tab.id, { action: 'clip' });
    }

    const { appUrl } = await browser.storage.local.get('appUrl');
    const base = (appUrl || DEFAULT_APP_URL).replace(/\/$/, '');
    const encoded = encodeURIComponent(JSON.stringify(result));

    // Try to find an existing Readlighting tab
    const tabs = await browser.tabs.query({ url: base + '/*' });
    if (tabs.length > 0) {
      await browser.tabs.update(tabs[0].id, { url: `${base}/#clip=${encoded}`, active: true });
      await browser.windows.update(tabs[0].windowId, { focused: true });
    } else {
      await browser.tabs.create({ url: `${base}/#clip=${encoded}` });
    }

    status.textContent = '✓ Artikel wurde geclippt!';
    status.className = 'success';
    setTimeout(() => window.close(), 1000);
  } catch (err) {
    status.textContent = 'Fehler: ' + err.message;
    status.className = 'error';
    clipBtn.disabled = false;
  }
});
