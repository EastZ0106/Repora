import React from 'react';
import './StatusBar.css';

interface StatusBarProps {
  wordCount: number;
  cursorLine: number;
  cursorCol: number;
  filePath: string | null;
  isDirty: boolean;
}

export function StatusBar({ wordCount, cursorLine, cursorCol, filePath, isDirty }: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-item">Ln {cursorLine}, Col {cursorCol}</span>
        <span className="status-item">{wordCount} words</span>
      </div>
      <div className="status-right">
        <span className={`status-item ${isDirty ? 'status-dirty' : 'status-saved'}`}>
          {isDirty ? 'Unsaved' : 'Saved'}
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
