import React, { useMemo } from 'react';
import MarkdownIt from 'markdown-it';
import { tasklist } from '@mdit/plugin-tasklist';
import mk from '@vscode/markdown-it-katex';
import hljs from 'highlight.js';
import './PreviewPane.css';

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: (code: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch {
        return '';
      }
    }
    return '';
  }
});

md.use(tasklist);
md.use(mk, { throwOnError: false, errorColor: '#cc0000' });

interface PreviewPaneProps {
  content: string;
}

export function PreviewPane({ content }: PreviewPaneProps) {
  const html = useMemo(() => {
    if (!content) return '';
    try {
      return md.render(content);
    } catch (err) {
      console.error('[Repora] Markdown render error:', err);
      return '<p style="color:#e0555a">Markdown rendering error</p>';
    }
  }, [content]);

  if (!content) {
    return (
      <div className="preview-pane">
        <div className="preview-empty">
          <p>Nothing to preview</p>
          <p className="preview-empty-hint">Start typing in the editor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-pane">
      <div className="preview-scroll">
        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
