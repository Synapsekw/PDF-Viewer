# Implementation Guide - React, Vite & Tailwind CSS

This guide provides best practices and patterns for implementing the Spectra AI design system using React, Vite, and Tailwind CSS.

## Table of Contents

1. [Project Setup](#project-setup)
2. [Component Architecture](#component-architecture)
3. [Styling Strategy](#styling-strategy)
4. [Tailwind Configuration](#tailwind-configuration)
5. [Component Patterns](#component-patterns)
6. [State Management](#state-management)
7. [Performance Optimization](#performance-optimization)
8. [Development Workflow](#development-workflow)

## Project Setup

### Current Stack
- **React 18**: UI library with hooks and concurrent features
- **TypeScript**: Type safety and better DX
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Emotion**: CSS-in-JS for dynamic styles

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   ├── dashboard/      # Dashboard-specific components
│   ├── pdf/            # PDF viewer components
│   └── admin/          # Admin components
├── contexts/           # React contexts
├── features/           # Feature modules
├── hooks/              # Custom React hooks
├── layouts/            # Layout components
├── lib/               # Business logic & utilities
├── pages/             # Page components
├── theme/             # Theme configuration
└── utils/             # Helper functions
```

### Essential Configuration Files

#### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin']
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@theme': path.resolve(__dirname, './src/theme')
    }
  }
})
```

#### tailwind.config.js
```javascript
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette
        primary: {
          50: '#eff6ff',
          500: '#4dabf7',
          900: '#1e3a8a',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          medium: 'rgba(255, 255, 255, 0.2)',
          dark: 'rgba(0, 0, 0, 0.1)',
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      }
    },
  },
  plugins: [],
}
```

## Component Architecture

### Base Component Pattern

```typescript
// components/ui/Button.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600',
        secondary: 'bg-glass-medium backdrop-blur-md hover:bg-glass-light',
        ghost: 'hover:bg-glass-light',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### Compound Component Pattern

```typescript
// components/ui/Card.tsx
import React from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-slate-800 border border-slate-700',
      glass: 'bg-glass-medium backdrop-blur-xl border border-glass-light',
      elevated: 'bg-slate-800 shadow-xl',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg overflow-hidden',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-6 pb-4', className)}
      {...props}
    />
  )
);

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardContent };
```

## Styling Strategy

### 1. Tailwind-First Approach

```tsx
// ✅ Good - Use Tailwind utilities
<div className="flex items-center gap-4 p-6 bg-slate-800 rounded-lg">
  <Icon className="h-5 w-5 text-primary-500" />
  <span className="text-lg font-medium">Dashboard</span>
</div>

// ❌ Avoid - Custom CSS for common patterns
<div style={{ display: 'flex', padding: '24px' }}>
  ...
</div>
```

### 2. Dynamic Styles with Emotion

```tsx
// For truly dynamic styles that can't be handled by Tailwind
import styled from '@emotion/styled';

const ProgressBar = styled.div<{ progress: number }>`
  width: ${props => props.progress}%;
  transition: width 300ms ease-out;
`;

// Usage
<div className="h-2 bg-slate-700 rounded-full overflow-hidden">
  <ProgressBar 
    progress={75} 
    className="h-full bg-primary-500"
  />
</div>
```

### 3. Glass Morphism Effects

```tsx
// Reusable glass panel classes
const glassClasses = {
  panel: 'backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-xl',
  button: 'backdrop-blur-md bg-white/5 border border-white/10 rounded-lg hover:bg-white/10',
  input: 'backdrop-blur-md bg-white/5 border border-white/20 rounded-lg focus:border-white/40',
};

// Usage
<div className={glassClasses.panel}>
  <h2 className="text-xl font-semibold text-white">Analytics</h2>
</div>
```

### 4. Dark Mode Support

```tsx
// Component with dark mode support
const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-lg bg-slate-800 dark:bg-white/10"
    >
      {isDark ? <Sun /> : <Moon />}
    </button>
  );
};
```

## Tailwind Configuration

### Extended Theme Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      // Custom animations
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      // Custom utilities
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
      },
      // Custom screens
      screens: {
        '3xl': '1920px',
      },
    },
  },
}
```

### Utility Classes

```css
/* Add to your global CSS */
@layer utilities {
  /* Glass morphism utilities */
  .glass-panel {
    @apply backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-xl;
  }
  
  .glass-button {
    @apply backdrop-blur-md bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200;
  }
  
  /* Text gradient */
  .text-gradient {
    @apply bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600;
  }
  
  /* Smooth scroll */
  .smooth-scroll {
    scroll-behavior: smooth;
    scroll-padding-top: 5rem;
  }
}
```

## Component Patterns

### 1. Data Display Component

```tsx
// components/dashboard/MetricCard.tsx
interface MetricCardProps {
  title: string;
  value: number | string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  icon: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  icon,
}) => {
  return (
    <div className="glass-panel p-6 hover:scale-[1.02] transition-transform">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider">
          {title}
        </h3>
        <div className="p-3 bg-white/5 rounded-lg">
          {icon}
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-white">
            {value}
          </p>
          {trend && (
            <p className={cn(
              "text-sm font-medium mt-2 flex items-center gap-1",
              trend.direction === 'up' ? 'text-green-400' : 'text-red-400'
            )}>
              {trend.direction === 'up' ? '↑' : '↓'}
              {Math.abs(trend.value)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 2. Form Component

```tsx
// components/forms/InputField.tsx
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
        
        <input
          ref={ref}
          className={cn(
            "w-full px-4 py-2 bg-white/5 border rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-primary-500",
            "transition-all duration-200",
            error
              ? "border-red-400 focus:border-red-400"
              : "border-white/20 focus:border-primary-400",
            className
          )}
          {...props}
        />
        
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        
        {hint && !error && (
          <p className="text-sm text-slate-400">{hint}</p>
        )}
      </div>
    );
  }
);
```

### 3. Loading States

```tsx
// components/ui/Skeleton.tsx
export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-white/10",
        className
      )}
      {...props}
    />
  );
};

// Usage in a loading state
export const DashboardSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  );
};
```

### 4. Modal Component

```tsx
// components/ui/Modal.tsx
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          open={isOpen}
          onClose={onClose}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex min-h-screen items-center justify-center p-4">
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative glass-panel w-full max-w-md p-6"
            >
              <Dialog.Title className="text-xl font-semibold text-white mb-4">
                {title}
              </Dialog.Title>
              
              {children}
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};
```

## State Management

### Context Pattern

```tsx
// contexts/ThemeContext.tsx
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### Custom Hooks

```tsx
// hooks/useLocalStorage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  return [storedValue, setValue] as const;
}
```

## Performance Optimization

### 1. Component Memoization

```tsx
// Memoize expensive components
export const ExpensiveChart = React.memo(({ data }: { data: ChartData }) => {
  // Complex chart rendering
  return <div>...</div>;
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id;
});
```

### 2. Lazy Loading

```tsx
// Lazy load heavy components
const PDFViewer = lazy(() => import('@/components/pdf/PDFViewer'));
const AdminDashboard = lazy(() => import('@/pages/Admin'));

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/viewer" element={<PDFViewer />} />
    <Route path="/admin" element={<AdminDashboard />} />
  </Routes>
</Suspense>
```

### 3. Virtual Scrolling

```tsx
// For long lists
import { FixedSizeList } from 'react-window';

const DocumentList = ({ documents }: { documents: Document[] }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style} className="flex items-center p-4 hover:bg-white/5">
      <DocumentCard document={documents[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={documents.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

### 4. Image Optimization

```tsx
// Optimized image loading
const LazyImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!isLoaded && <Skeleton className="absolute inset-0" />}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </div>
  );
};
```

## Development Workflow

### 1. Component Development

```bash
# Component file structure
src/components/MyComponent/
├── MyComponent.tsx      # Main component
├── MyComponent.test.tsx # Tests
├── MyComponent.stories.tsx # Storybook stories
└── index.ts            # Export
```

### 2. Type Safety

```typescript
// Strict type definitions
interface PDFViewerProps {
  document: {
    id: string;
    url: string;
    name: string;
  };
  onPageChange?: (page: number) => void;
  initialPage?: number;
  className?: string;
}

// Use discriminated unions for complex states
type LoadingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: PDFDocument }
  | { status: 'error'; error: Error };
```

### 3. Error Boundaries

```tsx
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return <Fallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### 4. Development Tools

```json
// Recommended VS Code extensions
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "styled-components.vscode-styled-components"
  ]
}
```

### 5. Build Optimization

```typescript
// vite.config.ts - Production optimizations
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'pdf': ['pdfjs-dist'],
          'ui-vendor': ['@emotion/react', '@emotion/styled', 'framer-motion'],
        },
      },
    },
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

## Best Practices Summary

### Do's
- ✅ Use Tailwind utilities for styling
- ✅ Create reusable components with clear props
- ✅ Implement proper TypeScript types
- ✅ Use React hooks effectively
- ✅ Optimize bundle size with code splitting
- ✅ Handle loading and error states
- ✅ Write accessible components

### Don'ts
- ❌ Override Tailwind with inline styles unnecessarily
- ❌ Create deeply nested component structures
- ❌ Ignore TypeScript errors
- ❌ Forget error boundaries
- ❌ Skip performance optimization
- ❌ Neglect mobile responsiveness

---

**Note**: This implementation guide should be used alongside the design system documentation to ensure consistent and maintainable code across the Spectra AI application.
