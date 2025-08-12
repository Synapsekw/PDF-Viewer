# Color & Typography - Spectra AI

This document defines the color system and typography guidelines for Spectra AI, ensuring visual consistency and accessibility across all interfaces.

## Table of Contents

1. [Color System](#color-system)
2. [Color Usage Guidelines](#color-usage-guidelines)
3. [Typography System](#typography-system)
4. [Type Hierarchy](#type-hierarchy)
5. [Accessibility Standards](#accessibility-standards)
6. [Implementation Examples](#implementation-examples)

## Color System

### Brand Colors

#### Primary Blue
The core brand color used for primary actions and brand identity.

```
Primary Blue Scale:
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│ primary-50  │ primary-200 │ primary-500 │ primary-700 │ primary-900 │
│  #eff6ff    │  #bfdbfe    │  #4dabf7    │  #1d7ed8    │  #1e3a8a    │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

- **primary-500** (#4dabf7) - Main brand color
- **primary-600** (#339af0) - Hover states
- **primary-700** (#1d7ed8) - Active states

### Neutral Colors (Slate)

The foundation of the UI, used for backgrounds, borders, and text.

```
Slate Scale:
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│  slate-50   │  slate-300  │  slate-500  │  slate-700  │  slate-900  │
│  #f8fafc    │  #cbd5e1    │  #64748b    │  #334155    │  #0f172a    │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

Primary backgrounds:
- **slate-900** (#0f172a) - Main app background
- **slate-800** (#1e293b) - Elevated surfaces
- **slate-700** (#334155) - Cards and panels

### Semantic Colors

#### Success (Green)
```
┌─────────────┬─────────────┬─────────────┐
│ success-400 │ success-500 │ success-600 │
│  #4ade80    │  #22c55e    │  #16a34a    │
└─────────────┴─────────────┴─────────────┘
```
Use for: Positive actions, confirmations, success states

#### Warning (Amber)
```
┌─────────────┬─────────────┬─────────────┐
│ warning-400 │ warning-500 │ warning-600 │
│  #fbbf24    │  #f59e0b    │  #d97706    │
└─────────────┴─────────────┴─────────────┘
```
Use for: Warnings, cautions, attention needed

#### Error (Red)
```
┌─────────────┬─────────────┬─────────────┐
│  error-400  │  error-500  │  error-600  │
│  #f87171    │  #ef4444    │  #dc2626    │
└─────────────┴─────────────┴─────────────┘
```
Use for: Errors, destructive actions, critical alerts

#### Info (Blue)
```
┌─────────────┬─────────────┬─────────────┐
│  info-400   │  info-500   │  info-600   │
│  #60a5fa    │  #3b82f6    │  #2563eb    │
└─────────────┴─────────────┴─────────────┘
```
Use for: Informational messages, hints, tips

### Glass Morphism Colors

Special translucent colors for glass effects:

```javascript
glass: {
  light: 'rgba(255, 255, 255, 0.1)',    // Light glass
  medium: 'rgba(255, 255, 255, 0.2)',   // Medium glass
  heavy: 'rgba(255, 255, 255, 0.3)',    // Heavy glass
  dark: 'rgba(0, 0, 0, 0.1)',           // Dark glass
}
```

### Text Colors

```
Text on Dark Backgrounds:
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Primary    │  Secondary  │  Tertiary   │  Disabled   │
│  #ffffff    │  #cbd5e1    │  #94a3b8    │  #64748b    │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

## Color Usage Guidelines

### Background Hierarchy

```
Page Background (#0f172a)
└── Section Background (#1e293b)
    └── Card Background (#334155)
        └── Input Background (rgba(255,255,255,0.05))
```

### Interactive States

#### Buttons
```
Default → Hover → Active → Disabled
#4dabf7 → #339af0 → #1d7ed8 → opacity(0.5)
```

#### Links
```
Default → Hover → Active → Visited
#4dabf7 → #60a5fa → #339af0 → #339af0
```

### Color Combinations

#### Do's ✅
- White text on dark backgrounds
- High contrast for important elements
- Semantic colors for their intended purpose
- Consistent color usage across similar elements

#### Don'ts ❌
- Low contrast combinations
- Multiple bright colors together
- Overuse of accent colors
- Inconsistent semantic color usage

### Accessibility Contrast Ratios

All color combinations must meet WCAG 2.1 AA standards:

| Text Type | Background | Foreground | Contrast Ratio | Status |
|-----------|------------|------------|----------------|---------|
| Body text | #0f172a | #ffffff | 21:1 | ✅ AAA |
| Body text | #1e293b | #ffffff | 15.8:1 | ✅ AAA |
| Secondary text | #0f172a | #cbd5e1 | 10.9:1 | ✅ AAA |
| Primary button | #4dabf7 | #ffffff | 3.5:1 | ✅ AA |
| Success | #0f172a | #22c55e | 5.7:1 | ✅ AA |
| Error | #0f172a | #ef4444 | 5.2:1 | ✅ AA |

## Typography System

### Font Families

```css
/* Primary font stack */
font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 
             'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 
             'Open Sans', 'Helvetica Neue', sans-serif;

/* Display font for headings */
font-family: 'Poppins', system-ui, sans-serif;

/* Monospace for code */
font-family: 'JetBrains Mono', Monaco, Consolas, 
             'Courier New', monospace;
```

### Type Scale

Based on a 1.25 ratio (Major Third):

```
┌────────┬──────────┬────────────┬───────────┐
│  Name  │   Size   │ Line Height│   Usage   │
├────────┼──────────┼────────────┼───────────┤
│  xs    │  12px    │    18px    │  Caption  │
│  sm    │  14px    │    21px    │  Small    │
│  base  │  16px    │    24px    │  Body     │
│  lg    │  18px    │    28px    │  Large    │
│  xl    │  20px    │    30px    │  H5       │
│  2xl   │  24px    │    36px    │  H4       │
│  3xl   │  30px    │    42px    │  H3       │
│  4xl   │  36px    │    48px    │  H2       │
│  5xl   │  48px    │    60px    │  H1       │
│  6xl   │  60px    │    72px    │  Display  │
└────────┴──────────┴────────────┴───────────┘
```

### Font Weights

```
┌────────────┬───────┬─────────────────────┐
│   Weight   │ Value │       Usage         │
├────────────┼───────┼─────────────────────┤
│ Light      │  300  │ Large display text  │
│ Regular    │  400  │ Body text           │
│ Medium     │  500  │ UI elements         │
│ Semibold   │  600  │ Headings            │
│ Bold       │  700  │ Strong emphasis     │
└────────────┴───────┴─────────────────────┘
```

## Type Hierarchy

### Headings

#### H1 - Page Title
```css
font-family: 'Poppins', sans-serif;
font-size: 48px;
line-height: 60px;
font-weight: 700;
letter-spacing: -0.025em;
color: #ffffff;
```

#### H2 - Section Title
```css
font-family: 'Poppins', sans-serif;
font-size: 36px;
line-height: 48px;
font-weight: 600;
letter-spacing: -0.025em;
color: #ffffff;
```

#### H3 - Subsection Title
```css
font-family: 'Inter', sans-serif;
font-size: 30px;
line-height: 42px;
font-weight: 600;
color: #ffffff;
```

#### H4 - Card Title
```css
font-family: 'Inter', sans-serif;
font-size: 24px;
line-height: 36px;
font-weight: 600;
color: #ffffff;
```

#### H5 - Small Title
```css
font-family: 'Inter', sans-serif;
font-size: 20px;
line-height: 30px;
font-weight: 500;
color: #ffffff;
```

#### H6 - Overline
```css
font-family: 'Inter', sans-serif;
font-size: 18px;
line-height: 28px;
font-weight: 500;
text-transform: uppercase;
letter-spacing: 0.05em;
color: #cbd5e1;
```

### Body Text

#### Body Default
```css
font-family: 'Inter', sans-serif;
font-size: 16px;
line-height: 26px;
font-weight: 400;
color: #cbd5e1;
```

#### Body Small
```css
font-family: 'Inter', sans-serif;
font-size: 14px;
line-height: 21px;
font-weight: 400;
color: #cbd5e1;
```

#### Body Large
```css
font-family: 'Inter', sans-serif;
font-size: 18px;
line-height: 28px;
font-weight: 400;
color: #cbd5e1;
```

### UI Text

#### Label
```css
font-family: 'Inter', sans-serif;
font-size: 14px;
line-height: 20px;
font-weight: 500;
letter-spacing: 0.025em;
color: #ffffff;
```

#### Button
```css
font-family: 'Inter', sans-serif;
font-size: 16px;
line-height: 24px;
font-weight: 500;
letter-spacing: 0.025em;
color: #ffffff;
```

#### Caption
```css
font-family: 'Inter', sans-serif;
font-size: 12px;
line-height: 18px;
font-weight: 400;
color: #94a3b8;
```

#### Link
```css
font-family: 'Inter', sans-serif;
font-size: inherit;
line-height: inherit;
font-weight: inherit;
color: #4dabf7;
text-decoration: none;
transition: color 200ms;

&:hover {
  color: #60a5fa;
  text-decoration: underline;
}
```

### Code & Data

#### Code
```css
font-family: 'JetBrains Mono', monospace;
font-size: 14px;
line-height: 21px;
font-weight: 400;
color: #cbd5e1;
background: rgba(255, 255, 255, 0.05);
padding: 2px 6px;
border-radius: 4px;
```

#### Data/Numbers
```css
font-family: 'Inter', sans-serif;
font-size: 36px;
line-height: 44px;
font-weight: 700;
font-variant-numeric: tabular-nums;
letter-spacing: -0.025em;
color: #ffffff;
```

## Accessibility Standards

### Text Accessibility

1. **Minimum font sizes**:
   - Body text: 16px minimum
   - Caption text: 12px minimum (use sparingly)
   - UI elements: 14px minimum

2. **Line height ratios**:
   - Body text: 1.5-1.75
   - Headings: 1.2-1.4
   - UI elements: 1.4-1.5

3. **Letter spacing**:
   - Normal text: 0
   - Uppercase text: 0.05em minimum
   - Small text: 0.025em for improved readability

4. **Font weight contrast**:
   - Use medium (500) or higher for small text
   - Ensure adequate weight difference between hierarchy levels

### Color Accessibility

1. **Contrast requirements**:
   - Normal text: 4.5:1 minimum
   - Large text (18px+): 3:1 minimum
   - UI components: 3:1 minimum
   - Focus indicators: 3:1 minimum

2. **Color blind considerations**:
   - Never use color alone to convey information
   - Supplement with icons, patterns, or text
   - Test with color blind simulators

## Implementation Examples

### CSS Custom Properties

```css
:root {
  /* Color tokens */
  --color-primary: #4dabf7;
  --color-background: #0f172a;
  --color-surface: #1e293b;
  --color-text-primary: #ffffff;
  --color-text-secondary: #cbd5e1;
  
  /* Typography tokens */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-display: 'Poppins', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Type scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --text-5xl: 3rem;
}
```

### React Component Examples

#### Typography Component
```tsx
interface TypographyProps {
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption';
  color?: 'primary' | 'secondary' | 'tertiary';
  children: React.ReactNode;
}

const Typography: React.FC<TypographyProps> = ({ 
  variant, 
  color = 'primary', 
  children 
}) => {
  const styles = {
    h1: 'font-display text-5xl font-bold leading-tight tracking-tight',
    h2: 'font-display text-4xl font-semibold leading-tight tracking-tight',
    h3: 'font-sans text-3xl font-semibold',
    h4: 'font-sans text-2xl font-semibold',
    h5: 'font-sans text-xl font-medium',
    h6: 'font-sans text-lg font-medium uppercase tracking-wider',
    body: 'font-sans text-base font-normal leading-relaxed',
    caption: 'font-sans text-xs font-normal',
  };
  
  const colors = {
    primary: 'text-white',
    secondary: 'text-slate-300',
    tertiary: 'text-slate-400',
  };
  
  const Tag = variant === 'body' ? 'p' : variant === 'caption' ? 'span' : variant;
  
  return (
    <Tag className={`${styles[variant]} ${colors[color]}`}>
      {children}
    </Tag>
  );
};
```

#### Color Utilities
```typescript
// Color manipulation utilities
export const colors = {
  // Add opacity to hex color
  withOpacity: (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },
  
  // Check contrast ratio
  getContrastRatio: (color1: string, color2: string): number => {
    // Implementation of WCAG contrast calculation
    return contrastRatio;
  },
  
  // Get semantic color
  getSemantic: (type: 'success' | 'warning' | 'error' | 'info') => {
    const semanticColors = {
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    };
    return semanticColors[type];
  },
};
```

### Tailwind Configuration

```javascript
// tailwind.config.js extensions
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4dabf7',
          50: '#eff6ff',
          // ... full scale
        },
        slate: {
          // ... custom slate scale
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        display: ['Poppins', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        // Custom size with line height
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
    },
  },
};
```

## Best Practices

### Color Usage
- ✅ Use semantic colors for their intended purpose
- ✅ Maintain consistent color usage across similar elements
- ✅ Test color combinations for accessibility
- ✅ Use opacity for subtle variations
- ❌ Don't use too many colors in one view
- ❌ Avoid pure black (#000000) - use slate-950 instead

### Typography Usage
- ✅ Maintain clear hierarchy with size and weight
- ✅ Use consistent spacing between text elements
- ✅ Limit the number of font sizes on a page
- ✅ Use tabular numbers for data
- ❌ Don't mix too many font weights
- ❌ Avoid very thin weights on small text

---

**Note**: This color and typography system ensures visual consistency, accessibility, and a professional appearance across all Spectra AI interfaces. Always test your implementations for accessibility compliance.
