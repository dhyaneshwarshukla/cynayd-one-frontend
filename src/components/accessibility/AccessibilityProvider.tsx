"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilityContextType {
  // High contrast mode
  highContrast: boolean;
  toggleHighContrast: () => void;
  
  // Reduced motion
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
  
  // Font size scaling
  fontSize: 'small' | 'normal' | 'large' | 'xlarge';
  setFontSize: (size: 'small' | 'normal' | 'large' | 'xlarge') => void;
  
  // Focus management
  focusVisible: boolean;
  setFocusVisible: (visible: boolean) => void;
  
  // Keyboard navigation
  enableKeyboardNav: boolean;
  toggleKeyboardNav: () => void;
  
  // Screen reader announcements
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  
  // Skip links
  skipLinks: Array<{ id: string; label: string }>;
  addSkipLink: (id: string, label: string) => void;
  removeSkipLink: (id: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: ReactNode;
  initialHighContrast?: boolean;
  initialReducedMotion?: boolean;
  initialFontSize?: 'small' | 'normal' | 'large' | 'xlarge';
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
  initialHighContrast = false,
  initialReducedMotion = false,
  initialFontSize = 'normal',
}) => {
  const [highContrast, setHighContrast] = useState(initialHighContrast);
  const [reducedMotion, setReducedMotion] = useState(initialReducedMotion);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [focusVisible, setFocusVisible] = useState(false);
  const [enableKeyboardNav, setEnableKeyboardNav] = useState(true);
  const [skipLinks, setSkipLinks] = useState<Array<{ id: string; label: string }>>([]);

  // Check for user preferences
  useEffect(() => {
    // Check for high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(highContrastQuery.matches);

    // Check for reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(reducedMotionQuery.matches);

    // Listen for preference changes
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches);
    };

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    highContrastQuery.addEventListener('change', handleHighContrastChange);
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    return () => {
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply high contrast
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply reduced motion
    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    // Apply font size
    root.classList.remove('font-size-small', 'font-size-normal', 'font-size-large', 'font-size-xlarge');
    root.classList.add(`font-size-${fontSize}`);
  }, [highContrast, reducedMotion, fontSize]);

  // Keyboard navigation detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Screen reader announcements
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // Skip link management
  const addSkipLink = (id: string, label: string) => {
    setSkipLinks(prev => {
      if (prev.find(link => link.id === id)) {
        return prev;
      }
      return [...prev, { id, label }];
    });
  };

  const removeSkipLink = (id: string) => {
    setSkipLinks(prev => prev.filter(link => link.id !== id));
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };

  const toggleReducedMotion = () => {
    setReducedMotion(prev => !prev);
  };

  const toggleKeyboardNav = () => {
    setEnableKeyboardNav(prev => !prev);
  };

  const contextValue: AccessibilityContextType = {
    highContrast,
    toggleHighContrast,
    reducedMotion,
    toggleReducedMotion,
    fontSize,
    setFontSize,
    focusVisible,
    setFocusVisible,
    enableKeyboardNav,
    toggleKeyboardNav,
    announce,
    skipLinks,
    addSkipLink,
    removeSkipLink,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      <SkipLinks />
    </AccessibilityContext.Provider>
  );
};

// Skip links component
const SkipLinks: React.FC = () => {
  const { skipLinks } = useAccessibility();

  if (skipLinks.length === 0) return null;

  return (
    <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-4 focus-within:left-4 focus-within:z-50">
      <nav aria-label="Skip links">
        <ul className="space-y-2">
          {skipLinks.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(id);
                  if (element) {
                    element.focus();
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

// Keyboard navigation hook
export const useKeyboardNavigation = (onKeyDown?: (e: KeyboardEvent) => void) => {
  const { enableKeyboardNav } = useAccessibility();

  useEffect(() => {
    if (!enableKeyboardNav || !onKeyDown) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      onKeyDown(e);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardNav, onKeyDown]);
};

// Focus trap hook
export const useFocusTrap = (enabled: boolean = true) => {
  const { enableKeyboardNav } = useAccessibility();

  useEffect(() => {
    if (!enabled || !enableKeyboardNav) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, enableKeyboardNav]);
};

// Screen reader only component
export const ScreenReaderOnly: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <span className={`sr-only ${className}`}>{children}</span>
);

// Visually hidden component
export const VisuallyHidden: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <span className={`absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 ${className}`}>
    {children}
  </span>
);
