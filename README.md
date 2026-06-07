# Repora

A clean, intuitive Markdown editor for Windows — built with Electron, React, and TypeScript.

<p align="center">
  <img src="resources/icon.svg" alt="Repora" width="128" />
</p>

## Features

- **Split-pane editing** — write Markdown on the left, see live preview on the right
- **Multi-tab support** — open multiple files, switch between them with tabs
- **File tree sidebar** — browse folders and open files with one click
- **GFM support** — tables, task lists, strikethrough, and link auto-detection
- **Code syntax highlighting** — fenced code blocks with language detection
- **LaTeX math** — inline and block math formulas via KaTeX
- **File watching** — auto-detects external file changes (chokidar)
- **Keyboard shortcuts** — Ctrl+N/O/S/B/\\ and more
- **Drag & drop** — drag `.md` files into the window to open them
- **Application menu** — full File / Edit / View / Help menu bar
- **GitHub-inspired theme** — warm beige/cream color palette, clean typography

## Screenshot

```
┌──────────────┬────────────────────────────────────────┐
│ Sidebar      │ Tab Bar                                 │
│ (file tree)  ├──────────────┬──┬───────────────────────┤
│              │ Editor       │ │  Preview              │
│ 📁 docs/     │              │ │                        │
│  📄 readme.md│ # Hello      │ │  <h1>Hello</h1>        │
│  📄 api.md   │              │ │                        │
│              │              │ │                        │
│              ├──────────────┴──┴───────────────────────┤
│              │ Status Bar: Ln 1, Col 1 · Saved · .md   │
└──────────────┴─────────────────────────────────────────┘
```

## Download

### Portable version (recommended)

Download `Repora-Portable-0.1.0.exe` — no installation required, just double-click to run.

### Installer version

Download `Repora Setup 0.1.0.exe` — installs to your Programs folder with Start Menu and Desktop shortcuts.

> **Current version**: 0.1.0 (MVP)

## Usage

### Quick start

1. Launch Repora
2. Click **New File** to start a blank document, or **Open File...** to open an existing `.md` file
3. Type Markdown in the left pane — the right pane renders in real time
4. Press **Ctrl+S** to save

### Opening a folder

Click **Open Folder...** to browse a directory. The file tree sidebar shows all Markdown files, and Repora watches for external changes.

### Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+N | New tab |
| Ctrl+O | Open file |
| Ctrl+Shift+O | Open folder |
| Ctrl+S | Save |
| Ctrl+Shift+S | Save As |
| Ctrl+W | Close tab |
| Ctrl+B | Toggle sidebar |
| Ctrl+\\ | Toggle preview |

### Drag & drop

Drag one or more `.md` / `.markdown` / `.txt` files from File Explorer into the Repora window to open them.

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
git clone <repo-url>
cd repora
npm install
```

### Run in development mode

```bash
npm run dev
```

### Build for production

```bash
# Build the JavaScript bundle only
npm run build

# Package for Windows (output in dist/)
npm run package
```

### Project structure

```
src/
├── main/                    # Electron main process
│   ├── index.ts             # Window creation, app lifecycle
│   ├── ipc-handlers.ts      # IPC handler registration
│   ├── file-system.ts       # File/directory read/write
│   ├── file-watcher.ts      # chokidar file watching
│   └── menu.ts              # Application menu template
├── preload/
│   └── index.ts             # contextBridge API surface
└── renderer/                # React renderer process
    ├── main.tsx             # React entry point
    ├── App.tsx              # Root layout + state orchestration
    ├── App.css              # Layout and welcome styles
    ├── context/
    │   └── AppState.tsx     # Global state (tabs, dirty, etc.)
    ├── components/
    │   ├── Sidebar/         # File tree sidebar
    │   ├── TabBar/          # Multi-tab bar
    │   ├── EditorPane/      # Markdown source editor
    │   ├── PreviewPane/     # Rendered Markdown preview
    │   └── StatusBar/       # Bottom status bar
    ├── styles/
    │   └── global.css       # CSS variables, reset
    └── types/
        └── index.ts         # Shared TypeScript types
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| App framework | Electron 39 |
| Build tooling | electron-vite 3 + Vite 6 |
| UI framework | React 18 |
| Language | TypeScript 5 |
| Markdown parser | markdown-it 14 |
| Math rendering | KaTeX 0.16 |
| Code highlighting | highlight.js 11 |
| File watching | chokidar 4 |
| Packaging | electron-builder 25 |

## License

Copyright (c) 2026 — MIT
