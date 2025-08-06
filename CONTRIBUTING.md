# Contributing to PDF Viewer

This document outlines how to contribute to the PDF Viewer project, with special focus on developing new analytics plugins and feature overlays.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Plugin Development](#plugin-development)
- [Creating Analytics Plugins](#creating-analytics-plugins)
- [Creating Feature Overlays](#creating-feature-overlays)
- [Best Practices](#best-practices)
- [Testing](#testing)
- [Submission Guidelines](#submission-guidelines)

## Architecture Overview

The PDF Viewer follows a clean separation architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PDF Engine    │    │   Context APIs   │    │    Plugins      │
│                 │    │                  │    │                 │
│ • PDF.js Core   │◄──►│ • PdfContext     │◄──►│ • Analytics     │
│ • Canvas Render │    │ • AnalyticsCtx   │    │ • Overlays      │
│ • Page Logic    │    │ • Event System   │    │ • Tools         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Core Principles

1. **No Direct PDF Engine Access**: Plugins must never directly modify PDF.js or the rendering engine
2. **Context-Based Communication**: All interaction happens through React contexts
3. **Event-Driven Architecture**: Use event systems for inter-plugin communication
4. **Portal-Based Overlays**: Use React portals for UI overlays to avoid DOM interference

## Plugin Development

### Plugin Structure

Every plugin follows this structure:

```typescript
// src/features/your-plugin/YourPlugin.tsx
import React from 'react';
import { PdfFeatureProps, PdfFeatureComponent } from '../../pdf/types';
import { usePdf } from '../../pdf/PdfContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';

/**
 * Your plugin component implementation
 */
const YourPluginComponent: React.FC<PdfFeatureProps> = ({ 
  canvasRef, 
  containerRef 
}) => {
  const { currentPage, scale, rotation } = usePdf();
  const { recordInteraction } = useAnalytics();

  // Your plugin logic here
  
  return (
    <FeatureOverlay canvasRef={canvasRef} containerRef={containerRef}>
      {/* Your overlay content */}
    </FeatureOverlay>
  );
};

/**
 * Plugin configuration object
 */
export const YourPlugin: PdfFeatureComponent = {
  displayName: 'YourPlugin',
  Component: YourPluginComponent,
  config: {
    // Plugin-specific configuration
  },
};

export default YourPlugin;
```

### Plugin Registration

1. Create your plugin in `src/features/your-plugin/`
2. Add it to the plugin registry in `src/plugins/index.ts`:

```typescript
import { YourPlugin } from '../features/your-plugin/YourPlugin';

export const AVAILABLE_PLUGINS: PluginConfig[] = [
  // ... existing plugins
  {
    id: 'your-plugin',
    name: 'Your Plugin',
    description: 'What your plugin does',
    enabled: true,
    priority: 10,
    component: YourPlugin,
    config: {
      // Default configuration
    },
  },
];
```

## Creating Analytics Plugins

Analytics plugins track user behavior and integrate with the analytics system.

### Example: Click Tracker Plugin

```typescript
// src/features/analytics/ClickTracker.tsx
import React, { useEffect } from 'react';
import { PdfFeatureProps } from '../../pdf/types';
import { useAnalytics } from '../../contexts/AnalyticsContext';

const ClickTrackerComponent: React.FC<PdfFeatureProps> = ({ 
  canvasRef,
  containerRef 
}) => {
  const { recordInteraction } = useAnalytics();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      recordInteraction({
        type: 'click',
        details: { x, y, button: event.button }
      });
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [canvasRef, recordInteraction]);

  // No visual component needed for this analytics plugin
  return null;
};

export const ClickTracker: PdfFeatureComponent = {
  displayName: 'ClickTracker',
  Component: ClickTrackerComponent,
};
```

### Analytics Best Practices

1. **Use Throttling**: Avoid recording too many events (e.g., mouse movements)
2. **Include Context**: Always include relevant context (page number, coordinates, etc.)
3. **Respect Privacy**: Be transparent about what data is collected
4. **Optimize Performance**: Use debouncing and efficient event handling

```typescript
// Example: Throttled scroll tracking
const useThrottledScroll = (callback: (data: any) => void, delay: number) => {
  const lastCallTime = useRef(0);
  
  return useCallback((event: Event) => {
    const now = Date.now();
    if (now - lastCallTime.current > delay) {
      callback({ scrollY: window.scrollY, timestamp: now });
      lastCallTime.current = now;
    }
  }, [callback, delay]);
};
```

## Creating Feature Overlays

Feature overlays provide visual enhancements on top of the PDF.

### Example: Annotation Overlay

```typescript
// src/features/annotations/AnnotationOverlay.tsx
import React, { useState } from 'react';
import { FeatureOverlay } from '../base/FeatureOverlay';
import { PdfFeatureProps } from '../../pdf/types';
import { usePdf } from '../../pdf/PdfContext';

const AnnotationOverlayComponent: React.FC<PdfFeatureProps> = ({
  canvasRef,
  containerRef
}) => {
  const { currentPage } = usePdf();
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const handleCanvasClick = (event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Add new annotation
    const newAnnotation = {
      id: Date.now(),
      page: currentPage,
      x,
      y,
      text: 'New annotation'
    };

    setAnnotations(prev => [...prev, newAnnotation]);
  };

  return (
    <FeatureOverlay 
      canvasRef={canvasRef} 
      containerRef={containerRef}
      zIndex={10}
    >
      {/* Invisible click handler */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'auto'
        }}
        onClick={handleCanvasClick}
      />
      
      {/* Render annotations for current page */}
      {annotations
        .filter(ann => ann.page === currentPage)
        .map(annotation => (
          <div
            key={annotation.id}
            style={{
              position: 'absolute',
              left: annotation.x,
              top: annotation.y,
              background: 'yellow',
              padding: '4px',
              fontSize: '12px',
              pointerEvents: 'auto'
            }}
          >
            {annotation.text}
          </div>
        ))}
    </FeatureOverlay>
  );
};

export const AnnotationOverlay: PdfFeatureComponent = {
  displayName: 'AnnotationOverlay',
  Component: AnnotationOverlayComponent,
};
```

### Overlay Best Practices

1. **Use FeatureOverlay**: Always wrap your overlay content in the `FeatureOverlay` component
2. **Manage Z-Index**: Use appropriate z-index values to layer overlays correctly
3. **Handle Pointer Events**: Use `pointerEvents: 'none'` for non-interactive overlays
4. **Responsive Positioning**: Use percentage-based or canvas-relative positioning
5. **Performance**: Minimize re-renders and use React.memo for expensive components

## Best Practices

### Performance

1. **Lazy Loading**: Load plugins only when needed
2. **Memoization**: Use React.memo and useMemo for expensive calculations
3. **Event Debouncing**: Throttle high-frequency events
4. **Cleanup**: Always remove event listeners in useEffect cleanup

### TypeScript

1. **Strong Typing**: Define interfaces for all plugin data structures
2. **JSDoc Comments**: Document all public interfaces and methods
3. **Generic Types**: Use generics for reusable plugin components

### Plugin Development

1. **Component Structure**: Always include a `displayName` in your `PdfFeatureComponent`
   ```typescript
   export const MyPlugin: PdfFeatureComponent = {
     displayName: 'MyPlugin', // Required - must be unique
     Component: MyPluginComponent,
     config: { /* optional config */ }
   };
   ```

2. **React Strict Mode**: Handle duplicate registrations gracefully
   - Components may render twice in development mode
   - Use refs to prevent duplicate initialization
   - The FeatureRegistry automatically handles re-registrations

3. **Performance Optimization**: Use built-in utilities for high-frequency events
   ```typescript
   import { throttle, debounce, sample } from '../../utils/performance';
   
   const throttledHandler = throttle(handleMouseMove, 50);
   const debouncedSave = debounce(saveData, 300);
   const sampledTracker = sample(trackEvent, 0.1); // 10% sampling
   ```

4. **Memory Management**: 
   - Use `CircularBuffer` for large datasets
   - Monitor memory usage with performance monitor (Ctrl+Shift+P)
   - Implement proper cleanup in useEffect returns

### Error Handling

```typescript
const SafePluginWrapper: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <ErrorBoundary fallback={<div>Plugin failed to load</div>}>
      {children}
    </ErrorBoundary>
  );
};
```

### State Management

1. **Local State**: Use useState for plugin-specific state
2. **Global State**: Use contexts for shared state
3. **Persistence**: Use localStorage for user preferences

### Accessibility

1. **ARIA Labels**: Add appropriate ARIA labels to interactive elements
2. **Keyboard Support**: Ensure keyboard navigation works
3. **Screen Readers**: Test with screen reader software

## Testing

### Unit Tests

```typescript
// src/features/your-plugin/__tests__/YourPlugin.test.tsx
import { render, screen } from '@testing-library/react';
import { PdfProvider } from '../../../pdf/PdfContext';
import { AnalyticsProvider } from '../../../contexts/AnalyticsContext';
import { YourPlugin } from '../YourPlugin';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PdfProvider>
    <AnalyticsProvider>
      {children}
    </AnalyticsProvider>
  </PdfProvider>
);

describe('YourPlugin', () => {
  it('renders without crashing', () => {
    const canvasRef = { current: document.createElement('canvas') };
    const containerRef = { current: document.createElement('div') };

    render(
      <TestWrapper>
        <YourPlugin.Component 
          canvasRef={canvasRef} 
          containerRef={containerRef} 
        />
      </TestWrapper>
    );
    
    // Your assertions here
  });
});
```

### Integration Tests

Test plugin integration with the main application:

```typescript
// Test plugin registration
describe('Plugin Registration', () => {
  it('registers plugin successfully', () => {
    FeatureRegistry.register(YourPlugin);
    expect(FeatureRegistry.hasFeature('YourPlugin')).toBe(true);
  });
});
```

## Submission Guidelines

### Code Review Checklist

- [ ] Plugin follows architecture principles
- [ ] TypeScript types are properly defined
- [ ] JSDoc comments are included
- [ ] Tests are included and passing
- [ ] No direct PDF engine modifications
- [ ] Proper error handling implemented
- [ ] Performance considerations addressed
- [ ] Accessibility features included

### Pull Request Template

```markdown
## Plugin Description
Brief description of what your plugin does.

## Type of Change
- [ ] New analytics plugin
- [ ] New feature overlay
- [ ] Enhancement to existing plugin
- [ ] Bug fix

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Documentation
- [ ] JSDoc comments added
- [ ] README updated (if applicable)
- [ ] Examples provided

## Performance Impact
Describe any performance considerations.

## Breaking Changes
List any breaking changes.
```

### Code Standards

1. **Linting**: Code must pass ESLint and TypeScript checks
2. **Formatting**: Use Prettier for consistent formatting
3. **Naming**: Use descriptive names for variables and functions
4. **Comments**: Include meaningful comments for complex logic

## Examples

### Complete Plugin Examples

1. **Mouse Heatmap**: `src/features/analytics/MouseHeatmap.tsx`
2. **Analytics Overlay**: `src/features/analytics/AnalyticsOverlay.tsx`
3. **Snipping Tool**: `src/features/snipping/SnippingTool.tsx`
4. **Export Panel**: `src/features/export/ExportPanel.tsx`

### Common Plugin Patterns

#### Canvas Interaction Plugin

```typescript
const useCanvasInteraction = (canvasRef: RefObject<HTMLCanvasElement>) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    return () => canvas.removeEventListener('mousemove', handleMouseMove);
  }, [canvasRef]);

  return position;
};
```

#### PDF Context Integration

```typescript
const usePdfData = () => {
  const { currentPage, totalPages, scale, rotation } = usePdf();
  
  return {
    pageInfo: `${currentPage} of ${totalPages}`,
    zoomLevel: `${Math.round(scale * 100)}%`,
    rotationAngle: `${rotation}°`,
  };
};
```

## Support

For questions or help with plugin development:

1. Check existing plugin implementations
2. Review the TypeScript interfaces
3. Ask in GitHub discussions
4. Submit detailed GitHub issues

Happy coding! 🚀