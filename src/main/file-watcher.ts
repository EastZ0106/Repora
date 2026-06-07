import chokidar from 'chokidar';
import { BrowserWindow } from 'electron';

let watcher: chokidar.FSWatcher | null = null;
const recentlySavedPaths = new Map<string, NodeJS.Timeout>();

export function startWatching(dirPath: string, win: BrowserWindow): void {
  stopWatching();

  watcher = chokidar.watch(dirPath, {
    ignored: /(^|[/\\])(\..|node_modules)/,
    depth: 10,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 }
  });

  watcher.on('change', (filePath: string) => {
    if (recentlySavedPaths.has(filePath)) return;
    win.webContents.send('file:externalChange', { filePath, event: 'change' });
  });

  watcher.on('unlink', (filePath: string) => {
    win.webContents.send('file:externalChange', { filePath, event: 'unlink' });
  });
}

export function markRecentlySaved(filePath: string): void {
  const existing = recentlySavedPaths.get(filePath);
  if (existing) clearTimeout(existing);
  recentlySavedPaths.set(
    filePath,
    setTimeout(() => recentlySavedPaths.delete(filePath), 2000)
  );
}

export function stopWatching(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}
