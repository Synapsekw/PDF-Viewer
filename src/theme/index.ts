// Theme configuration for the PDF Viewer application
// Based on the GlassView AI design

export const colors = {
  // Background colors
  background: {
    primary: '#1c2733', // Dark blue-gray background
    secondary: '#232f3d', // Slightly lighter blue-gray
    tertiary: '#2a3744', // Even lighter blue-gray for cards/panels
    highlight: '#313e4d', // Highlight areas
  },
  
  // Text colors
  text: {
    primary: '#ffffff', // White text
    secondary: '#b0b8c1', // Light gray text
    disabled: '#6c7883', // Darker gray for disabled text
  },
  
  // UI element colors
  ui: {
    accent: '#4dabf7', // Blue accent color
    border: 'rgba(255, 255, 255, 0.1)', // Border color with transparency
    hover: 'rgba(255, 255, 255, 0.1)', // Hover state
    active: 'rgba(77, 171, 247, 0.2)', // Active/selected state
  },
  
  // Button colors
  button: {
    primary: '#4dabf7',
    primaryHover: '#339af0',
    secondary: 'rgba(49, 62, 77, 0.5)',
    secondaryHover: 'rgba(58, 70, 85, 0.7)',
  },
  
  // Status colors
  status: {
    success: '#51cf66',
    warning: '#fcc419',
    error: '#ff6b6b',
    info: '#4dabf7',
  },
  
  // Glassmorphism
  glass: {
    background: 'rgba(35, 47, 61, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)',
    highlight: 'rgba(255, 255, 255, 0.05)',
    shadow: 'rgba(0, 0, 0, 0.2)',
    blur: '10px',
  }
};

export const typography = {
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
  
  // Font sizes
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    md: '1rem',       // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem' // 30px
  },
  
  // Font weights
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  
  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75
  }
};

export const spacing = {
  '0': '0',
  '1': '0.25rem',  // 4px
  '2': '0.5rem',   // 8px
  '3': '0.75rem',  // 12px
  '4': '1rem',     // 16px
  '5': '1.25rem',  // 20px
  '6': '1.5rem',   // 24px
  '8': '2rem',     // 32px
  '10': '2.5rem',  // 40px
  '12': '3rem',    // 48px
  '16': '4rem',    // 64px
  '20': '5rem',    // 80px
  '24': '6rem'     // 96px
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',  // 2px
  md: '0.25rem',   // 4px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  full: '9999px'
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none'
};

export const transitions = {
  default: 'all 0.2s ease',
  fast: 'all 0.1s ease',
  slow: 'all 0.3s ease'
};

export const zIndices = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modal: 1300,
  popover: 1400,
  tooltip: 1500
};

// Breakpoints for responsive design
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Theme object that combines all tokens
const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndices,
  breakpoints
};

export default theme;
