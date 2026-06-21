import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Speichert oder teilt eine Textdatei plattformübergreifend.
 *
 * Auf Android schlägt das Browser-Pattern `<a download>` in der Capacitor-WebView
 * still fehl (kein Download, kein Fehler). Stattdessen schreiben wir die Datei in
 * den App-Cache (über den vorhandenen FileProvider erreichbar) und reichen sie an
 * das native Teilen-Menü weiter – dort kann der Nutzer z. B. "In Dateien speichern"
 * wählen oder direkt an Nextcloud/E-Mail teilen.
 *
 * Auf Web und Electron bleibt es beim klassischen Blob-Download.
 */
export async function saveOrShareTextFile(
  content: string,
  filename: string,
  mimeType: string,
): Promise<void> {
  if (Capacitor.getPlatform() === 'android') {
    const { uri } = await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    try {
      await Share.share({
        title: filename,
        url: uri,
        dialogTitle: 'Exportieren / Teilen',
      });
    } catch (e) {
      // Bricht der Nutzer das Teilen-Menü ab, wirft das Plugin einen Fehler –
      // das ist kein echter Fehlschlag, daher schlucken.
      if (!/cancel/i.test(String(e))) throw e;
    }
    return;
  }

  // Web / Electron: klassischer Blob-Download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
