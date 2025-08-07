import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the type for our theme context
interface ThemeContextType {
  currentTheme: 'dark' | 'light' | 'custom';
  backgroundVariant: 'default' | 'gradient1' | 'gradient2' | 'solid' | 'landing';
  colorTheme: 'slate' | 'green' | 'blue' | 'purple' | 'pink' | 'yellow';
  setCurrentTheme: (theme: 'dark' | 'light' | 'custom') => void;
  setBackgroundVariant: (variant: 'default' | 'gradient1' | 'gradient2' | 'solid' | 'landing') => void;
  setColorTheme: (theme: 'slate' | 'green' | 'blue' | 'purple' | 'pink' | 'yellow') => void;
}

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light' | 'custom'>('dark');
  const [backgroundVariant, setBackgroundVariant] = useState<'default' | 'gradient1' | 'gradient2' | 'solid' | 'landing'>('default');
  const [colorTheme, setColorTheme] = useState<'slate' | 'green' | 'blue' | 'purple' | 'pink' | 'yellow'>('slate');

  return (
    <ThemeContext.Provider 
      value={{ 
        currentTheme, 
        backgroundVariant, 
        colorTheme,
        setCurrentTheme, 
        setBackgroundVariant,
        setColorTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
