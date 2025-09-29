import React, { ReactNode } from 'react';

// Breakpoint system
export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Responsive container
interface ResponsiveContainerProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'xl',
  padding = 'md',
  className = '',
}) => {
  const getMaxWidthClasses = () => {
    switch (maxWidth) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case '2xl':
        return 'max-w-2xl';
      case 'full':
        return 'max-w-full';
      default:
        return 'max-w-xl';
    }
  };

  const getPaddingClasses = () => {
    switch (padding) {
      case 'none':
        return '';
      case 'sm':
        return 'px-4 sm:px-6';
      case 'md':
        return 'px-4 sm:px-6 lg:px-8';
      case 'lg':
        return 'px-4 sm:px-6 lg:px-8 xl:px-12';
      default:
        return 'px-4 sm:px-6 lg:px-8';
    }
  };

  return (
    <div className={`mx-auto ${getMaxWidthClasses()} ${getPaddingClasses()} ${className}`}>
      {children}
    </div>
  );
};

// Responsive grid system
interface ResponsiveGridProps {
  children: ReactNode;
  cols?: Partial<Record<Breakpoint, number>>;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  className = '',
}) => {
  const getGridColsClasses = () => {
    const classes: string[] = [];
    
    Object.entries(cols).forEach(([breakpoint, cols]) => {
      if (breakpoint === 'xs') {
        classes.push(`grid-cols-${cols}`);
      } else {
        classes.push(`${breakpoint}:grid-cols-${cols}`);
      }
    });
    
    return classes.join(' ');
  };

  const getGapClasses = () => {
    switch (gap) {
      case 'sm':
        return 'gap-3';
      case 'md':
        return 'gap-4 sm:gap-6';
      case 'lg':
        return 'gap-6 sm:gap-8';
      case 'xl':
        return 'gap-8 sm:gap-12';
      default:
        return 'gap-4 sm:gap-6';
    }
  };

  return (
    <div className={`grid ${getGridColsClasses()} ${getGapClasses()} ${className}`}>
      {children}
    </div>
  );
};

// Responsive flex container
interface ResponsiveFlexProps {
  children: ReactNode;
  direction?: Partial<Record<Breakpoint, 'row' | 'col' | 'row-reverse' | 'col-reverse'>>;
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  wrap?: boolean;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ResponsiveFlex: React.FC<ResponsiveFlexProps> = ({
  children,
  direction = { xs: 'col', sm: 'row' },
  justify = 'start',
  align = 'start',
  wrap = false,
  gap = 'md',
  className = '',
}) => {
  const getDirectionClasses = () => {
    const classes: string[] = [];
    
    Object.entries(direction).forEach(([breakpoint, dir]) => {
      if (breakpoint === 'xs') {
        classes.push(`flex-${dir}`);
      } else {
        classes.push(`${breakpoint}:flex-${dir}`);
      }
    });
    
    return classes.join(' ');
  };

  const getJustifyClasses = () => {
    switch (justify) {
      case 'start':
        return 'justify-start';
      case 'end':
        return 'justify-end';
      case 'center':
        return 'justify-center';
      case 'between':
        return 'justify-between';
      case 'around':
        return 'justify-around';
      case 'evenly':
        return 'justify-evenly';
      default:
        return 'justify-start';
    }
  };

  const getAlignClasses = () => {
    switch (align) {
      case 'start':
        return 'items-start';
      case 'end':
        return 'items-end';
      case 'center':
        return 'items-center';
      case 'baseline':
        return 'items-baseline';
      case 'stretch':
        return 'items-stretch';
      default:
        return 'items-start';
    }
  };

  const getGapClasses = () => {
    switch (gap) {
      case 'sm':
        return 'gap-2 sm:gap-3';
      case 'md':
        return 'gap-3 sm:gap-4';
      case 'lg':
        return 'gap-4 sm:gap-6';
      case 'xl':
        return 'gap-6 sm:gap-8';
      default:
        return 'gap-3 sm:gap-4';
    }
  };

  return (
    <div
      className={`
        flex ${getDirectionClasses()} ${getJustifyClasses()} ${getAlignClasses()} 
        ${getGapClasses()} ${wrap ? 'flex-wrap' : 'flex-nowrap'} ${className}
      `}
    >
      {children}
    </div>
  );
};

// Responsive spacing
interface ResponsiveSpacingProps {
  children: ReactNode;
  padding?: Partial<Record<Breakpoint, 'sm' | 'md' | 'lg' | 'xl' | 'none'>>;
  margin?: Partial<Record<Breakpoint, 'sm' | 'md' | 'lg' | 'xl' | 'none'>>;
  className?: string;
}

export const ResponsiveSpacing: React.FC<ResponsiveSpacingProps> = ({
  children,
  padding = { xs: 'md', sm: 'lg' },
  margin = { xs: 'none', sm: 'md' },
  className = '',
}) => {
  const getSpacingClasses = (type: 'p' | 'm', spacing: Partial<Record<Breakpoint, string>>) => {
    const classes: string[] = [];
    
    Object.entries(spacing).forEach(([breakpoint, size]) => {
      if (breakpoint === 'xs') {
        classes.push(`${type}-${size}`);
      } else {
        classes.push(`${breakpoint}:${type}-${size}`);
      }
    });
    
    return classes.join(' ');
  };

  const paddingClasses = getSpacingClasses('p', padding);
  const marginClasses = getSpacingClasses('m', margin);

  return (
    <div className={`${paddingClasses} ${marginClasses} ${className}`}>
      {children}
    </div>
  );
};

// Responsive text sizing
interface ResponsiveTextProps {
  children: ReactNode;
  size?: Partial<Record<Breakpoint, 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'>>;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  className?: string;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  size = { xs: 'base', sm: 'lg' },
  weight = 'normal',
  className = '',
}) => {
  const getSizeClasses = () => {
    const classes: string[] = [];
    
    Object.entries(size).forEach(([breakpoint, textSize]) => {
      if (breakpoint === 'xs') {
        classes.push(`text-${textSize}`);
      } else {
        classes.push(`${breakpoint}:text-${textSize}`);
      }
    });
    
    return classes.join(' ');
  };

  const getWeightClasses = () => {
    switch (weight) {
      case 'normal':
        return 'font-normal';
      case 'medium':
        return 'font-medium';
      case 'semibold':
        return 'font-semibold';
      case 'bold':
        return 'font-bold';
      default:
        return 'font-normal';
    }
  };

  return (
    <div className={`${getSizeClasses()} ${getWeightClasses()} ${className}`}>
      {children}
    </div>
  );
};

// Responsive visibility
interface ResponsiveVisibilityProps {
  children: ReactNode;
  show?: Partial<Record<Breakpoint, boolean>>;
  hide?: Partial<Record<Breakpoint, boolean>>;
  className?: string;
}

export const ResponsiveVisibility: React.FC<ResponsiveVisibilityProps> = ({
  children,
  show,
  hide,
  className = '',
}) => {
  const getVisibilityClasses = () => {
    const classes: string[] = [];
    
    if (show) {
      Object.entries(show).forEach(([breakpoint, visible]) => {
        if (breakpoint === 'xs') {
          classes.push(visible ? 'block' : 'hidden');
        } else {
          classes.push(visible ? `${breakpoint}:block` : `${breakpoint}:hidden`);
        }
      });
    }
    
    if (hide) {
      Object.entries(hide).forEach(([breakpoint, hidden]) => {
        if (breakpoint === 'xs') {
          classes.push(hidden ? 'hidden' : 'block');
        } else {
          classes.push(hidden ? `${breakpoint}:hidden` : `${breakpoint}:block`);
        }
      });
    }
    
    return classes.join(' ');
  };

  return (
    <div className={`${getVisibilityClasses()} ${className}`}>
      {children}
    </div>
  );
};
