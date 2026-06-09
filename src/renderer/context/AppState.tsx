import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { AppState, AppAction, Tab, Locale, Theme } from '../types';
import { t } from '../i18n';

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`repora.${key}`);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

function storeValue(key: string, value: unknown): void {
  try {
    localStorage.setItem(`repora.${key}`, JSON.stringify(value));
  } catch { /* ignore */ }
}

const initialState: AppState = {
  openFolder: null,
  fileTree: [],
  tabs: [],
  activeTabId: null,
  sidebarVisible: true,
  previewVisible: true,
  wordCount: 0,
  locale: loadStored<Locale>('locale', 'zh-CN'),
  theme: loadStored<Theme>('theme', 'light'),
  autoSaveEnabled: loadStored<boolean>('autoSave', true),
  externalChangeNotification: null
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_FOLDER':
      return { ...state, openFolder: action.folderPath };

    case 'CLOSE_FOLDER':
      return { ...state, openFolder: null, fileTree: [] };

    case 'SET_FILE_TREE':
      return { ...state, fileTree: action.tree };

    case 'OPEN_FILE': {
      if (action.tab.filePath !== null) {
        const existing = state.tabs.find(t => t.filePath === action.tab.filePath);
        if (existing) {
          return { ...state, activeTabId: existing.id };
        }
      }
      return {
        ...state,
        tabs: [...state.tabs, action.tab],
        activeTabId: action.tab.id
      };
    }

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTabId: action.tabId };

    case 'CLOSE_TAB': {
      const idx = state.tabs.findIndex(t => t.id === action.tabId);
      const newTabs = state.tabs.filter(t => t.id !== action.tabId);
      let newActive = state.activeTabId;
      if (state.activeTabId === action.tabId) {
        if (newTabs.length === 0) {
          newActive = null;
        } else {
          const newIdx = Math.min(idx, newTabs.length - 1);
          newActive = newTabs[newIdx].id;
        }
      }
      return { ...state, tabs: newTabs, activeTabId: newActive };
    }

    case 'UPDATE_CONTENT':
      return {
        ...state,
        tabs: state.tabs.map(t =>
          t.id === action.tabId
            ? { ...t, content: action.content, isDirty: action.content !== t.savedContent }
            : t
        )
      };

    case 'MARK_SAVED': {
      const savedContent = state.tabs.find(t => t.id === action.tabId)?.content || '';
      return {
        ...state,
        tabs: state.tabs.map(t =>
          t.id === action.tabId
            ? { ...t, filePath: action.filePath ?? t.filePath, savedContent, isDirty: false, title: action.filePath ? action.filePath.split(/[/\\]/).pop() || t.title : t.title }
            : t
        )
      };
    }

    case 'UPDATE_CURSOR':
      return {
        ...state,
        tabs: state.tabs.map(t =>
          t.id === action.tabId
            ? { ...t, cursorLine: action.line, cursorCol: action.col }
            : t
        )
      };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarVisible: !state.sidebarVisible };

    case 'TOGGLE_PREVIEW':
      return { ...state, previewVisible: !state.previewVisible };

    case 'SET_LOCALE': {
      storeValue('locale', action.locale);
      return { ...state, locale: action.locale };
    }

    case 'SET_THEME': {
      storeValue('theme', action.theme);
      return { ...state, theme: action.theme };
    }

    case 'SET_AUTO_SAVE': {
      storeValue('autoSave', action.enabled);
      return { ...state, autoSaveEnabled: action.enabled };
    }

    case 'SET_EXTERNAL_CHANGE':
      return { ...state, externalChangeNotification: action.notification };

    case 'RELOAD_TAB_CONTENT':
      return {
        ...state,
        tabs: state.tabs.map(t =>
          t.id === action.tabId
            ? { ...t, content: action.content, savedContent: action.content, isDirty: false }
            : t
        )
      };

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  createTab: (filePath?: string | null, content?: string) => Tab;
  ts: (path: string) => string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const ts = useCallback((path: string) => t(state.locale, path), [state.locale]);

  const createTab = useCallback((filePath: string | null = null, content: string = ''): Tab => {
    const title = filePath
      ? filePath.split(/[/\\]/).pop() || t(state.locale, 'welcome.newFile')
      : `Untitled-${state.tabs.filter(t => !t.filePath).length + 1}`;
    return {
      id: generateId(),
      filePath,
      title,
      content,
      savedContent: content,
      isDirty: false,
      cursorLine: 1,
      cursorCol: 1
    };
  }, [state.tabs.length, state.locale]);

  return (
    <AppContext.Provider value={{ state, dispatch, createTab, ts }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
