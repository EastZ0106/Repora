import { promises as fs } from 'fs';
import { join, basename } from 'path';

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
  isDirectory: boolean;
}

const EXCLUDED_DIRS = new Set(['node_modules', '.git', '.svn', '.hg']);
const MARKDOWN_EXTS = new Set(['.md', '.markdown', '.mdown', '.mdx', '.txt']);

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function readDirectoryTree(dirPath: string): Promise<TreeNode[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const nodes: TreeNode[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    if (EXCLUDED_DIRS.has(entry.name)) continue;

    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const children = await readDirectoryTree(fullPath);
      nodes.push({
        name: entry.name,
        path: fullPath,
        type: 'directory',
        isDirectory: true,
        children
      });
    } else if (entry.isFile()) {
      const ext = entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase();
      if (MARKDOWN_EXTS.has(ext) || ext === '') {
        nodes.push({
          name: entry.name,
          path: fullPath,
          type: 'file',
          isDirectory: false
        });
      }
    }
  }

  nodes.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return nodes;
}
