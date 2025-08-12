# Motion and Interactions - Spectra AI

This document defines the animation and interaction guidelines for Spectra AI, ensuring smooth, purposeful, and delightful user experiences.

## Table of Contents

1. [Motion Principles](#motion-principles)
2. [Animation Timing](#animation-timing)
3. [Easing Functions](#easing-functions)
4. [Micro-interactions](#micro-interactions)
5. [Page Transitions](#page-transitions)
6. [Component Animations](#component-animations)
7. [Loading Animations](#loading-animations)
8. [Gesture Interactions](#gesture-interactions)
9. [Performance Guidelines](#performance-guidelines)

## Motion Principles

### 1. Purposeful
Every animation should have a clear purpose:
- **Guide attention**: Direct users to important changes
- **Show relationships**: Connect elements spatially
- **Provide feedback**: Confirm user actions
- **Create delight**: Enhance emotional connection

### 2. Natural
Animations should feel natural and physics-based:
- **Acceleration/Deceleration**: Nothing moves at constant speed
- **Overshooting**: Subtle bounce for playful elements
- **Momentum**: Heavy elements move slower
- **Hierarchy**: Important elements animate first

### 3. Subtle
Less is more:
- **Duration**: Keep animations brief (200-400ms)
- **Distance**: Minimize movement distance
- **Complexity**: Simple is better than elaborate
- **Consistency**: Similar actions have similar animations

### 4. Performant
Animations must not hinder usability:
- **60 FPS**: Maintain smooth frame rate
- **GPU acceleration**: Use transform and opacity
- **Progressive enhancement**: Core functionality without animation
- **Reduce motion**: Respect user preferences

## Animation Timing

### Standard Durations

```javascript
const durations = {
  instant: '0ms',      // No animation
  fast: '100ms',       // Micro-interactions
  normal: '200ms',     // Most UI feedback
  slow: '300ms',       // Page transitions
  slower: '400ms',     // Complex animations
  slowest: '600ms'     // Only for special cases
};
```

### Duration by Distance

| Distance | Duration | Use Case |
|----------|----------|----------|
| < 100px | 100-200ms | Hover effects, small transitions |
| 100-300px | 200-300ms | Modal slides, drawer opens |
| 300-500px | 300-400ms | Page transitions |
| > 500px | 400-600ms | Full screen transitions |

### Stagger Timing

When animating multiple elements:
```javascript
const stagger = {
  subtle: '20ms',    // List items
  normal: '50ms',    // Cards in grid
  dramatic: '100ms'  // Feature reveals
};
```

## Easing Functions

### Core Easing Curves

```css
:root {
  /* Default - Most UI animations */
  --ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
  
  /* Entrances - Elements entering view */
  --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
  
  /* Exits - Elements leaving view */
  --ease-in: cubic-bezier(0.4, 0.0, 1, 1);
  
  /* Both ways - Continuous animations */
  --ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1);
  
  /* Bounce - Playful feedback */
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Usage Guidelines

1. **Ease-out** (default): Most animations
   - Entering elements
   - Opening modals
   - Expanding panels

2. **Ease-in**: Quick exits
   - Closing dialogs
   - Dismissing notifications
   - Collapsing elements

3. **Ease-in-out**: Continuous motion
   - Loading spinners
   - Progress bars
   - Slider transitions

4. **Ease-bounce**: Attention & delight
   - Success states
   - Feature highlights
   - Playful interactions

## Micro-interactions

### Button Interactions

```css
/* Hover */
.button {
  transition: all 200ms ease-out;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Click */
.button:active {
  transform: translateY(0);
  transition-duration: 100ms;
}
```

### Card Hover Effects

```css
.card {
  transition: all 300ms ease-out;
}

.card:hover {
  transform: scale(1.02);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

/* With tilt effect */
.card-3d:hover {
  transform: scale(1.02) rotateX(-5deg);
}
```

### Input Focus

```css
.input {
  transition: all 200ms ease-out;
}

.input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.2);
}
```

### Icon Animations

```css
/* Rotation */
.icon-refresh {
  transition: transform 300ms ease-out;
}

.icon-refresh:hover {
  transform: rotate(180deg);
}

/* Scale bounce */
@keyframes icon-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.icon-heart.liked {
  animation: icon-bounce 300ms ease-out;
}
```

## Page Transitions

### Route Transitions

```javascript
// Framer Motion page transition
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  in: {
    opacity: 1,
    y: 0
  },
  out: {
    opacity: 0,
    y: -20
  }
};

const pageTransition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.3
};
```

### Shared Element Transitions

For elements that persist across pages:
```css
.shared-element {
  view-transition-name: shared-element;
}

::view-transition-old(shared-element) {
  animation: 300ms ease-out fade-out;
}

::view-transition-new(shared-element) {
  animation: 300ms ease-out fade-in;
}
```

## Component Animations

### Modal/Dialog

```css
/* Backdrop fade */
.modal-backdrop {
  animation: fade-in 200ms ease-out;
}

/* Content slide up */
.modal-content {
  animation: slide-up 300ms ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Drawer/Sidebar

```css
/* Slide from left */
.drawer-left {
  transform: translateX(-100%);
  transition: transform 300ms ease-out;
}

.drawer-left.open {
  transform: translateX(0);
}

/* With bounce */
.drawer-bounce {
  transition: transform 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Dropdown/Select

```css
.dropdown-content {
  transform-origin: top center;
  animation: dropdown-open 200ms ease-out;
}

@keyframes dropdown-open {
  from {
    opacity: 0;
    transform: scaleY(0.8);
  }
  to {
    opacity: 1;
    transform: scaleY(1);
  }
}
```

### Toast Notifications

```css
.toast {
  animation: toast-in 300ms ease-out;
}

.toast.exiting {
  animation: toast-out 200ms ease-in;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(100%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### Accordion/Collapse

```javascript
// Height animation with dynamic content
const collapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
};
```

## Loading Animations

### Skeleton Loading

```css
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1) 25%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.1) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### Spinner

```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}

/* With fade in */
.spinner-container {
  animation: fade-in 200ms ease-out;
}
```

### Progress Bar

```css
.progress-bar {
  transition: width 300ms ease-out;
}

/* Indeterminate */
@keyframes progress-indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}

.progress-indeterminate::after {
  animation: progress-indeterminate 1.5s ease-in-out infinite;
}
```

### Content Reveal

```css
/* Staggered list items */
.list-item {
  opacity: 0;
  transform: translateY(20px);
  animation: reveal 300ms ease-out forwards;
}

.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 50ms; }
.list-item:nth-child(3) { animation-delay: 100ms; }

@keyframes reveal {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Gesture Interactions

### Touch Feedback

```css
/* Ripple effect */
.ripple {
  position: relative;
  overflow: hidden;
}

.ripple::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0);
  animation: ripple 600ms ease-out;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
```

### Swipe Gestures

```javascript
// Swipe to dismiss
const swipeAnimation = {
  x: { 
    duration: 0.3,
    ease: "easeOut"
  },
  opacity: {
    duration: 0.2
  }
};
```

### Pinch to Zoom

```css
.zoomable {
  transition: transform 200ms ease-out;
}

.zoomable.zooming {
  transition: none; /* Disable during gesture */
}
```

### Drag and Drop

```css
.draggable {
  transition: transform 200ms ease-out;
}

.draggable.dragging {
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: none;
}

.drop-zone.active {
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    border-color: rgba(77, 171, 247, 0.4);
  }
  50% {
    border-color: rgba(77, 171, 247, 0.8);
  }
}
```

## Performance Guidelines

### Best Practices

1. **Use CSS transforms and opacity**
   ```css
   /* Good - GPU accelerated */
   .element {
     transform: translateX(100px);
     opacity: 0.5;
   }
   
   /* Avoid - Triggers reflow */
   .element {
     left: 100px;
     width: 200px;
   }
   ```

2. **Will-change for heavy animations**
   ```css
   .heavy-animation {
     will-change: transform, opacity;
   }
   
   /* Remove after animation */
   .heavy-animation.done {
     will-change: auto;
   }
   ```

3. **Use CSS containment**
   ```css
   .animation-container {
     contain: layout style paint;
   }
   ```

4. **Respect prefers-reduced-motion**
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

### Performance Metrics

| Animation Type | Target FPS | Max Duration | Optimization |
|---------------|------------|--------------|--------------|
| Micro-interactions | 60 | 200ms | CSS only |
| Page transitions | 60 | 400ms | GPU layers |
| Data visualizations | 30-60 | 600ms | RequestAnimationFrame |
| Background animations | 30 | Continuous | CSS animations |

### Testing Checklist

- [ ] Maintains 60 FPS on target devices
- [ ] No layout thrashing
- [ ] Animations are interruptible
- [ ] Reduced motion is respected
- [ ] Touch gestures feel responsive
- [ ] No animation queue buildup
- [ ] Memory usage is stable

## Implementation Examples

### React/Framer Motion

```jsx
// Page transition
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  {content}
</motion.div>

// Staggered children
<motion.ul
  initial="hidden"
  animate="visible"
  variants={{
    visible: {
      transition: {
        staggerChildren: 0.05
      }
    }
  }}
>
  {items.map(item => (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    />
  ))}
</motion.ul>
```

### CSS Animations

```css
/* Reusable animation classes */
.fade-in { animation: fade-in 200ms ease-out; }
.slide-up { animation: slide-up 300ms ease-out; }
.scale-in { animation: scale-in 200ms ease-out-back; }
.shake { animation: shake 500ms ease-in-out; }

/* Animation library */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}
```

---

**Note**: All animations should enhance the user experience without becoming a distraction. When in doubt, err on the side of subtlety and always prioritize performance and accessibility.
