# Readlighting
Arbeitstitel: readlighting
Progressive Web App die es ermöglicht Textdokument zu öffnen und Texte zu highlighten, um die wichtigsten Informationen herauszudestillieren.

Lebendes Dokument, welches beschreibt was die Web App können soll (Funktionen, Verhalten, Edge Cases)

## 1 Worum geht es?
Eine kostenlose Progressive Webapp die es ermöglicht Webpages, Textdokumente und Markdown Dokumente zu öffnen und darzustellen. Innerhalb dieser App kann man sich die Texte durchlesen, Markierungen in verschiedenen Farben (wie Highlighting mit Textmarker) machen und sich Kommentare zu verschiedenen Textpassagen oder Markierungen machen. Zusätzlich soll es die Möglichkeit geben zu den Texten eigene Gedanken in einer Notiz im Markdown Format festzuhalten.

## 2 Kernfunktionen

### 2.1 Dokumentenverwaltung
- Dokumente können hochgeladen werden (HTML, Markdown, Plaintext)
- Webseiten / Links können über die Anwendung per Fetch-URL heruntergeladen und geladen werden
- Dokumente können umbenannt werden
- Dokumente können gelöscht werden
- Die Dokumente werden in einer Liste dargestellt und zum Öffnen ausgewählt
- Die Dokumentenliste hat eine Suchfunktion zum Filtern nach Titel

### 2.2 Dokumentenanzeige
- Webseiten (HTML) und Markdown Dateien werden in einem lesbaren Format inklusive Formatierungen dargestellt
- Markdown wird serverseitig zu HTML gerendert (via `marked`)
- Plaintext wird in einem lesbaren Format mit erhaltenen Zeilenumbrüchen dargestellt

### 2.3 Highlighting
- Textpassagen können ähnlich wie mit einem Textmarker in fünf Farben markiert werden: Gelb, Grün, Blau, Pink, Orange
- Nach dem Selektieren von Text erscheint ein Farbwähler-Popup
- Markierungen werden persistent gespeichert und beim nächsten Öffnen wiederhergestellt
- Markierungen sind im Text deutlich sichtbar (vivide, solide Farben)
- Funktioniert für alle Dokumenttypen: HTML, Markdown, Plaintext

### 2.4 Kommentare
- Zu Markierungen können Kommentare verfasst werden
- Die Kommentare werden in einer Seitenleiste rechts neben dem Dokument angezeigt
- Klick auf einen Kommentar scrollt zur entsprechenden Markierung im Text
- Kommentare können inline in der Seitenleiste bearbeitet werden
- Die Kommentarsidebar kann ein- und ausgeklappt werden

### 2.5 Notizen
- Pro Dokument können Notizen im Markdown Format geschrieben werden
- Der Notizbereich ist unterhalb des Dokuments ein- und ausklappbar
- Edit- und Preview-Modus umschaltbar

### 2.6 Speicherung
- Alle Daten werden lokal im Browser in IndexedDB gespeichert (kein Backend, kein Server)
- Beim erneuten Öffnen eines Dokuments sind Markierungen, Kommentare und Notizen wiederhergestellt
- Beim Löschen eines Dokuments werden auch alle zugehörigen Highlights gelöscht

### 2.7 Export
- Dokumente können mit ihren Markierungen und Notizen exportiert werden
- Export als Markdown (`.md`): lesbar, mit Emoji-Farbmarkierungen, kompatibel mit Obsidian
- Export als JSON (`.json`): strukturiert, maschinenlesbar
- Der Originalinhalt wird nicht exportiert – nur Markierungen, Kommentare und Notizen

### 2.8 Suche
- Dokumentenliste: Suchfunktion zum Filtern nach Dokumenttitel
- Innerhalb eines Dokuments: Volltextsuche mit `Strg+F`, Navigation mit Pfeiltasten, Trefferanzahl wird angezeigt

### 2.9 Web Clipper (Firefox Extension)
- Eine Firefox Browser Extension ermöglicht das Clippen von Webseiten direkt aus dem Browser
- Funktioniert auch bei login-geschützten Seiten und Paywalls, da die Extension im bereits gerenderten DOM arbeitet
- Installation: `about:debugging` → „Diese Firefox-Version" → „Temporäres Add-on laden" → `extension/manifest.json`
- Die App-URL ist in der Extension konfigurierbar (Standard: `http://localhost:5173`)
- Der geclippe Inhalt wird automatisch in der App geöffnet

## 3 Technische Anforderungen

### 3.1 Stack
- **Framework:** React 18 + TypeScript
- **Build-Tool:** Vite
- **UI / Design System:** SAP UI5 Web Components React (`@ui5/webcomponents-react`) – erfüllt gleichzeitig die Anforderungen SAP Design System, Web Components und React
- **Datenpersistenz:** IndexedDB via `idb` (vollständig clientseitig, kein Backend)
- **Markdown-Rendering:** `marked` (konvertiert Markdown zu HTML für einheitliches Highlighting)
- **PWA:** `vite-plugin-pwa` mit `generateSW`-Strategie, Service Worker für Offline-Nutzung
- **Sprache:** Deutsch als primäre UI-Sprache

### 3.2 Architektur
```
src/
├── types/index.ts           # Document, Highlight, HighlightColor, SearchMatch
├── services/
│   ├── db.ts                # IndexedDB (Stores: documents, highlights mit Index auf documentId)
│   ├── crawler.ts           # URL-Fetch via CORS-Proxy (corsproxy.io, Fallback: allorigins.win)
│   ├── highlighter.ts       # Zeichenoffset-basiertes Highlight-Rendering (DOM-Walker)
│   └── exporter.ts          # Export als Markdown und JSON
├── hooks/
│   ├── useDocuments.ts      # CRUD für Dokumente
│   └── useHighlights.ts     # CRUD für Highlights, gefiltert nach documentId
├── components/
│   ├── AppShell.tsx         # ShellBar mit Dark-Mode-Toggle
│   ├── DocumentList.tsx     # Linke Sidebar: Liste, Suche, Upload, URL-Fetch, Umbenennen
│   ├── DocumentViewer.tsx   # Mitte: Dokumentdarstellung + Strg+F-Suche
│   ├── HighlightLayer.tsx   # Selektion → Farbwähler-Popup → Highlight erstellen
│   ├── CommentPanel.tsx     # Rechte Sidebar: Highlights mit Kommentaren
│   └── NotesEditor.tsx      # Markdown-Notizeditor mit Edit/Preview
├── App.tsx                  # Layout, State-Management, Export-Dialog, Clip-Import
└── main.tsx
extension/                   # Firefox Browser Extension (Web Clipper)
├── manifest.json
├── content.js
├── popup.html
├── popup.js
└── icon.svg
```

### 3.3 Datenmodell

**Document:**
```typescript
{
  id: string;           // UUID
  title: string;        // Dokumenttitel (umbenennbar)
  type: 'html' | 'text' | 'markdown';
  content: string;      // Rohinhalt
  url?: string;         // Ursprungs-URL (wenn per Fetch geladen)
  notes: string;        // Markdown-Notizen
  createdAt: Date;
  updatedAt: Date;
}
```

**Highlight:**
```typescript
{
  id: string;           // UUID
  documentId: string;   // Referenz auf Document
  startOffset: number;  // Zeichenposition im Plaintext
  endOffset: number;
  text: string;         // Markierter Text (Kopie)
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'orange';
  comment?: string;     // Optionaler Kommentar
  createdAt: Date;
}
```

### 3.4 Highlight-Mechanismus
- Selektion im Browser → `window.getSelection()` → Zeichenoffsets im Container-Element berechnen
- Offsets werden in IndexedDB gespeichert
- Bei jedem Render: DOM-Walker traversiert alle Textknoten und injiziert `<mark>`-Tags an den gespeicherten Positionen
- Für Markdown: erst Konvertierung zu HTML via `marked`, dann gleicher Mechanismus wie HTML

### 3.5 Design & UX
- Responsives, modernes Design via SAP Fiori Themes (`sap_horizon` / `sap_horizon_dark`)
- Dark Mode: automatische Erkennung via `prefers-color-scheme`, manuell umschaltbar im ShellBar
- Drei-Spalten-Layout: Dokumentenliste (links) · Dokumentanzeige (Mitte) · Kommentare (rechts, einklappbar)
- Notizbereich unterhalb des Dokuments (einklappbar)
- Highlight-Farben: vivide Pastelltöne mit `!important` um UI5-Reset-Styles zu überschreiben

### 3.6 CORS & Fetch
- Freie Webseiten: Fetch via `corsproxy.io` (primär) mit Fallback auf `api.allorigins.win`
- Login-geschützte Seiten / Paywalls: Firefox Extension (Web Clipper) notwendig
- Timeout: 15 Sekunden pro Proxy-Versuch

### 3.7 PWA
- Service Worker mit Precaching aller Assets
- Installierbar als Desktop/Mobile App
- Offline-Nutzung möglich (bereits geladene Dokumente)
