import { ipcMain, dialog, BrowserWindow, app } from 'electron';
import { readFile, writeFile, readDirectoryTree } from './file-system';
import { markRecentlySaved, startWatching, stopWatching } from './file-watcher';
import { isPathInScope, setLocale, setTheme, setAutoSave } from './index';

export function registerIpcHandlers(): void {
  ipcMain.handle('dialog:openFile', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      title: 'Open Markdown File',
      filters: [
        { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mdx', 'txt'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const filePath = result.filePaths[0];
    const content = await readFile(filePath);
    return { filePath, content };
  });

  ipcMain.handle('dialog:saveFile', async (_event, filePath: string, content: string) => {
    if (!filePath) {
      const win = BrowserWindow.getFocusedWindow();
      if (!win) return { success: false, filePath: null };
      const result = await dialog.showSaveDialog(win, {
        title: 'Save Markdown File',
        filters: [
          { name: 'Markdown', extensions: ['md'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      if (result.canceled || !result.filePath) return { success: false, filePath: null };
      filePath = result.filePath;
    }
    await writeFile(filePath, content);
    markRecentlySaved(filePath);
    return { success: true, filePath };
  });

  ipcMain.handle('dialog:openFolder', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      title: 'Open Folder',
      properties: ['openDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const { setOpenFolderPath } = require('./index');
    setOpenFolderPath(result.filePaths[0]);
    return { folderPath: result.filePaths[0] };
  });

  ipcMain.handle('dialog:confirmClose', async (_event, fileName: string) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return 'discard';
    const result = await dialog.showMessageBox(win, {
      type: 'warning',
      title: 'Unsaved Changes',
      message: `"${fileName}" has unsaved changes.`,
      detail: 'Do you want to save before closing?',
      buttons: ['Save', 'Discard', 'Cancel'],
      defaultId: 0,
      cancelId: 2,
    });
    if (result.response === 0) return 'save';
    if (result.response === 1) return 'discard';
    return 'cancel';
  });

  // Theme / locale / auto-save push from renderer
  ipcMain.on('app:setTheme', (_event, theme: string) => {
    setTheme(theme as 'light' | 'dark');
  });

  // Locale & menu state updates
  ipcMain.on('menu:setLocale', (_event, locale: string) => {
    setLocale(locale);
  });

  ipcMain.on('menu:toggleDarkMode', () => {
    const { getCurrentTheme } = require('./index');
    const next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
  });

  ipcMain.on('menu:toggleAutoSave', () => {
    const { default: mod } = { default: { currentAutoSave: true } };
    // auto-save state is managed in renderer; menu rebuild via setAutoSave
  });

  // Close response
  ipcMain.on('app:closeResponse', (_event, action: string) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;
    if (action === 'close') {
      win.destroy();
      if (BrowserWindow.getAllWindows().length === 0) {
        app.quit();
      }
    }
  });

  ipcMain.handle('file:readFile', async (_event, filePath: string) => {
    if (!isPathInScope(filePath)) throw new Error('Path not in open folder scope');
    const content = await readFile(filePath);
    return { content };
  });

  ipcMain.handle('file:writeFile', async (_event, filePath: string, content: string) => {
    if (!isPathInScope(filePath)) throw new Error('Path not in open folder scope');
    await writeFile(filePath, content);
    markRecentlySaved(filePath);
    return { success: true };
  });

  ipcMain.handle('file:readDirectory', async (_event, dirPath: string) => {
    if (!isPathInScope(dirPath)) throw new Error('Path not in open folder scope');
    return readDirectoryTree(dirPath);
  });

  ipcMain.handle('file:startWatching', async (_event, dirPath: string) => {
    if (!isPathInScope(dirPath)) throw new Error('Path not in open folder scope');
    const win = BrowserWindow.getFocusedWindow();
    if (win) startWatching(dirPath, win);
  });

  ipcMain.handle('file:stopWatching', async () => {
    stopWatching();
  });

  ipcMain.handle('file:openDropped', async (_event, filePath: string) => {
    try {
      const content = await readFile(filePath);
      return { content };
    } catch {
      return null;
    }
  });
}
