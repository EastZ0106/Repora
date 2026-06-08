# Repora 项目迭代计划 (Project Plan)

> 当前版本：v0.1.0 | 目标平台：Windows | 技术栈：Electron 39 + React 18 + TypeScript 5

---

## 版本路线图

```
v0.1.0 ✅ 完成       v0.2.0                  v0.3.0                         v0.4.0                    v1.0.0
[MVP 基础编辑器]  →  [暗色模式 + QoL]  →  [WYSIWYG 所见即所得]  →  [富媒体 + 导出 + 全局搜索]  →  [云同步设计 + 自动更新 + 正式发布]
    textarea           暗色模式              TipTap 集成                    图片粘贴+导出               GitHub Releases
    split-pane         退出未保存提示         Markdown 双向转换              全局搜索                   electron-updater
    markdown-it        自动保存              代码块/公式/任务列表            文件导出 HTML/PDF          云同步架构设计
```

---

## v0.2.0 —— 暗色模式与基础体验增强

**目标**：打磨现有功能体验，三项最直接影响日常使用的改进，零新增依赖。

### 功能清单

#### 1. 暗色模式

**方案**：纯 CSS 变量切换，在 `<html>` 上挂载 `data-theme="dark"` 属性。

- 在 `global.css` 新增 `[data-theme="dark"]` 块，定义所有 29 个变量的深色值
- 修复 14 处硬编码颜色（`EditorPane.css`、`App.css`、`Sidebar.css`、`main.tsx`、`main/index.ts`）
- 在 `AppState` 新增 `darkMode: boolean` + `TOGGLE_DARK_MODE` action
- 在 View 菜单新增 `Toggle Dark Mode`（`Ctrl+Shift+D`）
- BrowserWindow 的 `backgroundColor` 同步切换（IPC 推送）
- `localStorage` 持久化偏好

#### 2. 退出时未保存提示

**方案**：Window `close` 事件中拦截，查询渲染进程是否有 dirty tabs。

- `mainWindow.on('close', e => { e.preventDefault(); send 'before-close' })`
- 渲染进程检查 `state.tabs.some(t => t.isDirty)`，通过 IPC 返回
- 通过 `dialog.showMessageBox` 原生弹窗："Save All / Discard / Cancel"
- 覆盖 `CLOSE_TAB` 场景和整体退出场景

#### 3. 自动保存

**方案**：`useEffect` 监听 `activeTab.content` 变化，debounce 2 秒触发保存。

- 仅对有 `filePath` 的标签页生效（无标题文件跳过）
- `AppState` 新增 `autoSaveEnabled: boolean` + 菜单 toggle
- StatusBar 在保存时短暂显示 "Auto-saved"
- 复用已有 `markRecentlySaved` 抑制自身写入触发的文件监听

### 新依赖

无

---

## v0.3.0 —— WYSIWYG 所见即所得编辑器

**目标**：将 textarea 替换为 TipTap 富文本编辑器，实现真正的所见即所得。

### 为什么选择 TipTap

- React 一等公民（官方 `@tiptap/react`）
- 基于 ProseMirror，底层能力完整
- 官方 Markdown 扩展支持双向转换
- 丰富扩展库（表格、任务列表、代码块语法高亮、Placeholder 等）

### 核心架构

**不变项**：`Tab.content` 始终存储纯 Markdown 字符串——WYSIWYG 和 Split 模式可随时切换，文件保存格式不变。

**数据流**：
```
WYSIWYG 输入 → TipTap 内部状态(ProseMirror JSON)
  → onUpdate → editor.storage.markdown.getMarkdown() → Markdown 字符串
  → debounce 300ms → dispatch(UPDATE_CONTENT)

切换到 Split 模式 → Tab.content(Markdown) → textarea.value → PreviewPane
切换到 WYSIWYG  → Tab.content(Markdown) → TipTap.commands.setContent()
```

### 功能

- **WYSIWYG 编辑模式**：基于 `@tiptap/starter-kit`，支持 bold/italic/heading/code/link/blockquote/list
- **GFM 完整支持**：TaskList、Table（带 Markdown 双向转换）
- **代码块语法高亮**：`@tiptap/extension-code-block-lowlight`（复用现有 highlight.js）
- **LaTeX 公式**：自定义 `MarkdownMath` 扩展，`$inline$` / `$$block$$` 在 TipTap 中渲染为 KaTeX
- **WYSIWYG 工具栏**：顶部格式化按钮栏 + 选中文本 BubbleMenu
- **四模式切换**：Split（分屏）/ Edit Only / Preview Only / WYSIWYG
- **保留 textarea 降级**：作为 fallback 模式

### 编辑器模式枚举

```typescript
export type EditorMode = 'split' | 'edit' | 'preview' | 'wysiwyg';
```

### 文件结构变更

```
新增：
  src/renderer/components/EditorPane/TipTapEditor.tsx
  src/renderer/components/EditorPane/TipTapEditor.css
  src/renderer/components/EditorPane/extensions/
    MarkdownMath.ts    — LaTeX 公式扩展 (~150行)
    MarkdownEscape.ts  — Markdown 转义扩展 (~50行)
  src/renderer/components/Toolbar/Toolbar.tsx
  src/renderer/components/Toolbar/Toolbar.css

修改：
  src/renderer/components/EditorPane/EditorPane.tsx — 重写为模式路由器
  src/renderer/types/index.ts — 新增 EditorMode 类型、SET_EDITOR_MODE action
  src/renderer/context/AppState.tsx — reducer 新增 editorMode
  src/renderer/App.tsx — 布局切换逻辑
```

### 新增依赖

```json
{
  "@tiptap/react": "^2.16.0",
  "@tiptap/starter-kit": "^2.16.0",
  "@tiptap/extension-markdown": "^2.16.0",
  "@tiptap/extension-task-list": "^2.16.0",
  "@tiptap/extension-task-item": "^2.16.0",
  "@tiptap/extension-table": "^2.16.0",
  "@tiptap/extension-table-row": "^2.16.0",
  "@tiptap/extension-table-cell": "^2.16.0",
  "@tiptap/extension-table-header": "^2.16.0",
  "@tiptap/extension-image": "^2.16.0",
  "@tiptap/extension-code-block-lowlight": "^2.16.0",
  "@tiptap/extension-placeholder": "^2.16.0",
  "lowlight": "^3.3.0"
}
```

### 风险

| 风险 | 缓解 |
|------|------|
| Markdown 双向转换信息丢失 | 建立 50+ 场景测试用例库 |
| LaTeX 序列化/反序列化 | 自定义序列化器挂载到 markdown 扩展 |
| 大文件性能 | >5000 行文件实测并限制 WYSIWYG 文件大小 |

---

## v0.4.0 —— 图片、导出与全局搜索

**目标**：完善内容生态，支持富媒体、文件导出和跨文件搜索。

### 功能清单

#### 1. 图片支持

- **粘贴图片**：`Ctrl+V` 从剪贴板读取，保存到 `images/` 目录，插入相对路径 `![alt](images/xxx.png)`
- **拖入图片**：从文件管理器拖入，同逻辑
- **无标题文件处理**：提示先保存文件

#### 2. 导出 HTML / PDF

- **HTML**：markdown-it 渲染 + 内联 CSS，单文件自包含
- **PDF**：渲染 HTML → 隐藏 BrowserWindow → `printToPDF()` → 保存

#### 3. 全局搜索

- `Ctrl+Shift+F` 搜索打开文件夹中所有 `.md` 文件
- 结果按文件分组，显示匹配行 + 上下文
- 点击结果跳转到对应文件和行

#### 4. 大纲视图

- Sidebar 新增 `[Files] [Outline]` 双标签
- Outline 解析当前文档 Markdown 标题树
- 点击标题跳转到编辑器对应位置
- 文件树右键菜单：删除/重命名

### 新依赖

无（PDF 用 Electron 内置 API）

---

## v1.0.0 —— 正式发布

**目标**：开源发布，自动更新上线，云同步架构方案定稿。

### 功能清单

#### 1. 云同步架构设计

> **用户决策**：先设计完整方案，暂不实现。

**推荐方案：GitHub Gist 作为存储后端**（零服务器成本）

- 每个工作区存为一个 Gist（secret，不公开）
- OAuth Device Flow 认证
- 编辑后 debounce 5s 推送到远程
- 冲突：最后写入胜出 + 本地 `.conflict-*` 备份

**备选方案：自建后端**
- NestJS/Fastify + PostgreSQL + Redis
- WebSocket 实时同步（可选 Yjs CRDT）
- 抽象 `SyncBackend` 接口，两种后端可替换

**当前版本产出物**：
- `docs/sync-architecture.md` — 完整架构文档
- `src/main/sync/backend-interface.ts` — TypeScript 接口定义
- 不安装同步相关依赖

#### 2. 自动更新

**方案**：`electron-updater` + GitHub Releases

- `electron-builder.yml` 新增 `publish.provider: github`
- `src/main/auto-updater.ts`：启动时检查 + 每 4 小时轮询
- 用户确认后下载 → 重启安装
- `GitHub Actions` CI：push tag `v*` → 自动构建 + 创建 Release

#### 3. 开源发布准备

- `LICENSE` (MIT)、`CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`
- `.github/ISSUE_TEMPLATE/`（bug report + feature request）
- `CHANGELOG.md`
- README 更新功能列表、截图、安装说明

### 新依赖

```json
{ "electron-updater": "^6.3.0" }
```

### CI 配置概要

```yaml
# .github/workflows/release.yml
on: push tags 'v*' → windows-latest → npm ci → npm run package → create Release
```

---

## 依赖变更总览

| 版本 | 新增依赖 |
|------|----------|
| v0.2.0 | 无 |
| v0.3.0 | @tiptap/* 系列 (~13 个包) + lowlight |
| v0.4.0 | 无 |
| v1.0.0 | electron-updater |

---

## 关键文件变更热力图

| 文件 | v0.2.0 | v0.3.0 | v0.4.0 | v1.0.0 |
|------|--------|--------|--------|--------|
| `src/renderer/types/index.ts` | 改 | 改 | 改 | 轻微 |
| `src/renderer/context/AppState.tsx` | 改 | 改 | 改 | 轻微 |
| `src/renderer/App.tsx` | 改 | 改 | 轻微 | 轻微 |
| `src/renderer/App.css` | 改 | 改 | — | — |
| `src/renderer/styles/global.css` | 改 | — | — | — |
| `src/renderer/components/EditorPane/EditorPane.tsx` | 改 | 重写 | 改 | — |
| `src/renderer/components/PreviewPane/PreviewPane.tsx` | — | 轻微 | — | — |
| `src/renderer/components/Sidebar/Sidebar.tsx` | — | — | 改 | — |
| `src/renderer/components/StatusBar/StatusBar.tsx` | 改 | — | 改 | — |
| `src/main/ipc-handlers.ts` | — | — | 改 | 轻微 |
| `src/main/index.ts` | 改 | — | 轻微 | 改 |
| `src/main/menu.ts` | 改 | 轻微 | 改 | 改 |
| `src/preload/index.ts` | — | — | 改 | 轻微 |
| `electron-builder.yml` | — | — | — | 改 |
| 新增文件 | 1 | 6 | 4 | 2 |

---

*最后更新：2026-06-08*
