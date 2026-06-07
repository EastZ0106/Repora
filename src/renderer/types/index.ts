export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
  isDirectory: boolean;
}

export interface Tab {
  id: string;
  filePath: string | null;
  title: string;
  content: string;
  savedContent: string;
  isDirty: boolean;
}

export interface AppState {
  openFolder: string | null;
  fileTree: TreeNode[];
  tabs: Tab[];
  activeTabId: string | null;
  sidebarVisible: boolean;
  previewVisible: boolean;
  wordCount: number;
  cursorLine: number;
  cursorCol: number;
  externalChangeNotification: { filePath: string; tabId: string } | null;
}

export type AppAction =
  | { type: 'SET_FOLDER'; folderPath: string }
  | { type: 'CLOSE_FOLDER' }
  | { type: 'SET_FILE_TREE'; tree: TreeNode[] }
  | { type: 'OPEN_FILE'; tab: Tab }
  | { type: 'SET_ACTIVE_TAB'; tabId: string }
  | { type: 'CLOSE_TAB'; tabId: string }
  | { type: 'UPDATE_CONTENT'; tabId: string; content: string }
  | { type: 'MARK_SAVED'; tabId: string; filePath?: string }
  | { type: 'UPDATE_CURSOR'; tabId: string; line: number; col: number }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_PREVIEW' }
  | { type: 'SET_EXTERNAL_CHANGE'; notification: { filePath: string; tabId: string } | null }
  | { type: 'RELOAD_TAB_CONTENT'; tabId: string; content: string };

export interface ReporaAPI {
  openFile(): Promise<{ filePath: string; content: string } | null>;
  saveFile(filePath: string | null, content: string): Promise<{ success: boolean; filePath: string | null }>;
  openFolder(): Promise<{ folderPath: string } | null>;
  readFile(filePath: string): Promise<{ content: string }>;
  writeFile(filePath: string, content: string): Promise<{ success: boolean }>;
  readDirectory(dirPath: string): Promise<TreeNode[]>;
  startWatching(dirPath: string): Promise<void>;
  stopWatching(): Promise<void>;
  openDroppedFile(filePath: string): Promise<{ content: string } | null>;
  getPathForFile(file: File): string;
  onExternalChange(callback: (event: { filePath: string; event: string }) => void): () => void;
  onMenuAction(callback: (action: string) => void): () => void;
}

declare global {
  interface Window {
    reporaAPI: ReporaAPI;
  }
}
