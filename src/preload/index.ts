import { contextBridge, ipcRenderer, webUtils } from 'electron';

const api = {
  openFile: () => ipcRenderer.invoke('dialog:openFile') as Promise<{ filePath: string; content: string } | null>,
  saveFile: (filePath: string | null, content: string) =>
    ipcRenderer.invoke('dialog:saveFile', filePath, content) as Promise<{ success: boolean; filePath: string | null }>,
  openFolder: () => ipcRenderer.invoke('dialog:openFolder') as Promise<{ folderPath: string } | null>,
  readFile: (filePath: string) =>
    ipcRenderer.invoke('file:readFile', filePath) as Promise<{ content: string }>,
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('file:writeFile', filePath, content) as Promise<{ success: boolean }>,
  readDirectory: (dirPath: string) =>
    ipcRenderer.invoke('file:readDirectory', dirPath),
  startWatching: (dirPath: string) =>
    ipcRenderer.invoke('file:startWatching', dirPath),
  stopWatching: () =>
    ipcRenderer.invoke('file:stopWatching'),
  openDroppedFile: (filePath: string) =>
    ipcRenderer.invoke('file:openDropped', filePath) as Promise<{ content: string } | null>,

  // Electron's contextIsolation strips File.path — use webUtils instead
  getPathForFile: (file: File): string => {
    try { return webUtils.getPathForFile(file); } catch { return ''; }
  },

  onExternalChange: (callback: (event: { filePath: string; event: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { filePath: string; event: string }) => callback(data);
    ipcRenderer.on('file:externalChange', handler);
    return () => ipcRenderer.removeListener('file:externalChange', handler);
  },

  onMenuAction: (callback: (action: string) => void) => {
    const cleanups: (() => void)[] = [];
    const actions: Record<string, string> = {
      'menu:new': 'menu:new',
      'menu:openFile': 'menu:openFile',
      'menu:openFolder': 'menu:openFolder',
      'menu:save': 'menu:save',
      'menu:saveAs': 'menu:saveAs',
      'menu:closeTab': 'menu:closeTab',
      'menu:toggleSidebar': 'menu:toggleSidebar',
      'menu:togglePreview': 'menu:togglePreview',
    };
    for (const [channel, action] of Object.entries(actions)) {
      const handler = () => callback(action);
      ipcRenderer.on(channel, handler);
      cleanups.push(() => ipcRenderer.removeListener(channel, handler));
    }
    return () => cleanups.forEach(fn => fn());
  }
};

contextBridge.exposeInMainWorld('reporaAPI', api);

export type ReporaAPI = typeof api;
