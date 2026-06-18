import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@ui5/webcomponents-theming/dist/generated/json-imports/Themes.js';
import '@ui5/webcomponents/dist/generated/json-imports/Themes.js';
import '@ui5/webcomponents-fiori/dist/generated/json-imports/Themes.js';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
