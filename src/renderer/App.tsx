import React, { useEffect, useCallback, useRef, useState } from 'react';
import { AppStateProvider, useAppState } from './context/AppState';
import { Sidebar } from './components/Sidebar/Sidebar';
import { TabBar } from './components/TabBar/TabBar';
import { EditorPane } from './components/EditorPane/EditorPane';
import { PreviewPane } from './components/PreviewPane/PreviewPane';
import { StatusBar } from './components/StatusBar/StatusBar';
import './App.css';

function getAPI() {
  try { return window.reporaAPI; } catch { return null; }
}

function isMarkdownFile(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return ['.md', '.markdown', '.mdown', '.mdx', '.txt'].some(ext => lower.endsWith(ext));
}

function AppContent() {
  const { state, dispatch, createTab } = useAppState();
  const [dropOver, setDropOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const activeTab = state.tabs.find(t => t.id === state.activeTabId) || null;
  const hasTabs = state.tabs.length > 0;

  const openFileInTab = useCallback(async (filePath: string) => {
    const a = getAPI(); if (!a) return;
    const existing = state.tabs.find(t => t.filePath === filePath);
    if (existing) { dispatch({ type: 'SET_ACTIVE_TAB', tabId: existing.id }); return; }
    const r = await a.openDroppedFile(filePath);
    if (r) dispatch({ type: 'OPEN_FILE', tab: createTab(filePath, r.content) });
  }, [createTab, dispatch, state.tabs]);

  const handleNewTab = useCallback(() => {
    dispatch({ type: 'OPEN_FILE', tab: createTab(null, '') });
  }, [createTab, dispatch]);

  const handleOpenFile = useCallback(async () => {
    const a = getAPI(); if (!a) return;
    const r = await a.openFile();
    if (r) dispatch({ type: 'OPEN_FILE', tab: createTab(r.filePath, r.content) });
  }, [createTab, dispatch]);

  const handleOpenFolder = useCallback(async () => {
    const a = getAPI(); if (!a) return;
    const r = await a.openFolder();
    if (r) {
      dispatch({ type: 'SET_FOLDER', folderPath: r.folderPath });
      const tree = await a.readDirectory(r.folderPath);
      dispatch({ type: 'SET_FILE_TREE', tree });
      await a.startWatching(r.folderPath);
    }
  }, [dispatch]);

  const handleSave = useCallback(async () => {
    if (!activeTab) return;
    const a = getAPI(); if (!a) return;
    const r = await a.saveFile(activeTab.filePath, activeTab.content);
    if (r.success) dispatch({ type: 'MARK_SAVED', tabId: activeTab.id, filePath: r.filePath ?? undefined });
  }, [activeTab, dispatch]);

  const handleSaveAs = useCallback(async () => {
    if (!activeTab) return;
    const a = getAPI(); if (!a) return;
    const r = await a.saveFile(null, activeTab.content);
    if (r.success && r.filePath) dispatch({ type: 'MARK_SAVED', tabId: activeTab.id, filePath: r.filePath });
  }, [activeTab, dispatch]);

  // Stable refs for menu & keyboard shortcuts
  const h = useRef({ handleNewTab, handleOpenFile, handleOpenFolder, handleSave, handleSaveAs, activeTab, stateTabs: state.tabs });
  h.current = { handleNewTab, handleOpenFile, handleOpenFolder, handleSave, handleSaveAs, activeTab, stateTabs: state.tabs };

  // Menu listener — registered once, reads everything from ref
  useEffect(() => {
    const a = getAPI(); if (!a) return;
    return a.onMenuAction((action: string) => {
      switch (action) {
        case 'menu:new': h.current.handleNewTab(); break;
        case 'menu:openFile': h.current.handleOpenFile(); break;
        case 'menu:openFolder': h.current.handleOpenFolder(); break;
        case 'menu:save': h.current.handleSave(); break;
        case 'menu:saveAs': h.current.handleSaveAs(); break;
        case 'menu:closeTab':
          if (h.current.activeTab) dispatch({ type: 'CLOSE_TAB', tabId: h.current.activeTab.id });
          break;
        case 'menu:toggleSidebar': dispatch({ type: 'TOGGLE_SIDEBAR' }); break;
        case 'menu:togglePreview': dispatch({ type: 'TOGGLE_PREVIEW' }); break;
      }
    });
  }, [dispatch]);

  // External file change — registered once, reads tabs from ref
  useEffect(() => {
    const a = getAPI(); if (!a) return;
    return a.onExternalChange(({ filePath, event }) => {
      const tab = h.current.stateTabs.find(t => t.filePath === filePath);
      if (!tab) return;
      if (tab.isDirty) {
        dispatch({ type: 'SET_EXTERNAL_CHANGE', notification: { filePath, tabId: tab.id } });
      } else if (event === 'change') {
        a.readFile(filePath).then(({ content }) => {
          dispatch({ type: 'RELOAD_TAB_CONTENT', tabId: tab.id, content });
        }).catch(() => {});
      }
    });
  }, [dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      switch (e.key.toLowerCase()) {
        case 'b': e.preventDefault(); dispatch({ type: 'TOGGLE_SIDEBAR' }); break;
        case '\\': e.preventDefault(); dispatch({ type: 'TOGGLE_PREVIEW' }); break;
        case 'n': e.preventDefault(); h.current.handleNewTab(); break;
        case 's': if (e.shiftKey) { e.preventDefault(); h.current.handleSaveAs(); } else { e.preventDefault(); h.current.handleSave(); } break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);

  return (
    <div
      ref={dropRef}
      className={`app-shell${state.sidebarVisible ? '' : ' sidebar-hidden'}${dropOver ? ' drop-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer?.types.includes('Files')) setDropOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault(); e.stopPropagation();
        if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) setDropOver(false);
      }}
      onDrop={async (e) => {
        e.preventDefault(); e.stopPropagation(); setDropOver(false);
        for (const file of Array.from(e.dataTransfer?.files || [])) {
          const fp = window.reporaAPI.getPathForFile(file);
          if (fp && isMarkdownFile(fp)) await openFileInTab(fp);
        }
      }}
    >
      {state.sidebarVisible && (
        <>
          <Sidebar tree={state.fileTree} openFolder={state.openFolder} onOpenFolder={handleOpenFolder} onFileClick={openFileInTab} />
          <div className="sidebar-resize-handle" />
        </>
      )}
      <div className="main-area">
        {/* Tab bar — inline style controls visibility without an extra wrapper that breaks layout */}
        <TabBar
          tabs={state.tabs}
          activeTabId={state.activeTabId}
          onSelectTab={(id) => dispatch({ type: 'SET_ACTIVE_TAB', tabId: id })}
          onCloseTab={(id) => dispatch({ type: 'CLOSE_TAB', tabId: id })}
          onNewTab={handleNewTab}
          visible={hasTabs}
        />
        {state.externalChangeNotification && (
          <div className="external-change-bar">
            <span>File changed externally.</span>
            <div>
              <button onClick={async () => {
                const n = state.externalChangeNotification; if (!n) return;
                const a = getAPI();
                if (a) { try { const { content } = await a.readFile(n.filePath); dispatch({ type: 'RELOAD_TAB_CONTENT', tabId: n.tabId, content }); } catch {} }
                dispatch({ type: 'SET_EXTERNAL_CHANGE', notification: null });
              }}>Reload</button>
              <button onClick={() => dispatch({ type: 'SET_EXTERNAL_CHANGE', notification: null })}>Keep mine</button>
            </div>
          </div>
        )}
        <div className={`editor-preview-split${state.previewVisible ? '' : ' preview-hidden'}`}>
          <EditorPane
            tab={activeTab}
            onContentChange={(content) => { if (activeTab) dispatch({ type: 'UPDATE_CONTENT', tabId: activeTab.id, content }); }}
            onCursorChange={(line, col) => { if (activeTab) dispatch({ type: 'UPDATE_CURSOR', tabId: activeTab.id, line, col }); }}
            onSave={handleSave}
          />
          {state.previewVisible && <div className="resize-handle" />}
          {state.previewVisible && <PreviewPane content={activeTab?.content || ''} />}
        </div>
        <StatusBar
          wordCount={activeTab?.content ? activeTab.content.trim().split(/\s+/).filter(Boolean).length : 0}
          cursorLine={activeTab?.cursorLine ?? 1}
          cursorCol={activeTab?.cursorCol ?? 1}
          filePath={activeTab?.filePath}
          isDirty={activeTab?.isDirty ?? false}
        />
        {/* Welcome overlay — covers everything in main-area when no tabs are open */}
        {!hasTabs && (
          <div className="welcome-overlay">
            <div className="welcome-card">
              <h1 className="welcome-logo">Repora</h1>
              <p>A clean Markdown editor for Windows</p>
              <div className="welcome-buttons">
                <button className="welcome-btn primary" onClick={handleNewTab}>New File</button>
                <button className="welcome-btn" onClick={handleOpenFile}>Open File...</button>
                <button className="welcome-btn" onClick={handleOpenFolder}>Open Folder...</button>
              </div>
              <p className="welcome-hint">Or drag &amp; drop a Markdown file here</p>
              <div className="welcome-shortcuts-grid">
                <div><kbd>Ctrl+N</kbd> New</div>
                <div><kbd>Ctrl+O</kbd> Open</div>
                <div><kbd>Ctrl+S</kbd> Save</div>
                <div><kbd>Ctrl+B</kbd> Sidebar</div>
                <div><kbd>Ctrl+\</kbd> Preview</div>
                <div><kbd>Ctrl+Shift+O</kbd> Folder</div>
              </div>
            </div>
          </div>
        )}
      </div>
      {dropOver && (
        <div className="drop-overlay"><div className="drop-message">Drop Markdown file to open</div></div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}
