import React, { useState, forwardRef } from 'react';
import type { TreeNode } from '../../types';
import './Sidebar.css';

interface SidebarProps {
  tree: TreeNode[];
  openFolder: string | null;
  onOpenFolder: () => void;
  onFileClick: (filePath: string) => void;
}

function TreeNodeItem({ node, depth, onFileClick }: { node: TreeNode; depth: number; onFileClick: (path: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  if (node.isDirectory) {
    return (
      <div className="tree-node">
        <div
          className="tree-node-label tree-dir"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => setExpanded(!expanded)}
        >
          <span className={`tree-chevron ${expanded ? 'expanded' : ''}`}>▶</span>
          <span className="tree-icon">📁</span>
          <span className="tree-name">{node.name}</span>
        </div>
        {expanded && node.children && (
          <div className="tree-children">
            {node.children.map(child => (
              <TreeNodeItem key={child.path} node={child} depth={depth + 1} onFileClick={onFileClick} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="tree-node-label tree-file"
      style={{ paddingLeft: `${12 + depth * 16 + 14}px` }}
      onClick={() => onFileClick(node.path)}
    >
      <span className="tree-icon">📄</span>
      <span className="tree-name">{node.name}</span>
    </div>
  );
}

export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
  function Sidebar({ tree, openFolder, onOpenFolder, onFileClick }, ref) {
    return (
      <div className="sidebar" ref={ref}>
        <div className="sidebar-header">
          {openFolder ? (
            <div className="sidebar-folder-path" title={openFolder}>
              {openFolder.split(/[/\\]/).pop() || openFolder}
            </div>
          ) : (
            <div className="sidebar-placeholder">No folder open</div>
          )}
          <button className="sidebar-open-btn" onClick={onOpenFolder} title="Open Folder">
            Open Folder
          </button>
        </div>
        <div className="sidebar-tree">
          {tree.length === 0 && openFolder && (
            <div className="sidebar-empty">No Markdown files found</div>
          )}
          {tree.length === 0 && !openFolder && (
            <div className="sidebar-empty-hint">
              <p>Open a folder to browse</p>
              <p>Markdown files</p>
            </div>
          )}
          {tree.map(node => (
            <TreeNodeItem key={node.path} node={node} depth={0} onFileClick={onFileClick} />
          ))}
        </div>
      </div>
    );
  }
);
