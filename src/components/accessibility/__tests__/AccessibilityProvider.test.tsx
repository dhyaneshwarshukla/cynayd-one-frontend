import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccessibilityProvider, useAccessibility } from '../AccessibilityProvider';

// Mock component to test useAccessibility hook
const TestComponent: React.FC = () => {
  const {
    highContrast,
    toggleHighContrast,
    reducedMotion,
    toggleReducedMotion,
    fontSize,
    setFontSize,
    enableKeyboardNav,
    toggleKeyboardNav,
    announce,
    addSkipLink,
    removeSkipLink,
  } = useAccessibility();

  return (
    <div>
      <div data-testid="high-contrast">{highContrast.toString()}</div>
      <div data-testid="reduced-motion">{reducedMotion.toString()}</div>
      <div data-testid="font-size">{fontSize}</div>
      <div data-testid="keyboard-nav">{enableKeyboardNav.toString()}</div>
      
      <button onClick={toggleHighContrast}>Toggle High Contrast</button>
      <button onClick={toggleReducedMotion}>Toggle Reduced Motion</button>
      <button onClick={() => setFontSize('large')}>Set Large Font</button>
      <button onClick={toggleKeyboardNav}>Toggle Keyboard Nav</button>
      <button onClick={() => announce('Test announcement')}>Announce</button>
      <button onClick={() => addSkipLink('main', 'Skip to main content')}>Add Skip Link</button>
      <button onClick={() => removeSkipLink('main')}>Remove Skip Link</button>
    </div>
  );
};

// Mock matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Mock navigator.onLine
const mockNavigatorOnline = (online: boolean) => {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: online,
  });
};

describe('AccessibilityProvider', () => {
  beforeEach(() => {
    // Reset mocks
    mockMatchMedia(false);
    mockNavigatorOnline(true);
    
    // Clear document classes
    document.documentElement.className = '';
    
    // Mock createElement for announcements
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = document.createElement(tagName);
      element.setAttribute = jest.fn();
      element.className = '';
      element.textContent = '';
      return element;
    });
    
    // Mock appendChild and removeChild
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => document.createElement('div'));
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => document.createElement('div'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('renders children without crashing', () => {
      render(
        <AccessibilityProvider>
          <div>Test Content</div>
        </AccessibilityProvider>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('initializes with default values', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');
      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('false');
      expect(screen.getByTestId('font-size')).toHaveTextContent('normal');
      expect(screen.getByTestId('keyboard-nav')).toHaveTextContent('true');
    });

    it('respects user preferences from media queries', () => {
      mockMatchMedia(true); // User prefers high contrast and reduced motion

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
    });
  });

  describe('High Contrast Mode', () => {
    it('toggles high contrast mode', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      const toggleButton = screen.getByText('Toggle High Contrast');
      
      // Initial state
      expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');
      expect(document.documentElement).not.toHaveClass('high-contrast');

      // Toggle on
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
      expect(document.documentElement).toHaveClass('high-contrast');

      // Toggle off
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');
      expect(document.documentElement).not.toHaveClass('high-contrast');
    });
  });

  describe('Reduced Motion', () => {
    it('toggles reduced motion mode', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      const toggleButton = screen.getByText('Toggle Reduced Motion');
      
      // Initial state
      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('false');
      expect(document.documentElement).not.toHaveClass('reduced-motion');

      // Toggle on
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
      expect(document.documentElement).toHaveClass('reduced-motion');

      // Toggle off
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('false');
      expect(document.documentElement).not.toHaveClass('reduced-motion');
    });
  });

  describe('Font Size', () => {
    it('changes font size', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      const setLargeButton = screen.getByText('Set Large Font');
      
      // Initial state
      expect(screen.getByTestId('font-size')).toHaveTextContent('normal');
      expect(document.documentElement).toHaveClass('font-size-normal');

      // Change to large
      fireEvent.click(setLargeButton);
      expect(screen.getByTestId('font-size')).toHaveTextContent('large');
      expect(document.documentElement).toHaveClass('font-size-large');
      expect(document.documentElement).not.toHaveClass('font-size-normal');
    });
  });

  describe('Keyboard Navigation', () => {
    it('toggles keyboard navigation', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      const toggleButton = screen.getByText('Toggle Keyboard Nav');
      
      // Initial state
      expect(screen.getByTestId('keyboard-nav')).toHaveTextContent('true');

      // Toggle off
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('keyboard-nav')).toHaveTextContent('false');

      // Toggle on
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('keyboard-nav')).toHaveTextContent('true');
    });
  });

  describe('Screen Reader Announcements', () => {
    it('creates announcements with proper ARIA attributes', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      const announceButton = screen.getByText('Announce');
      
      fireEvent.click(announceButton);

      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('removes announcements after timeout', async () => {
      jest.useFakeTimers();

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      const announceButton = screen.getByText('Announce');
      fireEvent.click(announceButton);

      // Fast-forward time
      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(document.body.removeChild).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });

  describe('Skip Links', () => {
    it('adds and removes skip links', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      const addButton = screen.getByText('Add Skip Link');
      const removeButton = screen.getByText('Remove Skip Link');

      // Add skip link
      fireEvent.click(addButton);
      
      // Check that skip links are rendered
      expect(screen.getByText('Skip to main content')).toBeInTheDocument();

      // Remove skip link
      fireEvent.click(removeButton);
      
      // Check that skip link is removed
      expect(screen.queryByText('Skip to main content')).not.toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('detects keyboard navigation', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      // Simulate Tab key press
      fireEvent.keyDown(document, { key: 'Tab' });
      
      // Focus should be visible
      expect(document.documentElement).toHaveClass('focus-visible');
    });

    it('detects mouse usage', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      // Simulate Tab key press first
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(document.documentElement).toHaveClass('focus-visible');

      // Simulate mouse click
      fireEvent.mouseDown(document);
      expect(document.documentElement).not.toHaveClass('focus-visible');
    });
  });

  describe('Media Query Listeners', () => {
    it('listens for media query changes', () => {
      const mockAddEventListener = jest.fn();
      const mockRemoveEventListener = jest.fn();

      // Mock matchMedia with event listeners
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => ({
          matches: false,
          addEventListener: mockAddEventListener,
          removeEventListener: mockRemoveEventListener,
        })),
      });

      const { unmount } = render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      // Should add event listeners
      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));

      // Cleanup
      unmount();

      // Should remove event listeners
      expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('Document Class Management', () => {
    it('applies and removes classes correctly', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      const root = document.documentElement;

      // Initially no classes
      expect(root.className).toBe('');

      // Toggle high contrast
      fireEvent.click(screen.getByText('Toggle High Contrast'));
      expect(root).toHaveClass('high-contrast');

      // Toggle reduced motion
      fireEvent.click(screen.getByText('Toggle Reduced Motion'));
      expect(root).toHaveClass('reduced-motion');

      // Change font size
      fireEvent.click(screen.getByText('Set Large Font'));
      expect(root).toHaveClass('font-size-large');

      // Toggle off high contrast
      fireEvent.click(screen.getByText('Toggle High Contrast'));
      expect(root).not.toHaveClass('high-contrast');
      expect(root).toHaveClass('reduced-motion');
      expect(root).toHaveClass('font-size-large');
    });
  });

  describe('Error Handling', () => {
    it('handles missing useAccessibility context gracefully', () => {
      // This should throw an error when used outside of provider
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAccessibility must be used within an AccessibilityProvider');
    });
  });
});
