import React from 'react';
import './StatusBar.css';

interface StatusBarProps {
  wordCount: number;
  cursorLine: number;
  cursorCol: number;
  filePath: string | null;
  isDirty: boolean;
  autoSaveEnabled: boolean;
  autoSaveStatus: string | null;
  ts: (path: string) => string;
}

export function StatusBar({ wordCount, cursorLine, cursorCol, filePath, isDirty, autoSaveEnabled, autoSaveStatus, ts }: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-item">{ts('statusBar.ln')} {cursorLine}, {ts('statusBar.col')} {cursorCol}</span>
        <span className="status-item">{wordCount} {ts('statusBar.words')}</span>
      </div>
      <div className="status-right">
        {autoSaveStatus ? (
          <span className="status-item status-autosaved">{autoSaveStatus}</span>
        ) : autoSaveEnabled ? (
          <span className="status-item status-autosave">{ts('statusBar.autoSave')}</span>
        ) : null}
        <span className={`status-item ${isDirty ? 'status-dirty' : 'status-saved'}`}>
          {isDirty ? ts('statusBar.unsaved') : ts('statusBar.saved')}
        </span>
        <span className="status-item">Markdown</span>
        {filePath && (
          <span className="status-item status-path" title={filePath}>
            {filePath.split(/[/\\]/).pop()}
          </span>
        )}
      </div>
    </div>
  );
}
