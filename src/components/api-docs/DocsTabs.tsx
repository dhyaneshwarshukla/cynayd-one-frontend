'use client';

import type { DocsTab } from '@/lib/api-docs/constants';

interface DocsTabsProps {
  activeTab: DocsTab;
  onTabChange: (tab: DocsTab) => void;
}

const TABS: { id: DocsTab; label: string; icon: string }[] = [
  { id: 'guide', label: 'Integration Guide', icon: '📖' },
  { id: 'reference', label: 'API Reference', icon: '📋' },
];

export function DocsTabs({ activeTab, onTabChange }: DocsTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Documentation sections"
      className="inline-flex rounded-xl border border-gray-200 bg-gray-100 p-1"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span aria-hidden>{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
