"use client";

import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { useAccessibility } from './AccessibilityProvider';

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  const {
    highContrast,
    toggleHighContrast,
    reducedMotion,
    toggleReducedMotion,
    fontSize,
    setFontSize,
    enableKeyboardNav,
    toggleKeyboardNav,
  } = useAccessibility();

  const [activeTab, setActiveTab] = useState<'visual' | 'navigation' | 'announcements'>('visual');

  if (!isOpen) return null;

  const tabs = [
    { id: 'visual', label: 'Visual', icon: '👁️' },
    { id: 'navigation', label: 'Navigation', icon: '⌨️' },
    { id: 'announcements', label: 'Announcements', icon: '🔊' },
  ] as const;

  const fontSizes = [
    { value: 'small', label: 'Small', description: 'Easier to fit more content' },
    { value: 'normal', label: 'Normal', description: 'Standard text size' },
    { value: 'large', label: 'Large', description: 'Easier to read' },
    { value: 'xlarge', label: 'Extra Large', description: 'Maximum readability' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className={`w-full max-w-2xl max-h-[90vh] overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Accessibility Settings</h2>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            aria-label="Close accessibility settings"
          >
            ✕
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Accessibility settings tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                aria-selected={activeTab === tab.id}
                role="tab"
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'visual' && (
            <div className="space-y-6">
              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">High Contrast</h3>
                  <p className="text-sm text-gray-600">
                    Increases contrast for better visibility
                  </p>
                </div>
                <Button
                  onClick={toggleHighContrast}
                  variant={highContrast ? 'default' : 'outline'}
                  size="sm"
                >
                  {highContrast ? 'On' : 'Off'}
                </Button>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Reduced Motion</h3>
                  <p className="text-sm text-gray-600">
                    Reduces animations and motion effects
                  </p>
                </div>
                <Button
                  onClick={toggleReducedMotion}
                  variant={reducedMotion ? 'default' : 'outline'}
                  size="sm"
                >
                  {reducedMotion ? 'On' : 'Off'}
                </Button>
              </div>

              {/* Font Size */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Font Size</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fontSizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setFontSize(size.value)}
                      className={`p-3 text-left rounded-lg border-2 transition-colors ${
                        fontSize === size.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{size.label}</div>
                      <div className="text-sm text-gray-600">{size.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'navigation' && (
            <div className="space-y-6">
              {/* Keyboard Navigation */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Keyboard Navigation</h3>
                  <p className="text-sm text-gray-600">
                    Enable enhanced keyboard navigation support
                  </p>
                </div>
                <Button
                  onClick={toggleKeyboardNav}
                  variant={enableKeyboardNav ? 'default' : 'outline'}
                  size="sm"
                >
                  {enableKeyboardNav ? 'On' : 'Off'}
                </Button>
              </div>

              {/* Keyboard Shortcuts */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Keyboard Shortcuts</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Navigate between elements</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded">
                      Tab
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Navigate between options</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded">
                      ↑ ↓
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Activate/Select</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded">
                      Enter
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Close/Go back</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded">
                      Esc
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Focus Indicators */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Focus Indicators</h3>
                <p className="text-sm text-gray-600">
                  Focus indicators are automatically shown when using keyboard navigation.
                  They help you see which element is currently focused.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="space-y-6">
              {/* Screen Reader Support */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Screen Reader Support</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This application includes comprehensive screen reader support with proper ARIA labels,
                  landmarks, and semantic HTML structure.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Features:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Proper heading structure and landmarks</li>
                    <li>• ARIA labels and descriptions</li>
                    <li>• Keyboard navigation support</li>
                    <li>• Screen reader announcements</li>
                    <li>• Skip links for main content</li>
                  </ul>
                </div>
              </div>

              {/* Announcement Priority */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Announcement Priority</h3>
                <p className="text-sm text-gray-600">
                  Screen reader announcements can be set to different priority levels:
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700">Polite:</span>
                    <span className="text-sm text-gray-600">
                      Non-urgent information that doesn't interrupt current speech
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700">Assertive:</span>
                    <span className="text-sm text-gray-600">
                      Important information that should interrupt current speech
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
          <Button onClick={() => {
            // Reset to defaults
            setFontSize('normal');
            onClose();
          }} variant="outline">
            Reset to Defaults
          </Button>
        </div>
      </Card>
    </div>
  );
};

// Floating accessibility button
export const AccessibilityButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsPanelOpen(true)}
        variant="outline"
        size="sm"
        className={`fixed bottom-6 right-6 z-40 shadow-lg ${className}`}
        aria-label="Open accessibility settings"
      >
        ♿
      </Button>
      
      <AccessibilityPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </>
  );
};
