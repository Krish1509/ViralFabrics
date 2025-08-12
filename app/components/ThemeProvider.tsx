'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    
    // Remove existing classes
    root.classList.remove('light', 'dark');
    
    let shouldBeDark = false;
    
    if (theme === 'system') {
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      shouldBeDark = theme === 'dark';
    }
    
    setIsDarkMode(shouldBeDark);
    
    if (shouldBeDark) {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    // Dispatch custom event for other components
    const event = new CustomEvent('darkModeChange', { 
      detail: shouldBeDark,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
    
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemChange = (event: MediaQueryListEvent) => {
      if (theme === 'system') {
        setIsDarkMode(event.matches);
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        if (event.matches) {
          root.classList.add('dark');
        } else {
          root.classList.add('light');
        }
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, [theme, mounted]);

  const value = {
    theme,
    setTheme,
    isDarkMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
