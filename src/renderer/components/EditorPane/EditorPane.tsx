import React, { useRef, useEffect } from 'react';
import type { Tab } from '../../types';
import './EditorPane.css';

interface Props {
  tab: Tab | null;
  onContentChange: (content: string) => void;
  onCursorChange: (line: number, col: number) => void;
  onSave: () => void;
}

export function EditorPane({ tab, onContentChange, onCursorChange, onSave }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tabIdRef = useRef<string | null>(null);
  const suppressRef = useRef(false);

  // Swap content when tab changes
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || !tab) return;
    if (tab.id === tabIdRef.current) return;

    suppressRef.current = true;
    ta.value = tab.content;
    suppressRef.current = false;
    tabIdRef.current = tab.id;
    ta.focus();
  }, [tab]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (suppressRef.current) return;
    const content = e.target.value;
    onContentChange(content);

    const ta = e.target;
    const pos = ta.selectionStart;
    const lines = ta.value.substring(0, pos).split('\n');
    onCursorChange(lines.length, lines[lines.length - 1].length + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave();
    }
    // Tab key inserts 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      ta.value = ta.value.substring(0, start) + '  ' + ta.value.substring(end);
      ta.selectionStart = ta.selectionEnd = start + 2;
      onContentChange(ta.value);
      return;
    }
    // Update cursor on arrow keys and other non-input keys
    requestAnimationFrame(() => {
      const ta2 = e.currentTarget;
      const pos2 = ta2.selectionStart;
      const lines2 = ta2.value.substring(0, pos2).split('\n');
      onCursorChange(lines2.length, lines2[lines2.length - 1].length + 1);
    });
  };

  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const pos = ta.selectionStart;
    const lines = ta.value.substring(0, pos).split('\n');
    onCursorChange(lines.length, lines[lines.length - 1].length + 1);
  };

  return (
    <div className="editor-pane">
      <textarea
        ref={textareaRef}
        className="editor-textarea"
        spellCheck={false}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        placeholder="Start writing Markdown..."
        defaultValue=""
      />
    </div>
  );
}
