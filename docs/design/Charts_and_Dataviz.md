# Charts and Data Visualization - Spectra AI

This document defines the data visualization guidelines for Spectra AI, ensuring clear, accessible, and insightful presentation of analytics data.

## Table of Contents

1. [Visualization Principles](#visualization-principles)
2. [Chart Types](#chart-types)
3. [Color Palette for Data](#color-palette-for-data)
4. [Chart Components](#chart-components)
5. [Interaction Patterns](#interaction-patterns)
6. [Responsive Charts](#responsive-charts)
7. [Accessibility Guidelines](#accessibility-guidelines)
8. [Implementation Examples](#implementation-examples)

## Visualization Principles

### 1. Clarity Over Complexity

**Principle**: Data should tell a story at a glance.

**Guidelines**:
- Remove unnecessary elements (chartjunk)
- Use clear, descriptive labels
- Highlight key insights
- Progressive disclosure for details

### 2. Consistent Visual Language

**Principle**: Similar data should be represented similarly.

**Guidelines**:
- Consistent color usage across charts
- Uniform styling for axes and labels
- Standard interaction patterns
- Predictable layouts

### 3. Accessibility First

**Principle**: Everyone should be able to understand the data.

**Guidelines**:
- Color-blind safe palettes
- Alternative text descriptions
- Keyboard navigation support
- High contrast modes

### 4. Performance Matters

**Principle**: Visualizations should render quickly and smoothly.

**Guidelines**:
- Optimize for large datasets
- Use canvas for complex visualizations
- Implement data sampling when needed
- Lazy load non-critical charts

## Chart Types

### Line Chart
**Use for**: Time series data, trends over time

```
Views Over Time
│
50k├─────────────────────╱╲
40k├──────────────────╱──╲─
30k├───────────────╱─────╲
20k├────────────╱─────────╲
10k├─────────╱─────────────╲
  0└─┬───┬───┬───┬───┬───┬──
    Mon Tue Wed Thu Fri Sat Sun
```

**Best Practices**:
- Maximum 5-7 lines per chart
- Use consistent time intervals
- Show data points on hover
- Enable zoom for dense data

### Bar Chart
**Use for**: Comparing quantities, categorical data

```
Top PDFs by Views
│
Document A ████████████████████ 2,450
Document B ████████████████ 1,980
Document C ████████████ 1,520
Document D ████████ 980
Document E █████ 650
```

**Best Practices**:
- Sort bars by value (usually descending)
- Limit to 10-15 bars
- Use horizontal bars for long labels
- Show exact values on hover

### Area Chart
**Use for**: Cumulative values, part-to-whole over time

```
Cumulative Page Views
│    ╱▓▓▓▓▓▓▓▓▓▓▓▓▓
│   ╱▓▓▓▓▓▓▓▓▓▓▓▓▓▓
│  ╱▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
│ ╱▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
│╱▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
└──────────────────
```

**Best Practices**:
- Use transparency for overlapping areas
- Stack areas for cumulative totals
- Smooth curves for better readability
- Interactive legend to toggle series

### Heatmap
**Use for**: Density data, pattern recognition

```
Page Interaction Heatmap
┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐
│▓│▓│█│█│▓│░│░│░│░│░│ High
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤  ↕
│▓│█│█│█│▓│▓│░│░│░│░│ Low
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│█│█│▓│▓│▓│▓│░│░│░│░│
└─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘
```

**Best Practices**:
- Use sequential color scales
- Provide clear legend
- Show values on hover
- Consider binning for large datasets

### Sparkline
**Use for**: Trend indicators in limited space

```
Last 7 days: ⸺╱╲╱⸺╲
```

**Best Practices**:
- Remove axes and labels
- Focus on trend, not exact values
- Use consistent scale across sparklines
- Subtle styling to not distract

### KPI Card
**Use for**: Single important metrics

```
┌─────────────────┐
│ Total Views     │
│ 45,678         │
│ ↑ 12.5%        │
│ ⸺╱╲╱⸺         │
└─────────────────┘
```

**Components**:
- Large primary value
- Comparison/trend indicator
- Mini sparkline
- Clear label

### Funnel Chart
**Use for**: Conversion rates, drop-off analysis

```
Page Flow Funnel
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100% - Page 1
 ▓▓▓▓▓▓▓▓▓▓▓   73% - Page 2
  ▓▓▓▓▓▓▓     52% - Page 3
   ▓▓▓▓      31% - Page 4
    ▓▓      18% - Complete
```

**Best Practices**:
- Show percentage at each stage
- Highlight biggest drop-offs
- Keep stages to 5-7 maximum
- Interactive tooltips for details

### Pie/Donut Chart
**Use for**: Part-to-whole relationships

```
Document Categories
╭─────────╮
│  25%    │ Technical
│ ╱───╲   │ Marketing
│ 35% 40% │ Sales
╰─────────╯
```

**Best Practices**:
- Maximum 5-6 slices
- Order by size
- Use donut for cleaner look
- Avoid 3D effects

## Color Palette for Data

### Sequential Scales

#### Blue Scale (Default)
```
Light to Dark:
┌────┬────┬────┬────┬────┬────┬────┬────┬────┐
│░░░░│▒▒▒▒│▓▓▓▓│████│████│████│████│████│████│
└────┴────┴────┴────┴────┴────┴────┴────┴────┘
#e0f2fe → #0c4a6e
```

#### Green Scale (Positive)
```
┌────┬────┬────┬────┬────┬────┬────┬────┬────┐
│░░░░│▒▒▒▒│▓▓▓▓│████│████│████│████│████│████│
└────┴────┴────┴────┴────┴────┴────┴────┴────┘
#dcfce7 → #14532d
```

#### Red Scale (Negative)
```
┌────┬────┬────┬────┬────┬────┬────┬────┬────┐
│░░░░│▒▒▒▒│▓▓▓▓│████│████│████│████│████│████│
└────┴────┴────┴────┴────┴────┴────┴────┴────┘
#fee2e2 → #7f1d1d
```

### Categorical Palette

Primary set for distinct categories:
```javascript
const categoricalColors = [
  '#4dabf7', // Blue (Primary)
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#6366f1', // Indigo
];
```

### Diverging Scale

For data with positive/negative values:
```
Negative ← Neutral → Positive
Red ←──── Gray ────→ Green
#ef4444 ← #6b7280 → #22c55e
```

## Chart Components

### Axes

```
Y-Axis Label
│
50k├─ ─ ─ ─ ─ ─ ─ ─ ─ Grid lines (subtle)
   │
40k├─ ─ ─ ─ ─ ─ ─ ─ ─
   │
30k├─ ─ ─ ─ ─ ─ ─ ─ ─
   │
20k├─ ─ ─ ─ ─ ─ ─ ─ ─
   │
10k├─ ─ ─ ─ ─ ─ ─ ─ ─
   │
  0└─────────────────────
    Jan Feb Mar Apr May   X-Axis Label
```

**Styling**:
- Axis lines: 1px, rgba(255,255,255,0.1)
- Grid lines: 1px, rgba(255,255,255,0.05)
- Labels: 12px, #94a3b8
- Ticks: 4px length

### Tooltips

```
┌─────────────────────┐
│ March 15, 2024      │
│ Views: 2,456        │
│ Change: +12.5%      │
└─────────────────────┘
```

**Features**:
- Dark background with blur
- White text for contrast
- Positioned to avoid overflow
- Smooth fade in/out

### Legends

```
Horizontal Legend:
● Series 1  ● Series 2  ● Series 3

Vertical Legend:
┌─────────────┐
│ ● Series 1  │
│ ● Series 2  │
│ ● Series 3  │
└─────────────┘
```

**Interaction**:
- Click to toggle series
- Hover to highlight
- Show/hide all option

### Data Labels

```
Direct labeling (preferred):
────●──── Product A (45%)
───●───── Product B (30%)
──●────── Product C (25%)
```

**Guidelines**:
- Only show for important points
- Avoid overlapping labels
- Use leader lines if needed
- Smart positioning algorithm

## Interaction Patterns

### Hover States

```css
/* Highlight on hover */
.chart-element:hover {
  opacity: 1;
  filter: brightness(1.2);
}

/* Dim others */
.chart-element:not(:hover) {
  opacity: 0.6;
}
```

### Selection

- Click to select/focus
- Shift+click for multiple selection
- Click outside to deselect
- Show selection with outline

### Zoom & Pan

```
Controls:
[↻ Reset] [+ Zoom In] [- Zoom Out]

Gestures:
- Scroll: Zoom
- Drag: Pan
- Pinch: Zoom (touch)
```

### Filtering

```
Time Range: [1D] [1W] [1M] [3M] [1Y] [All]
           
Metrics: ☑ Views ☑ Users ☐ Duration
```

### Drill-down

- Click bar → Show detailed breakdown
- Click point → Show time details
- Breadcrumb navigation for levels

## Responsive Charts

### Breakpoint Behaviors

#### Desktop (>1024px)
- Full features and interactions
- Detailed axes and labels
- Multiple charts side-by-side

#### Tablet (768-1024px)
- Simplified labels
- Touch-optimized interactions
- Stack charts vertically

#### Mobile (<768px)
- Minimal axes
- Larger touch targets
- Swipe between charts
- Simplified visualizations

### Responsive Techniques

```javascript
// Dynamic sizing
const chartWidth = container.clientWidth;
const chartHeight = Math.min(400, chartWidth * 0.6);

// Responsive tick count
const tickCount = chartWidth > 600 ? 10 : 5;

// Conditional features
const showLegend = chartWidth > 400;
const showDataLabels = chartWidth > 600;
```

## Accessibility Guidelines

### Color Accessibility

1. **Don't rely on color alone**
   - Use patterns, labels, or icons
   - Provide text alternatives

2. **Color blind safe palettes**
   ```javascript
   // Avoid problematic combinations
   // ❌ Red/Green only
   // ✅ Blue/Orange/Gray
   ```

3. **Contrast requirements**
   - Text: 4.5:1 minimum
   - Data elements: 3:1 minimum

### Keyboard Navigation

```
Tab: Navigate between elements
Enter/Space: Select/activate
Arrow keys: Navigate within chart
Escape: Exit focus mode
```

### Screen Reader Support

```html
<div role="img" aria-label="Chart showing views over time">
  <table class="sr-only">
    <!-- Data table for screen readers -->
  </table>
  <canvas aria-hidden="true">
    <!-- Visual chart -->
  </canvas>
</div>
```

### Alternative Formats

- Data tables for all charts
- Text descriptions of trends
- Export to accessible formats
- Sonification option (future)

## Implementation Examples

### React Chart Component

```tsx
interface ChartProps {
  data: DataPoint[];
  type: 'line' | 'bar' | 'area';
  height?: number;
  responsive?: boolean;
  accessible?: boolean;
}

const Chart: React.FC<ChartProps> = ({
  data,
  type,
  height = 300,
  responsive = true,
  accessible = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });

  // Responsive sizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: responsive ? 
            Math.min(height, containerRef.current.clientWidth * 0.6) : 
            height,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [height, responsive]);

  return (
    <div ref={containerRef} className="relative">
      {accessible && (
        <ScreenReaderTable data={data} className="sr-only" />
      )}
      <ChartCanvas
        data={data}
        type={type}
        width={dimensions.width}
        height={dimensions.height}
        aria-hidden={accessible}
      />
      <ChartTooltip />
    </div>
  );
};
```

### D3.js Line Chart

```javascript
function createLineChart(data, container) {
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  // Scales
  const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, width]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .nice()
    .range([height, 0]);

  // Line generator
  const line = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX);

  // SVG container
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Grid lines
  g.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale)
      .tickSize(-height)
      .tickFormat(''));

  // Axes
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale));

  g.append('g')
    .call(d3.axisLeft(yScale));

  // Line
  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#4dabf7')
    .attr('stroke-width', 2)
    .attr('d', line);

  // Interactive overlay
  const tooltip = createTooltip(container);
  const overlay = createInteractiveOverlay(g, data, xScale, yScale, tooltip);
}
```

### Chart Configuration

```typescript
// Chart theme configuration
export const chartTheme = {
  colors: {
    primary: '#4dabf7',
    secondary: '#22c55e',
    tertiary: '#f59e0b',
    background: '#0f172a',
    grid: 'rgba(255, 255, 255, 0.05)',
    text: '#94a3b8',
  },
  fonts: {
    family: 'Inter, sans-serif',
    size: {
      label: 12,
      title: 16,
      tooltip: 14,
    },
  },
  spacing: {
    padding: 20,
    barGap: 0.2,
    groupGap: 0.1,
  },
  animation: {
    duration: 300,
    easing: 'easeOutCubic',
  },
};
```

## Best Practices Summary

### Do's
- ✅ Choose the right chart type for your data
- ✅ Remove unnecessary elements
- ✅ Use consistent scales across related charts
- ✅ Provide context with labels and titles
- ✅ Test with real data at different scales
- ✅ Optimize for performance with large datasets
- ✅ Make charts keyboard navigable

### Don'ts
- ❌ Use 3D effects or excessive styling
- ❌ Truncate axes to exaggerate differences
- ❌ Use too many colors in one chart
- ❌ Rely on color alone for meaning
- ❌ Overcrowd with data points
- ❌ Animate without purpose
- ❌ Forget mobile users

---

**Note**: Effective data visualization in Spectra AI helps users understand complex analytics at a glance. Always prioritize clarity, accessibility, and performance when implementing charts and visualizations.
