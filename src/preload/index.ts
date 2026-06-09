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
  setTheme: (theme: string) =>
    ipcRenderer.send('app:setTheme', theme),
  confirmClose: (fileName: string) =>
    ipcRenderer.invoke('dialog:confirmClose', fileName) as Promise<'save' | 'discard' | 'cancel'>,

  getPathForFile: (file: File): string => {
    try { return webUtils.getPathForFile(file); } catch { return ''; }
  },

  onExternalChange: (callback: (event: { filePath: string; event: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { filePath: string; event: string }) => callback(data);
    ipcRenderer.on('file:externalChange', handler);
    return () => ipcRenderer.removeListener('file:externalChange', handler);
  },

  onBeforeClose: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('app:beforeClose', handler);
    return () => ipcRenderer.removeListener('app:beforeClose', handler);
  },

  confirmCloseResponse: (action: 'saveAndClose' | 'close') => {
    ipcRenderer.send('app:closeResponse', action);
  },

  onMenuAction: (callback: (action: string, payload?: string) => void) => {
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
    // Locale handler with payload
    {
      const handler = (_event: Electron.IpcRendererEvent, locale: string) => {
        callback('menu:setLocale', locale);
      };
      ipcRenderer.on('menu:setLocale', handler);
      cleanups.push(() => ipcRenderer.removeListener('menu:setLocale', handler));
    }
    // Dark mode toggler
    {
      const handler = () => callback('menu:toggleDarkMode');
      ipcRenderer.on('menu:toggleDarkMode', handler);
      cleanups.push(() => ipcRenderer.removeListener('menu:toggleDarkMode', handler));
    }
    // Auto-save toggler
    {
      const handler = () => callback('menu:toggleAutoSave');
      ipcRenderer.on('menu:toggleAutoSave', handler);
      cleanups.push(() => ipcRenderer.removeListener('menu:toggleAutoSave', handler));
    }
    return () => cleanups.forEach(fn => fn());
  }
};

contextBridge.exposeInMainWorld('reporaAPI', api);

export type ReporaAPI = typeof api;
