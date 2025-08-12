# Design Tokens - Spectra AI

Design tokens are the visual design atoms of the design system — specifically, they are named entities that store visual design attributes. This document defines all design tokens used in Spectra AI.

## Table of Contents

1. [Color Tokens](#color-tokens)
2. [Typography Tokens](#typography-tokens)
3. [Spacing Tokens](#spacing-tokens)
4. [Border Tokens](#border-tokens)
5. [Shadow Tokens](#shadow-tokens)
6. [Animation Tokens](#animation-tokens)
7. [Z-Index Tokens](#z-index-tokens)
8. [Breakpoint Tokens](#breakpoint-tokens)
9. [Token Usage Guide](#token-usage-guide)
10. [Token Implementation](#token-implementation)

## Color Tokens

### Base Colors

```javascript
const colors = {
  // Primary brand colors
  primary: {
    50: '#eff6ff',   // Lightest
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#4dabf7',  // Main brand color
    600: '#339af0',
    700: '#1d7ed8',
    800: '#1e40af',
    900: '#1e3a8a',  // Darkest
  },
  
  // Neutral colors (Slate)
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  
  // Semantic colors
  success: {
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
  },
  
  warning: {
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
  },
  
  error: {
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
  },
  
  info: {
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
  },
};
```

### Background Colors

```javascript
const backgrounds = {
  // Page backgrounds
  page: {
    primary: '#0f172a',    // Main app background
    secondary: '#1e293b',  // Secondary sections
    tertiary: '#334155',   // Cards and panels
  },
  
  // Glass morphism backgrounds
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.2)',
    heavy: 'rgba(255, 255, 255, 0.3)',
    dark: 'rgba(0, 0, 0, 0.1)',
  },
  
  // Overlay backgrounds
  overlay: {
    light: 'rgba(0, 0, 0, 0.3)',
    medium: 'rgba(0, 0, 0, 0.5)',
    heavy: 'rgba(0, 0, 0, 0.7)',
  },
};
```

### Text Colors

```javascript
const textColors = {
  // Primary text colors
  primary: '#ffffff',      // White for dark backgrounds
  secondary: '#cbd5e1',    // Muted text
  tertiary: '#94a3b8',     // Even more muted
  disabled: '#64748b',     // Disabled state
  
  // Inverted (for light backgrounds)
  inverted: {
    primary: '#0f172a',
    secondary: '#334155',
    tertiary: '#64748b',
  },
  
  // Interactive text
  link: '#4dabf7',
  linkHover: '#60a5fa',
  linkActive: '#339af0',
};
```

### Border Colors

```javascript
const borderColors = {
  default: 'rgba(255, 255, 255, 0.1)',
  light: 'rgba(255, 255, 255, 0.2)',
  focus: 'rgba(77, 171, 247, 0.5)',
  error: 'rgba(239, 68, 68, 0.5)',
  success: 'rgba(34, 197, 94, 0.5)',
};
```

## Typography Tokens

### Font Families

```javascript
const fontFamilies = {
  sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  display: ['Poppins', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
};
```

### Font Sizes

```javascript
const fontSizes = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
  '6xl': '3.75rem', // 60px
};
```

### Font Weights

```javascript
const fontWeights = {
  thin: 100,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
};
```

### Line Heights

```javascript
const lineHeights = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
};
```

### Letter Spacing

```javascript
const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
};
```

### Text Styles (Composed)

```javascript
const textStyles = {
  // Headings
  h1: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['5xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
  },
  h4: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
  },
  h5: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
  },
  h6: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
  },
  
  // Body text
  body: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
  },
  bodySmall: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
  },
  
  // UI text
  label: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.wide,
  },
  caption: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
  },
  button: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.wide,
  },
  
  // Code
  code: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
  },
};
```

## Spacing Tokens

```javascript
const spacing = {
  px: '1px',
  0: '0px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
};
```

## Border Tokens

### Border Width

```javascript
const borderWidth = {
  0: '0px',
  DEFAULT: '1px',
  2: '2px',
  4: '4px',
  8: '8px',
};
```

### Border Radius

```javascript
const borderRadius = {
  none: '0px',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};
```

## Shadow Tokens

```javascript
const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  
  // Glass morphism shadows
  glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.27)',
  'glass-lg': '0 16px 64px 0 rgba(0, 0, 0, 0.47)',
  
  // Colored shadows
  primary: '0 10px 40px -10px rgba(77, 171, 247, 0.5)',
  success: '0 10px 40px -10px rgba(34, 197, 94, 0.5)',
  error: '0 10px 40px -10px rgba(239, 68, 68, 0.5)',
};
```

## Animation Tokens

### Duration

```javascript
const duration = {
  instant: '0ms',
  faster: '50ms',
  fast: '100ms',
  normal: '200ms',
  slow: '300ms',
  slower: '400ms',
  slowest: '500ms',
};
```

### Easing

```javascript
const easing = {
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};
```

### Transitions

```javascript
const transitions = {
  all: `all ${duration.normal} ${easing.out}`,
  colors: `color ${duration.normal} ${easing.out}, background-color ${duration.normal} ${easing.out}, border-color ${duration.normal} ${easing.out}`,
  opacity: `opacity ${duration.normal} ${easing.out}`,
  shadow: `box-shadow ${duration.normal} ${easing.out}`,
  transform: `transform ${duration.normal} ${easing.out}`,
};
```

## Z-Index Tokens

```javascript
const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};
```

## Breakpoint Tokens

```javascript
const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
};

const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
  '3xl': `@media (min-width: ${breakpoints['3xl']})`,
  
  // Special queries
  touch: '@media (hover: none) and (pointer: coarse)',
  mouse: '@media (hover: hover) and (pointer: fine)',
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
  dark: '@media (prefers-color-scheme: dark)',
  light: '@media (prefers-color-scheme: light)',
};
```

## Token Usage Guide

### Naming Convention

Tokens follow a consistent naming pattern:
```
{category}-{property}-{variant}-{state}
```

Examples:
- `color-primary-500`
- `spacing-4`
- `shadow-glass-lg`
- `text-body-small`

### Token Categories

1. **Primitive Tokens**: Raw values (colors, sizes)
2. **Semantic Tokens**: Purpose-based values (background-primary, text-secondary)
3. **Component Tokens**: Component-specific values (button-padding, card-shadow)

### Token Application Priority

1. Use semantic tokens over primitive tokens
2. Use component tokens for component-specific styles
3. Fall back to primitive tokens when needed

## Token Implementation

### CSS Custom Properties

```css
:root {
  /* Colors */
  --color-primary-50: #eff6ff;
  --color-primary-500: #4dabf7;
  --color-primary-900: #1e3a8a;
  
  /* Backgrounds */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  
  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-display: 'Poppins', system-ui, sans-serif;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-glass: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  
  /* Animation */
  --duration-normal: 200ms;
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
}
```

### JavaScript/TypeScript Tokens

```typescript
// tokens/index.ts
export const tokens = {
  colors,
  backgrounds,
  textColors,
  borderColors,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,
  textStyles,
  spacing,
  borderWidth,
  borderRadius,
  shadows,
  duration,
  easing,
  transitions,
  zIndex,
  breakpoints,
  mediaQueries,
};

// Usage in components
import { tokens } from '@/tokens';

const StyledComponent = styled.div`
  color: ${tokens.textColors.primary};
  padding: ${tokens.spacing[4]};
  box-shadow: ${tokens.shadows.glass};
  transition: ${tokens.transitions.all};
`;
```

### Tailwind Integration

```javascript
// tailwind.config.js
const { tokens } = require('./src/tokens');

module.exports = {
  theme: {
    extend: {
      colors: tokens.colors,
      spacing: tokens.spacing,
      fontFamily: tokens.fontFamilies,
      fontSize: tokens.fontSizes,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.shadows,
      transitionDuration: tokens.duration,
      transitionTimingFunction: tokens.easing,
      zIndex: tokens.zIndex,
    },
  },
};
```

### Design Token Updates

When updating tokens:
1. Update the source token file
2. Run build process to generate CSS/JS outputs
3. Update documentation
4. Communicate changes to team

### Token Validation

```typescript
// Validate token usage in CI/CD
const validateTokens = (cssString: string) => {
  const hardcodedColors = cssString.match(/#[0-9a-f]{3,6}/gi);
  const hardcodedSpacing = cssString.match(/\d+px/g);
  
  if (hardcodedColors || hardcodedSpacing) {
    console.warn('Hardcoded values detected. Use design tokens instead.');
  }
};
```

## Best Practices

### Do's
- ✅ Use semantic tokens for consistency
- ✅ Create new tokens for repeated values
- ✅ Document token purpose and usage
- ✅ Keep token names descriptive
- ✅ Version control token changes

### Don'ts
- ❌ Hardcode values that should be tokens
- ❌ Create tokens for one-off values
- ❌ Mix token systems
- ❌ Override token values locally
- ❌ Use magic numbers

---

**Note**: Design tokens are the foundation of the Spectra AI design system. Consistent use of these tokens ensures visual coherence and makes global design changes manageable.
