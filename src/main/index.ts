import { app, BrowserWindow, shell } from 'electron';
import { join, resolve } from 'path';
import { registerIpcHandlers } from './ipc-handlers';
import { buildMenu } from './menu';

let mainWindow: BrowserWindow | null = null;
let openFolderPath: string | null = null;

export function getOpenFolderPath(): string | null {
  return openFolderPath;
}

export function setOpenFolderPath(folder: string | null): void {
  openFolderPath = folder;
}

export function isPathInScope(filePath: string): boolean {
  if (!openFolderPath) return true; // no folder open — allow (file-open dialog provides its own gating)
  const resolvedFile = resolve(filePath);
  const resolvedFolder = resolve(openFolderPath);
  return resolvedFile.startsWith(resolvedFolder + '\\') || resolvedFile === resolvedFolder;
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 500,
    title: 'Repora',
    backgroundColor: '#FAFAF0',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false
    },
    show: false
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  buildMenu(mainWindow);
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.repora.editor');

  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

export { mainWindow };
