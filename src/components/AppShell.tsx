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

  // ShellBarItems that get grouped into the "..." overflow menu (when the
  // ShellBar runs out of horizontal space) stop firing their `onClick` prop:
  // UI5's overflow popover renders them as a ListItemStandard whose own
  // "click" event is dispatched with composed:false and has the native click
  // stopped via stopPropagation() first, so it never reaches the
  // ShellBarItem host the React onClick listener is attached to. Only the
  // non-overflow Button rendering explicitly relays the click to the host.
  // Workaround: tag each item with data-action and resolve clicks via a
  // single document-level capture-phase listener, which sees every click
  // (including ones later stopped deeper in the tree) before it can be
  // stopped, regardless of overflow state.
  const actionHandlersRef = useRef<Record<string, () => void>>({});
  useEffect(() => {
    actionHandlersRef.current = {
      'toggle-sidebar': onToggleSidebar,
      'backup-export': () => onBackupExport?.(),
      'backup-import': () => importInputRef.current?.click(),
      'toggle-dark-mode': () => setIsDark((d) => !d),
    };
  }, [onToggleSidebar, onBackupExport, onBackupImport]);

  useEffect(() => {
    function handleShellBarAction(e: MouseEvent) {
      // Non-overflow items relay their click via an extra synthetic "click"
      // CustomEvent dispatched on the same host (see comment above), which
      // would otherwise reach this same listener a second time and
      // double-fire the action (e.g. toggling dark mode back off again
      // immediately). Synthetic/scripted dispatches are always untrusted,
      // so only react to the one genuine user-initiated click.
      if (!e.isTrusted) return;
      const target = e.composedPath().find(
        (el): el is Element => el instanceof Element && el.hasAttribute('data-shellbar-action')
      );
      const action = target?.getAttribute('data-shellbar-action');
      if (action) {
        actionHandlersRef.current[action]?.();
      }
    }
    document.addEventListener('click', handleShellBarAction, true);
    return () => document.removeEventListener('click', handleShellBarAction, true);
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
          data-shellbar-action="toggle-sidebar"
        />
        {onBackupExport && (
          <ShellBarItem
            icon="download"
            text="Datenbank-Backup exportieren"
            data-shellbar-action="backup-export"
          />
        )}
        {onBackupImport && (
          <ShellBarItem
            icon="upload"
            text="Datenbank-Backup importieren"
            data-shellbar-action="backup-import"
          />
        )}
        <ShellBarItem
          icon={isDark ? 'light-mode' : 'dark-mode'}
          text={isDark ? 'Light Mode' : 'Dark Mode'}
          data-shellbar-action="toggle-dark-mode"
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
