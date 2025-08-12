# Layout, Grid & Spacing - Spectra AI

This document defines the spatial system, grid layouts, and spacing guidelines for Spectra AI to ensure consistent and harmonious designs across all interfaces.

## Table of Contents

1. [Spacing System](#spacing-system)
2. [Grid System](#grid-system)
3. [Layout Patterns](#layout-patterns)
4. [Responsive Design](#responsive-design)
5. [Container System](#container-system)
6. [Component Spacing](#component-spacing)
7. [Practical Examples](#practical-examples)
8. [Implementation Guide](#implementation-guide)

## Spacing System

### Base Unit
Spectra AI uses an 8-point spacing system as the foundation for all spatial relationships.

```
Base unit: 8px
```

### Spacing Scale

```javascript
const spacing = {
  0: '0px',      // 0
  0.5: '4px',    // 0.5 × 8
  1: '8px',      // 1 × 8
  1.5: '12px',   // 1.5 × 8
  2: '16px',     // 2 × 8
  3: '24px',     // 3 × 8
  4: '32px',     // 4 × 8
  5: '40px',     // 5 × 8
  6: '48px',     // 6 × 8
  7: '56px',     // 7 × 8
  8: '64px',     // 8 × 8
  9: '72px',     // 9 × 8
  10: '80px',    // 10 × 8
  12: '96px',    // 12 × 8
  16: '128px',   // 16 × 8
  20: '160px',   // 20 × 8
  24: '192px',   // 24 × 8
  32: '256px',   // 32 × 8
};
```

### Spacing Categories

#### Micro Spacing (4-16px)
Used for:
- Text line height adjustments
- Icon to text spacing
- Form field padding
- Button internal padding

#### Small Spacing (24-32px)
Used for:
- Space between related elements
- Card internal padding
- Section spacing within components

#### Medium Spacing (40-64px)
Used for:
- Space between unrelated elements
- Component margins
- Section breaks

#### Large Spacing (80px+)
Used for:
- Page sections
- Hero areas
- Major content divisions

### Visual Spacing Guide

```
┌─────────────────────────────────────┐
│  Micro (4-16px)                     │
│  ┌───┐ ┌───┐  Element spacing      │
│  └───┘ └───┘                        │
│                                     │
│  Small (24-32px)                   │
│  ┌─────────┐                        │
│  │ Section │  Related groups        │
│  └─────────┘                        │
│                                     │
│  Medium (40-64px)                   │
│  ┌─────────────┐                    │
│  │             │  Components        │
│  └─────────────┘                    │
│                                     │
│  Large (80px+)                      │
│  ┌─────────────────┐                │
│  │                 │  Page sections │
│  └─────────────────┘                │
└─────────────────────────────────────┘
```

## Grid System

### Desktop Grid (≥1024px)

```
Columns: 12
Gutter: 24px
Margin: 24px
Max width: 1536px
```

```
│←──── 24px ────→│←─ Column ─→│← 24px →│←─ Column ─→│← 24px →│
├────────────────┼────────────┼────────┼────────────┼────────┤
│     Margin     │      1     │ Gutter │      2     │ Gutter │...
```

### Tablet Grid (768px-1023px)

```
Columns: 8
Gutter: 20px
Margin: 20px
```

### Mobile Grid (<768px)

```
Columns: 4
Gutter: 16px
Margin: 16px
```

### Grid Visualization

```
Desktop (12 columns)
┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐
│1│2│3│4│5│6│7│8│9│0│1│2│
└─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘

Tablet (8 columns)
┌───┬───┬───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │
└───┴───┴───┴───┴───┴───┴───┴───┘

Mobile (4 columns)
┌───────┬───────┬───────┬───────┐
│   1   │   2   │   3   │   4   │
└───────┴───────┴───────┴───────┘
```

### Column Spans

Common column span patterns:

```
Full width:      12 columns (desktop), 8 (tablet), 4 (mobile)
Half width:      6 columns (desktop), 4 (tablet), 4 (mobile)
Third width:     4 columns (desktop), 8 (tablet), 4 (mobile)
Quarter width:   3 columns (desktop), 2 (tablet), 2 (mobile)
Sidebar:         3 columns (desktop), 2 (tablet), hidden (mobile)
Main content:    9 columns (desktop), 6 (tablet), 4 (mobile)
```

## Layout Patterns

### 1. Single Column Layout
```
┌────────────────────────────┐
│                            │
│      Content (8 cols)      │
│                            │
└────────────────────────────┘
```
Use for: Reading-focused content, forms, settings

### 2. Two Column Layout
```
┌─────────────┬──────────────┐
│             │              │
│  Main (8)   │  Side (4)    │
│             │              │
└─────────────┴──────────────┘
```
Use for: Content with sidebar, dashboard with details

### 3. Three Column Layout
```
┌──────┬──────────────┬──────┐
│      │              │      │
│ (3)  │   Main (6)   │ (3)  │
│      │              │      │
└──────┴──────────────┴──────┘
```
Use for: Advanced interfaces, triple panel views

### 4. Grid Layout
```
┌──────┬──────┬──────┬──────┐
│  3   │  3   │  3   │  3   │
├──────┼──────┼──────┼──────┤
│  3   │  3   │  3   │  3   │
└──────┴──────┴──────┴──────┘
```
Use for: Card grids, galleries, dashboards

### 5. Asymmetric Layout
```
┌──────────────┬─────────────┐
│              │ ┌─────────┐ │
│   Main (7)   │ │ Card    │ │
│              │ └─────────┘ │
│              │ ┌─────────┐ │
│              │ │ Card    │ │
│              │ └─────────┘ │
└──────────────┴─────────────┘
```
Use for: Blog layouts, detail pages

## Responsive Design

### Breakpoints

```javascript
const breakpoints = {
  mobile: '0px',      // 0-767px
  tablet: '768px',    // 768-1023px
  desktop: '1024px',  // 1024-1535px
  wide: '1536px'      // 1536px+
};
```

### Responsive Spacing

| Element | Mobile | Tablet | Desktop | Wide |
|---------|--------|---------|---------|------|
| Page margin | 16px | 20px | 24px | auto |
| Section padding | 32px | 48px | 64px | 80px |
| Component gap | 16px | 20px | 24px | 24px |
| Card padding | 16px | 20px | 24px | 32px |

### Responsive Type Scale

| Element | Mobile | Tablet | Desktop |
|---------|--------|---------|---------|
| H1 | 28px | 36px | 48px |
| H2 | 24px | 28px | 36px |
| H3 | 20px | 24px | 28px |
| Body | 14px | 16px | 16px |
| Small | 12px | 14px | 14px |

## Container System

### Container Types

#### 1. Full Width Container
```css
.container-full {
  width: 100%;
  padding-left: var(--page-margin);
  padding-right: var(--page-margin);
}
```

#### 2. Max Width Container
```css
.container {
  max-width: 1536px;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--page-margin);
  padding-right: var(--page-margin);
}
```

#### 3. Content Container
```css
.container-content {
  max-width: 720px; /* Optimal reading width */
  margin-left: auto;
  margin-right: auto;
}
```

#### 4. Narrow Container
```css
.container-narrow {
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}
```

### Container Padding System

```css
:root {
  --container-padding-mobile: 16px;
  --container-padding-tablet: 20px;
  --container-padding-desktop: 24px;
}

/* Responsive padding */
.container {
  padding-left: var(--container-padding-mobile);
  padding-right: var(--container-padding-mobile);
  
  @media (min-width: 768px) {
    padding-left: var(--container-padding-tablet);
    padding-right: var(--container-padding-tablet);
  }
  
  @media (min-width: 1024px) {
    padding-left: var(--container-padding-desktop);
    padding-right: var(--container-padding-desktop);
  }
}
```

## Component Spacing

### Card Component
```
┌─────────────────────────────┐
│         padding: 24px       │
│  ┌───────────────────────┐  │
│  │    margin-bottom:     │  │ 
│  │       16px            │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │    Content area       │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### Form Layout
```
Label
└─ margin-bottom: 8px
Input Field
└─ margin-bottom: 16px
Label
└─ margin-bottom: 8px
Input Field
└─ margin-bottom: 24px
[Submit Button]
```

### Navigation Spacing
```
Logo | margin-right: 40px | Nav Item | gap: 32px | Nav Item | margin-left: auto | User Menu
```

### Button Group Spacing
```
[Primary] gap: 16px [Secondary] gap: 16px [Tertiary]
```

## Practical Examples

### Dashboard Layout

```css
/* Grid container */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
  margin-bottom: 48px;
}

/* KPI Cards - 3 columns each */
.kpi-card {
  grid-column: span 3;
}

/* Charts - different spans */
.chart-large {
  grid-column: span 8;
}

.chart-small {
  grid-column: span 4;
}

/* Responsive */
@media (max-width: 1023px) {
  .kpi-card {
    grid-column: span 6;
  }
  
  .chart-large,
  .chart-small {
    grid-column: span 12;
  }
}

@media (max-width: 767px) {
  .kpi-card {
    grid-column: span 12;
  }
}
```

### PDF Viewer Layout

```css
.pdf-viewer {
  display: grid;
  grid-template-columns: 200px 1fr 320px;
  gap: 0;
  height: 100vh;
}

.thumbnails-panel {
  padding: 16px;
  border-right: 1px solid var(--border-color);
}

.pdf-canvas {
  padding: 24px;
  overflow: auto;
}

.ai-panel {
  padding: 20px;
  border-left: 1px solid var(--border-color);
}

/* Collapsible panels */
.thumbnails-panel.collapsed {
  width: 0;
  padding: 0;
  overflow: hidden;
}
```

### Library Grid

```css
.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  padding: 24px;
}

.pdf-card {
  aspect-ratio: 3/4;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.pdf-thumbnail {
  flex: 1;
  margin-bottom: 12px;
}

.pdf-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
```

### Form Layout

```css
.form-container {
  max-width: 480px;
  margin: 0 auto;
  padding: 32px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 4px;
}

.form-help {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 32px;
}
```

## Implementation Guide

### Using CSS Grid

```css
/* Basic 12-column grid */
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
}

/* Responsive grid with auto-fit */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

/* Nested grids */
.parent-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
}

.nested-grid {
  grid-column: span 8;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 16px;
}
```

### Using Flexbox

```css
/* Flex container with gap */
.flex-container {
  display: flex;
  gap: 24px;
  align-items: center;
}

/* Responsive flex */
.flex-responsive {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.flex-item {
  flex: 1 1 300px; /* grow, shrink, basis */
}
```

### Spacing Utilities

```css
/* Margin utilities */
.mt-0 { margin-top: 0; }
.mt-1 { margin-top: 8px; }
.mt-2 { margin-top: 16px; }
.mt-3 { margin-top: 24px; }
.mt-4 { margin-top: 32px; }
.mt-6 { margin-top: 48px; }
.mt-8 { margin-top: 64px; }

/* Padding utilities */
.p-0 { padding: 0; }
.p-2 { padding: 16px; }
.p-3 { padding: 24px; }
.p-4 { padding: 32px; }
.p-6 { padding: 48px; }

/* Gap utilities */
.gap-1 { gap: 8px; }
.gap-2 { gap: 16px; }
.gap-3 { gap: 24px; }
.gap-4 { gap: 32px; }
```

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        '18': '4.5rem',  // 72px
        '88': '22rem',   // 352px
        '128': '32rem',  // 512px
      },
      gridTemplateColumns: {
        '16': 'repeat(16, minmax(0, 1fr))',
        'auto-280': 'repeat(auto-fit, minmax(280px, 1fr))',
        'auto-320': 'repeat(auto-fit, minmax(320px, 1fr))',
      },
      gap: {
        '18': '4.5rem',
        '22': '5.5rem',
      }
    }
  }
}
```

### CSS Custom Properties

```css
:root {
  /* Spacing scale */
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-5: 40px;
  --space-6: 48px;
  --space-8: 64px;
  --space-10: 80px;
  
  /* Grid variables */
  --grid-columns: 12;
  --grid-gap: 24px;
  --grid-margin: 24px;
  
  /* Container widths */
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1536px;
  
  /* Component spacing */
  --card-padding: var(--space-3);
  --section-padding: var(--space-8);
  --page-margin: var(--space-3);
}

/* Responsive overrides */
@media (max-width: 767px) {
  :root {
    --grid-gap: 16px;
    --grid-margin: 16px;
    --card-padding: var(--space-2);
    --section-padding: var(--space-4);
    --page-margin: var(--space-2);
  }
}
```

## Best Practices

### Do's
- ✅ Use the 8px grid consistently
- ✅ Maintain visual hierarchy through spacing
- ✅ Use larger spacing for unrelated elements
- ✅ Keep consistent spacing within component groups
- ✅ Test layouts at all breakpoints
- ✅ Use CSS Grid for 2D layouts
- ✅ Use Flexbox for 1D layouts

### Don'ts
- ❌ Use arbitrary spacing values
- ❌ Mix spacing systems
- ❌ Ignore responsive spacing needs
- ❌ Over-compress mobile layouts
- ❌ Use margins for component spacing (use gap)
- ❌ Nest grids unnecessarily
- ❌ Fight the grid system

---

**Note**: This spacing and grid system ensures visual consistency and harmony across all Spectra AI interfaces. Always refer to these guidelines when implementing layouts and spacing in the application.
