'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setSystemTheme: () => void;
  getThemeMode: () => 'system' | 'dark' | 'light';
  mounted: boolean;
  isTransitioning: boolean;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Apply theme to document with smooth transition
  const applyTheme = useCallback((isDark: boolean) => {
    // Add transition class for smooth change
    document.documentElement.classList.add('theme-transitioning');
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Remove transition class after animation
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 300);
  }, []);

  // Enhanced theme toggle with loading state
  const toggleTheme = useCallback((isDark: boolean) => {
    setIsTransitioning(true);
    setIsDarkMode(isDark);
    localStorage.setItem('darkMode', isDark.toString());
    
    // Apply theme with smooth transition
    applyTheme(isDark);
    
    // Dispatch custom event for all components to listen
    const customEvent = new CustomEvent('darkModeChange', { 
      detail: { isDark, timestamp: Date.now() },
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(customEvent);
    
    // Clear transition state after animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [applyTheme]);

  useEffect(() => {
    // Only run on client side to prevent hydration mismatch
    if (typeof window === 'undefined') return;
    
    setMounted(true);
    
    // Initialize theme from the layout script or localStorage
    const initialTheme = (window as any).__INITIAL_THEME__;
    if (initialTheme !== undefined) {
      setIsDarkMode(initialTheme);
      applyTheme(initialTheme);
    } else {
      // Fallback to localStorage and system preference
      const savedMode = localStorage.getItem('darkMode');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const expectedMode = savedMode !== null ? savedMode === 'true' : prefersDark;
      setIsDarkMode(expectedMode);
      applyTheme(expectedMode);
    }

    // Listen for theme changes from other tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'darkMode' && event.newValue !== null) {
        const newMode = event.newValue === 'true';
        setIsDarkMode(newMode);
        applyTheme(newMode);
      }
    };

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (event: MediaQueryListEvent) => {
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode === null) {
        setIsDarkMode(event.matches);
        applyTheme(event.matches);
      }
    };

    // Listen for custom dark mode events
    const handleDarkModeChange = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.isDark === 'boolean') {
        setIsDarkMode(event.detail.isDark);
        applyTheme(event.detail.isDark);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    mediaQuery.addEventListener('change', handleSystemChange);
    window.addEventListener('darkModeChange', handleDarkModeChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      mediaQuery.removeEventListener('change', handleSystemChange);
      window.removeEventListener('darkModeChange', handleDarkModeChange as EventListener);
    };
  }, [applyTheme]);

  const toggleDarkMode = useCallback(() => {
    toggleTheme(!isDarkMode);
  }, [isDarkMode, toggleTheme]);

  const setSystemTheme = useCallback(() => {
    localStorage.removeItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    toggleTheme(prefersDark);
  }, [toggleTheme]);

  const getThemeMode = useCallback(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === null) return 'system';
    return savedMode === 'true' ? 'dark' : 'light';
  }, []);

  return (
    <DarkModeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        setSystemTheme,
        getThemeMode,
        mounted,
        isTransitioning
      }}
    >
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
}
