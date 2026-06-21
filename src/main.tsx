import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import '@ui5/webcomponents-theming/dist/generated/json-imports/Themes.js';
import '@ui5/webcomponents/dist/generated/json-imports/Themes.js';
import '@ui5/webcomponents-fiori/dist/generated/json-imports/Themes.js';
import './index.css';
import App from './App.tsx';

// Service-Worker nur im echten Web registrieren. In der Capacitor-WebView
// (Android/Electron) liegen die Assets ohnehin lokal — ein SW bringt dort keinen
// Vorteil, würde aber ein altes Bundle cachen und ein Update nur per Neu-
// Installation (= Datenverlust) erlauben. Dort melden wir einen evtl. noch aus
// früheren Builds aktiven SW aktiv ab und löschen seine Caches.
if (Capacitor.getPlatform() === 'web') {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
  if (window.caches) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
