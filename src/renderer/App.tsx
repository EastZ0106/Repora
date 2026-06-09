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
  const { state, dispatch, createTab, ts } = useAppState();
  const [dropOver, setDropOver] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const autoSaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const activeTab = state.tabs.find(t => t.id === state.activeTabId) || null;
  const hasTabs = state.tabs.length > 0;

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    const a = getAPI();
    if (a) a.setTheme(state.theme);
  }, [state.theme]);

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

  const handleSave = useCallback(async (tabToSave?: { id: string; filePath: string | null; content: string }) => {
    const t = tabToSave || activeTab;
    if (!t) return false;
    const a = getAPI(); if (!a) return false;
    const r = await a.saveFile(t.filePath, t.content);
    if (r.success) {
      dispatch({ type: 'MARK_SAVED', tabId: t.id, filePath: r.filePath ?? undefined });
      return true;
    }
    return false;
  }, [activeTab, dispatch]);

  const handleSaveAs = useCallback(async () => {
    if (!activeTab) return;
    const a = getAPI(); if (!a) return;
    const r = await a.saveFile(null, activeTab.content);
    if (r.success && r.filePath) dispatch({ type: 'MARK_SAVED', tabId: activeTab.id, filePath: r.filePath });
  }, [activeTab, dispatch]);

  const handleCloseTab = useCallback(async (tabId: string) => {
    const tab = state.tabs.find(t => t.id === tabId);
    if (tab?.isDirty) {
      const a = getAPI();
      if (a) {
        const saved = await handleSave({ id: tab.id, filePath: tab.filePath, content: tab.content });
        if (!saved) {
          const choice = await a.confirmClose(tab.title);
          if (choice === 'cancel') return;
        }
      }
    }
    dispatch({ type: 'CLOSE_TAB', tabId });
  }, [state.tabs, dispatch, handleSave]);

  // Auto-save: debounce 2s after content change
  useEffect(() => {
    const a = getAPI();
    if (!activeTab || !activeTab.filePath || !state.autoSaveEnabled || !a) return;

    const key = activeTab.id;
    const existing = autoSaveTimers.current.get(key);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      const saved = await handleSave({
        id: activeTab.id,
        filePath: activeTab.filePath,
        content: activeTab.content,
      });
      if (saved) {
        setAutoSaveStatus(ts('statusBar.autoSaved'));
        setTimeout(() => setAutoSaveStatus(null), 2000);
      }
    }, 2000);

    autoSaveTimers.current.set(key, timer);
    return () => {
      clearTimeout(timer);
      autoSaveTimers.current.delete(key);
    };
  }, [activeTab?.id, activeTab?.content, activeTab?.filePath, state.autoSaveEnabled]);

  // Stable refs for menu & keyboard shortcuts
  const h = useRef({ handleNewTab, handleOpenFile, handleOpenFolder, handleSave, handleSaveAs, activeTab, stateTabs: state.tabs, handleCloseTab, state });
  h.current = { handleNewTab, handleOpenFile, handleOpenFolder, handleSave, handleSaveAs, activeTab, stateTabs: state.tabs, handleCloseTab, state };

  // Menu listener — registered once, reads everything from ref
  useEffect(() => {
    const a = getAPI(); if (!a) return;
    return a.onMenuAction((action: string, payload?: string) => {
      switch (action) {
        case 'menu:new': h.current.handleNewTab(); break;
        case 'menu:openFile': h.current.handleOpenFile(); break;
        case 'menu:openFolder': h.current.handleOpenFolder(); break;
        case 'menu:save': h.current.handleSave(); break;
        case 'menu:saveAs': h.current.handleSaveAs(); break;
        case 'menu:closeTab':
          if (h.current.activeTab) h.current.handleCloseTab(h.current.activeTab.id);
          break;
        case 'menu:toggleSidebar': dispatch({ type: 'TOGGLE_SIDEBAR' }); break;
        case 'menu:togglePreview': dispatch({ type: 'TOGGLE_PREVIEW' }); break;
        case 'menu:setLocale':
          if (payload) dispatch({ type: 'SET_LOCALE', locale: payload as any });
          break;
        case 'menu:toggleDarkMode': {
          const next = h.current.state.theme === 'dark' ? 'light' : 'dark';
          dispatch({ type: 'SET_THEME', theme: next });
          break;
        }
        case 'menu:toggleAutoSave':
          dispatch({ type: 'SET_AUTO_SAVE', enabled: !h.current.state.autoSaveEnabled });
          break;
      }
    });
  }, [dispatch]);

  // Enhanced menu action listener to handle locale payload
  useEffect(() => {
    const handler = (_event: any, action: string, locale?: string) => {
      if (action === 'menu:setLocale' && locale) {
        dispatch({ type: 'SET_LOCALE', locale });
      }
    };
    // The menu:setLocale uses webContents.send with extra arg — need to handle in preload
    return () => {};
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
        case 'w': e.preventDefault(); if (h.current.activeTab) h.current.handleCloseTab(h.current.activeTab.id); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);

  // Window close handler (unsaved changes check)
  useEffect(() => {
    const a = getAPI(); if (!a) return;
    return a.onBeforeClose(async () => {
      const dirtyTabs = h.current.state.tabs.filter(t => t.isDirty);
      if (dirtyTabs.length === 0) {
        a.confirmCloseResponse('close');
        return;
      }
      // Try saving all dirty tabs
      for (const tab of dirtyTabs) {
        if (tab.filePath) {
          await h.current.handleSave({ id: tab.id, filePath: tab.filePath, content: tab.content });
        } else {
          // Untitled dirty tab — use confirmClose dialog
          const choice = await a.confirmClose(tab.title);
          if (choice === 'save') {
            const saved = await h.current.handleSave({ id: tab.id, filePath: tab.filePath, content: tab.content });
            if (!saved) { a.confirmCloseResponse('saveAndClose'); return; }
          } else if (choice === 'discard') {
            // proceed
          } else {
            a.confirmCloseResponse('saveAndClose'); // cancel — don't close
            return;
          }
        }
      }
      a.confirmCloseResponse('close');
    });
  }, []);

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
          <Sidebar tree={state.fileTree} openFolder={state.openFolder} onOpenFolder={handleOpenFolder} onFileClick={openFileInTab} ts={ts} />
          <div className="sidebar-resize-handle" />
        </>
      )}
      <div className="main-area">
        <TabBar
          tabs={state.tabs}
          activeTabId={state.activeTabId}
          onSelectTab={(id) => dispatch({ type: 'SET_ACTIVE_TAB', tabId: id })}
          onCloseTab={handleCloseTab}
          onNewTab={handleNewTab}
          visible={hasTabs}
        />
        {state.externalChangeNotification && (
          <div className="external-change-bar">
            <span>{ts('externalChange.title')}</span>
            <div>
              <button onClick={async () => {
                const n = state.externalChangeNotification; if (!n) return;
                const a = getAPI();
                if (a) { try { const { content } = await a.readFile(n.filePath); dispatch({ type: 'RELOAD_TAB_CONTENT', tabId: n.tabId, content }); } catch {} }
                dispatch({ type: 'SET_EXTERNAL_CHANGE', notification: null });
              }}>{ts('externalChange.reload')}</button>
              <button onClick={() => dispatch({ type: 'SET_EXTERNAL_CHANGE', notification: null })}>{ts('externalChange.keepMine')}</button>
            </div>
          </div>
        )}
        <div className={`editor-preview-split${state.previewVisible ? '' : ' preview-hidden'}`}>
          <EditorPane
            tab={activeTab}
            onContentChange={(content) => { if (activeTab) dispatch({ type: 'UPDATE_CONTENT', tabId: activeTab.id, content }); }}
            onCursorChange={(line, col) => { if (activeTab) dispatch({ type: 'UPDATE_CURSOR', tabId: activeTab.id, line, col }); }}
            onSave={() => handleSave()}
            placeholder={ts('editor.placeholder')}
          />
          {state.previewVisible && <div className="resize-handle" />}
          {state.previewVisible && <PreviewPane content={activeTab?.content || ''} emptyText={ts('preview.empty')} emptyHint={ts('preview.hint')} />}
        </div>
        <StatusBar
          wordCount={activeTab?.content ? activeTab.content.trim().split(/\s+/).filter(Boolean).length : 0}
          cursorLine={activeTab?.cursorLine ?? 1}
          cursorCol={activeTab?.cursorCol ?? 1}
          filePath={activeTab?.filePath}
          isDirty={activeTab?.isDirty ?? false}
          autoSaveEnabled={state.autoSaveEnabled}
          autoSaveStatus={autoSaveStatus}
          ts={ts}
        />
        {!hasTabs && (
          <div className="welcome-overlay">
            <div className="welcome-card">
              <h1 className="welcome-logo">{ts('app.title')}</h1>
              <p>{ts('welcome.subtitle')}</p>
              <div className="welcome-buttons">
                <button className="welcome-btn primary" onClick={handleNewTab}>{ts('welcome.newFile')}</button>
                <button className="welcome-btn" onClick={handleOpenFile}>{ts('welcome.openFile')}</button>
                <button className="welcome-btn" onClick={handleOpenFolder}>{ts('welcome.openFolder')}</button>
              </div>
              <p className="welcome-hint">{ts('welcome.dragHint')}</p>
              <div className="welcome-shortcuts-grid">
                <div><kbd>Ctrl+N</kbd> {ts('shortcuts.new')}</div>
                <div><kbd>Ctrl+O</kbd> {ts('shortcuts.open')}</div>
                <div><kbd>Ctrl+S</kbd> {ts('shortcuts.save')}</div>
                <div><kbd>Ctrl+B</kbd> {ts('shortcuts.sidebar')}</div>
                <div><kbd>Ctrl+\\</kbd> {ts('shortcuts.preview')}</div>
                <div><kbd>Ctrl+Shift+O</kbd> {ts('shortcuts.folder')}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      {dropOver && (
        <div className="drop-overlay"><div className="drop-message">{ts('drop.message')}</div></div>
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
