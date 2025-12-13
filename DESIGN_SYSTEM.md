# CYNAYD One Design System

## Overview

This document outlines the design system for CYNAYD One, including color usage, typography, spacing, and component variants.

## Color System

### Primary Colors

- **Primary Blue**: `hsl(221.2, 83.2%, 53.3%)` - Main brand color for primary actions
- **Primary Foreground**: `hsl(210, 40%, 98%)` - Text on primary backgrounds
- **Secondary**: `hsl(210, 40%, 96%)` - Secondary actions and backgrounds
- **Secondary Foreground**: `hsl(222.2, 84%, 4.9%)` - Text on secondary backgrounds

### Semantic Colors

- **Success**: `hsl(142, 76%, 36%)` - Success states, confirmations
- **Error/Destructive**: `hsl(0, 84.2%, 60.2%)` - Errors, destructive actions
- **Warning**: `hsl(38, 92%, 50%)` - Warnings, cautions
- **Info**: `hsl(217.2, 91.2%, 59.8%)` - Informational messages

### Neutral Colors

- **Background**: `hsl(0, 0%, 100%)` (light) / `hsl(222.2, 84%, 4.9%)` (dark)
- **Foreground**: `hsl(222.2, 84%, 4.9%)` (light) / `hsl(210, 40%, 98%)` (dark)
- **Muted**: `hsl(210, 40%, 96%)` (light) / `hsl(217.2, 32.6%, 17.5%)` (dark)
- **Border**: `hsl(214.3, 31.8%, 91.4%)` (light) / `hsl(217.2, 32.6%, 17.5%)` (dark)

### Usage Guidelines

- Use primary blue for main CTAs and important actions
- Use semantic colors consistently (green for success, red for errors, etc.)
- Maintain WCAG AA contrast ratios (minimum 4.5:1 for text)
- Test colors in both light and dark modes

## Typography

### Font Scale

- **Display (3xl)**: 30px / 1.2 - Hero headings
- **Heading 1 (2xl)**: 24px / 1.3 - Page titles
- **Heading 2 (xl)**: 20px / 1.4 - Section headings
- **Heading 3 (lg)**: 18px / 1.5 - Subsection headings
- **Body (base)**: 16px / 1.5 - Body text
- **Small (sm)**: 14px / 1.5 - Secondary text, captions
- **Extra Small (xs)**: 12px / 1.5 - Labels, metadata

### Font Weights

- **Bold**: 700 - Headings, emphasis
- **Semibold**: 600 - Subheadings
- **Medium**: 500 - Labels, buttons
- **Regular**: 400 - Body text
- **Light**: 300 - Decorative text

### Heading Hierarchy

Always maintain proper heading hierarchy:
- One H1 per page
- H2 for main sections
- H3 for subsections
- Use semantic HTML (`<h1>`, `<h2>`, etc.)

## Spacing System

### Base Unit: 4px

- **xs**: 4px (0.25rem)
- **sm**: 8px (0.5rem)
- **md**: 16px (1rem)
- **lg**: 24px (1.5rem)
- **xl**: 32px (2rem)
- **2xl**: 48px (3rem)
- **3xl**: 64px (4rem)

### Usage

- Use consistent spacing between related elements
- Maintain visual rhythm with spacing scale
- Use larger spacing for section separation
- Use smaller spacing for related items

## Component Variants

### Button

- **default**: Primary action (blue background)
- **outline**: Secondary action (border, transparent background)
- **ghost**: Tertiary action (no border, hover background)
- **link**: Text link style
- **destructive**: Destructive actions (red)

Sizes: `sm`, `default`, `lg`, `icon`

### Card

- Default: White background, border, shadow
- Variants: Can be extended with custom classes

### Input

- Default: Standard input with border
- Error state: Red border, error message
- Disabled state: Grayed out, non-interactive

### Alert

- **default**: Neutral information
- **success**: Success messages (green)
- **error**: Error messages (red)
- **warning**: Warning messages (yellow)
- **info**: Informational messages (blue)

## Accessibility

### ARIA Attributes

- Use `aria-label` for icon-only buttons
- Use `aria-describedby` to link inputs with help text/errors
- Use `aria-invalid` for form fields with errors
- Use `aria-live` regions for dynamic content updates
- Use `role` attributes appropriately (alert, button, etc.)

### Focus Management

- All interactive elements must be keyboard accessible
- Visible focus indicators (ring-2, ring-blue-500)
- Logical tab order
- Focus traps in modals
- Skip links for main content

### Screen Reader Support

- Descriptive alt text for images
- Proper heading hierarchy
- ARIA labels for complex interactions
- Live regions for status updates

## Responsive Design

### Breakpoints

- **xs**: 0px (mobile)
- **sm**: 640px (large mobile)
- **md**: 768px (tablet)
- **lg**: 1024px (desktop)
- **xl**: 1280px (large desktop)
- **2xl**: 1536px (extra large desktop)

### Mobile-First Approach

- Design for mobile first
- Progressive enhancement for larger screens
- Touch targets minimum 44x44px
- Optimize typography for mobile readability

## Dark Mode

The design system supports dark mode through CSS variables. All components automatically adapt to dark mode when the `dark` class is applied to the root element.

## Animation & Transitions

- Use subtle transitions (200-300ms) for state changes
- Respect `prefers-reduced-motion` for accessibility
- Use easing functions: `ease-out` for entrances, `ease-in` for exits
- Avoid excessive animations that distract from content

## Best Practices

1. **Consistency**: Use design system components consistently
2. **Accessibility**: Always consider accessibility first
3. **Performance**: Optimize for fast loading and smooth interactions
4. **Responsive**: Ensure all components work on all screen sizes
5. **Documentation**: Document custom variants and usage patterns

## Component Library

### Common Components

- `Button` - Interactive button with variants
- `Card` - Container component
- `Input` - Form input field
- `FormField` - Complete form field with validation
- `Alert` - Status messages
- `LoadingSpinner` - Loading indicators
- `SkeletonLoader` - Content placeholders
- `EmptyState` - Empty state displays
- `DataTable` - Sortable, filterable data table
- `Pagination` - Page navigation
- `SearchBar` - Search input
- `FilterBar` - Filter controls
- `ConfirmDialog` - Confirmation dialogs
- `ErrorMessage` - Error display with retry
- `ErrorBoundary` - React error boundary

### Layout Components

- `UnifiedLayout` - Main page layout
- `ResponsiveContainer` - Responsive container
- `ResponsiveGrid` - Responsive grid system

## Usage Examples

### Button

```tsx
<Button variant="default" size="md">Primary Action</Button>
<Button variant="outline" size="sm">Secondary Action</Button>
<Button variant="destructive">Delete</Button>
```

### Form Field

```tsx
<FormField
  label="Email"
  name="email"
  type="email"
  value={email}
  onChange={setEmail}
  validation={{ required: true, email: true }}
  error={errors.email}
/>
```

### Alert

```tsx
<Alert variant="success">Operation completed successfully!</Alert>
<Alert variant="error">An error occurred. Please try again.</Alert>
```

## Future Enhancements

- Component storybook documentation
- Design tokens export
- Theme customization guide
- Animation library
- Icon system documentation

