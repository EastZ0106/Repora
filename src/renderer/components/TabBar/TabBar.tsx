import React from 'react';
import type { Tab } from '../../types';
import './TabBar.css';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  visible: boolean;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
}

export function TabBar({ tabs, activeTabId, visible, onSelectTab, onCloseTab, onNewTab }: TabBarProps) {
  return (
    <div className="tab-bar" style={{ display: visible ? 'flex' : 'none' }}>
      <div className="tab-list">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
            onMouseDown={e => e.button === 1 && onCloseTab(tab.id)}
          >
            <span className={`tab-dirty ${tab.isDirty ? 'dirty' : ''}`}>
              {tab.isDirty ? '●' : ''}
            </span>
            <span className="tab-title">{tab.title}</span>
            <button
              className="tab-close"
              onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
              title="Close"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      <button className="tab-new" onClick={onNewTab} title="New Tab">+</button>
    </div>
  );
}
