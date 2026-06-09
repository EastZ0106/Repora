import { BrowserWindow, Menu, dialog, app } from 'electron';

type LocaleLabels = {
  file: string; newTab: string; openFile: string; openFolder: string;
  save: string; saveAs: string; closeTab: string; exit: string;
  edit: string; undo: string; redo: string; cut: string; copy: string;
  paste: string; selectAll: string;
  view: string; toggleSidebar: string; togglePreview: string;
  zoomIn: string; zoomOut: string; resetZoom: string;
  help: string; about: string;
  language: string; langZh: string; langEn: string; langJa: string;
  theme: string; toggleDarkMode: string; autoSave: string;
};

const labels: Record<string, LocaleLabels> = {
  'zh-CN': {
    file: '文件', newTab: '新建', openFile: '打开文件...', openFolder: '打开文件夹...',
    save: '保存', saveAs: '另存为...', closeTab: '关闭标签页', exit: '退出',
    edit: '编辑', undo: '撤销', redo: '重做', cut: '剪切', copy: '复制', paste: '粘贴', selectAll: '全选',
    view: '查看', toggleSidebar: '切换侧边栏', togglePreview: '切换预览',
    zoomIn: '放大', zoomOut: '缩小', resetZoom: '重置缩放',
    help: '帮助', about: '关于 Repora',
    language: '语言', langZh: '中文', langEn: 'English', langJa: '日本語',
    theme: '主题', toggleDarkMode: '暗色模式', autoSave: '自动保存',
  },
  en: {
    file: 'File', newTab: 'New', openFile: 'Open File...', openFolder: 'Open Folder...',
    save: 'Save', saveAs: 'Save As...', closeTab: 'Close Tab', exit: 'Exit',
    edit: 'Edit', undo: 'Undo', redo: 'Redo', cut: 'Cut', copy: 'Copy', paste: 'Paste', selectAll: 'Select All',
    view: 'View', toggleSidebar: 'Toggle Sidebar', togglePreview: 'Toggle Preview',
    zoomIn: 'Zoom In', zoomOut: 'Zoom Out', resetZoom: 'Reset Zoom',
    help: 'Help', about: 'About Repora',
    language: 'Language', langZh: '中文', langEn: 'English', langJa: '日本語',
    theme: 'Theme', toggleDarkMode: 'Dark Mode', autoSave: 'Auto Save',
  },
  ja: {
    file: 'ファイル', newTab: '新規', openFile: 'ファイルを開く...', openFolder: 'フォルダを開く...',
    save: '保存', saveAs: '名前を付けて保存...', closeTab: 'タブを閉じる', exit: '終了',
    edit: '編集', undo: '元に戻す', redo: 'やり直し', cut: '切り取り', copy: 'コピー', paste: '貼り付け', selectAll: 'すべて選択',
    view: '表示', toggleSidebar: 'サイドバー切替', togglePreview: 'プレビュー切替',
    zoomIn: '拡大', zoomOut: '縮小', resetZoom: 'ズームリセット',
    help: 'ヘルプ', about: 'Reporaについて',
    language: '言語', langZh: '中文', langEn: 'English', langJa: '日本語',
    theme: 'テーマ', toggleDarkMode: 'ダークモード', autoSave: '自動保存',
  },
};

export function buildMenu(win: BrowserWindow, locale = 'zh-CN', darkMode = false, autoSave = true): void {
  const l = labels[locale] || labels['en'];

  // Import dynamically to avoid circular dependency at module parse time
  const { setLocale: setLocaleFn } = require('./index');

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: l.file,
      submenu: [
        { label: l.newTab, accelerator: 'CmdOrCtrl+N', click: () => win.webContents.send('menu:new') },
        { label: l.openFile, accelerator: 'CmdOrCtrl+O', click: () => win.webContents.send('menu:openFile') },
        { label: l.openFolder, accelerator: 'CmdOrCtrl+Shift+O', click: () => win.webContents.send('menu:openFolder') },
        { type: 'separator' },
        { label: l.save, accelerator: 'CmdOrCtrl+S', click: () => win.webContents.send('menu:save') },
        { label: l.saveAs, accelerator: 'CmdOrCtrl+Shift+S', click: () => win.webContents.send('menu:saveAs') },
        { type: 'separator' },
        { label: l.closeTab, accelerator: 'CmdOrCtrl+W', click: () => win.webContents.send('menu:closeTab') },
        { type: 'separator' },
        { label: l.exit, role: 'quit' },
      ],
    },
    {
      label: l.edit,
      submenu: [
        { label: l.undo, role: 'undo' },
        { label: l.redo, role: 'redo' },
        { type: 'separator' },
        { label: l.cut, role: 'cut' },
        { label: l.copy, role: 'copy' },
        { label: l.paste, role: 'paste' },
        { label: l.selectAll, role: 'selectAll' },
      ],
    },
    {
      label: l.view,
      submenu: [
        { label: l.toggleSidebar, accelerator: 'CmdOrCtrl+B', click: () => win.webContents.send('menu:toggleSidebar') },
        { label: l.togglePreview, accelerator: 'CmdOrCtrl+\\', click: () => win.webContents.send('menu:togglePreview') },
        { type: 'separator' },
        { label: l.zoomIn, role: 'zoomIn' },
        { label: l.zoomOut, role: 'zoomOut' },
        { label: l.resetZoom, role: 'resetZoom' },
      ],
    },
    {
      label: l.language,
      submenu: [
        {
          label: l.langZh, type: 'radio', checked: locale === 'zh-CN',
          click: () => {
            setLocaleFn('zh-CN');
            win.webContents.send('menu:setLocale', 'zh-CN');
          },
        },
        {
          label: l.langEn, type: 'radio', checked: locale === 'en',
          click: () => {
            setLocaleFn('en');
            win.webContents.send('menu:setLocale', 'en');
          },
        },
        {
          label: l.langJa, type: 'radio', checked: locale === 'ja',
          click: () => {
            setLocaleFn('ja');
            win.webContents.send('menu:setLocale', 'ja');
          },
        },
      ],
    },
    {
      label: l.help,
      submenu: [
        {
          label: l.toggleDarkMode, accelerator: 'CmdOrCtrl+Shift+D',
          type: 'checkbox', checked: darkMode,
          click: () => win.webContents.send('menu:toggleDarkMode'),
        },
        {
          label: l.autoSave, type: 'checkbox', checked: autoSave,
          click: () => win.webContents.send('menu:toggleAutoSave'),
        },
        { type: 'separator' },
        {
          label: l.about,
          click: () => {
            dialog.showMessageBox(win, {
              type: 'info',
              title: l.about,
              message: `Repora v${app.getVersion()}`,
              detail: l.langZh === '中文' ? '一个简洁、直观的 Windows Markdown 编辑器。' : 'A clean, intuitive Markdown editor for Windows.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
