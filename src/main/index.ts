import { app, BrowserWindow, shell } from 'electron';
import { join, resolve } from 'path';
import { registerIpcHandlers } from './ipc-handlers';
import { buildMenu } from './menu';

let mainWindow: BrowserWindow | null = null;
let openFolderPath: string | null = null;
let currentLocale = 'zh-CN';
let currentTheme: 'light' | 'dark' = 'light';
let currentAutoSave = true;

export function getOpenFolderPath(): string | null {
  return openFolderPath;
}

export function setOpenFolderPath(folder: string | null): void {
  openFolderPath = folder;
}

export function isPathInScope(filePath: string): boolean {
  if (!openFolderPath) return true;
  const resolvedFile = resolve(filePath);
  const resolvedFolder = resolve(openFolderPath);
  return resolvedFile.startsWith(resolvedFolder + '\\') || resolvedFile === resolvedFolder;
}

export function setLocale(locale: string): void {
  currentLocale = locale;
  if (mainWindow) buildMenu(mainWindow, currentLocale, currentTheme === 'dark', currentAutoSave);
}

export function setTheme(theme: 'light' | 'dark'): void {
  currentTheme = theme;
  if (mainWindow) {
    mainWindow.setBackgroundColor(theme === 'dark' ? '#1E1E24' : '#FAFAF0');
    buildMenu(mainWindow, currentLocale, theme === 'dark', currentAutoSave);
  }
}

export function setAutoSave(enabled: boolean): void {
  currentAutoSave = enabled;
  if (mainWindow) buildMenu(mainWindow, currentLocale, currentTheme === 'dark', currentAutoSave);
}

export function getCurrentTheme(): 'light' | 'dark' {
  return currentTheme;
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

  // Intercept close to check unsaved changes
  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow?.webContents.send('app:beforeClose');
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

  buildMenu(mainWindow, currentLocale, currentTheme === 'dark', currentAutoSave);
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
