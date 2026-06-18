import { type ReactNode, type ReactElement, useEffect, useState, useRef } from 'react';
import { setTheme } from '@ui5/webcomponents-base/dist/config/Theme.js';
import {
  ShellBar,
  ShellBarItem,
  Icon,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/color-fill.js';
import '@ui5/webcomponents-icons/dist/dark-mode.js';
import '@ui5/webcomponents-icons/dist/light-mode.js';
import '@ui5/webcomponents-icons/dist/download.js';
import '@ui5/webcomponents-icons/dist/upload.js';
import '@ui5/webcomponents-icons/dist/menu2.js';

interface AppShellProps {
  children: ReactNode;
  documentTitle?: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onBackupExport?: () => void;
  onBackupImport?: (file: File) => void;
}

export function AppShell({
  children,
  documentTitle,
  sidebarOpen,
  onToggleSidebar,
  onBackupExport,
  onBackupImport,
}: AppShellProps): ReactElement {
  const [isDark, setIsDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTheme(isDark ? 'sap_horizon_dark' : 'sap_horizon');
  }, [isDark]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className="app-shell">
      <ShellBar
        primaryTitle="Readlighting"
        secondaryTitle={documentTitle ?? ''}
        logo={<Icon name="color-fill" style={{ color: '#0070f2' }} />}
      >
        <ShellBarItem
          icon="menu2"
          text={sidebarOpen ? 'Dateiliste ausblenden' : 'Dateiliste einblenden'}
          onClick={onToggleSidebar}
        />
        {onBackupExport && (
          <ShellBarItem icon="download" text="Datenbank-Backup exportieren" onClick={onBackupExport} />
        )}
        {onBackupImport && (
          <ShellBarItem
            icon="upload"
            text="Datenbank-Backup importieren"
            onClick={() => importInputRef.current?.click()}
          />
        )}
        <ShellBarItem
          icon={isDark ? 'light-mode' : 'dark-mode'}
          text={isDark ? 'Light Mode' : 'Dark Mode'}
          onClick={() => setIsDark((d) => !d)}
        />
      </ShellBar>
      {onBackupImport && (
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onBackupImport(file);
            e.target.value = '';
          }}
        />
      )}
      <div className="app-content">{children}</div>
    </div>
  );
}
