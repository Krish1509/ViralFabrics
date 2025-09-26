'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface DarkModeReturn {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setSystemTheme: () => void;
  getThemeMode: () => 'system' | 'dark' | 'light';
  mounted: boolean;
  getDarkModeState: (defaultValue?: boolean) => boolean;
  themeSwitchRef: React.RefObject<HTMLButtonElement | null>;
}

export function useDarkMode(): DarkModeReturn {
  // Initialize with a safe default to prevent hydration mismatch
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const themeSwitchRef = useRef<HTMLButtonElement | null>(null);

  // Simple theme toggle function
  const toggleTheme = useCallback((isDark: boolean) => {
    setIsDarkMode(isDark);
    localStorage.setItem('darkMode', isDark.toString());
    
    // Apply theme to document
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Dispatch custom event for consistency
    const customEvent = new CustomEvent('darkModeChange', { 
      detail: isDark,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(customEvent);
  }, []);

  useEffect(() => {
    // Only run on client side to prevent hydration mismatch
    if (typeof window === 'undefined') return;
    
    setMounted(true);
    
    // Initialize theme from the layout script or localStorage
    const initialTheme = (window as any).__INITIAL_THEME__;
    if (initialTheme !== undefined) {
      setIsDarkMode(initialTheme);
      // Apply theme immediately
      if (initialTheme) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // Fallback to localStorage and system preference
      const savedMode = localStorage.getItem('darkMode');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const expectedMode = savedMode !== null ? savedMode === 'true' : prefersDark;
      setIsDarkMode(expectedMode);
      // Apply theme immediately
      if (expectedMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // Optimized event listeners with passive option
    const handleDarkModeChange = (event: CustomEvent) => {
      setIsDarkMode(event.detail);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'darkMode') {
        setIsDarkMode(event.newValue === 'true');
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (event: MediaQueryListEvent) => {
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode === null) {
        setIsDarkMode(event.matches);
      }
    };

    // Use passive listeners for better performance
    window.addEventListener('darkModeChange', handleDarkModeChange as EventListener, { passive: true });
    window.addEventListener('storage', handleStorageChange, { passive: true });
    mediaQuery.addEventListener('change', handleSystemChange, { passive: true });

    return () => {
      window.removeEventListener('darkModeChange', handleDarkModeChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, []);

  // Memoized toggle function for better performance
  const toggleDarkMode = useCallback(() => {
    // Toggle the theme
    toggleTheme(!isDarkMode);
  }, [isDarkMode, toggleTheme]);

  const setSystemTheme = useCallback(() => {
    localStorage.removeItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply system theme
    toggleTheme(prefersDark);
  }, [toggleTheme]);

  const getThemeMode = useCallback(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === null) return 'system';
    return savedMode === 'true' ? 'dark' : 'light';
  }, []);

  const getDarkModeState = useCallback((defaultValue: boolean = false) => {
    // Always return the defaultValue during SSR to prevent hydration mismatch
    if (typeof window === 'undefined') return defaultValue;
    return mounted ? isDarkMode : defaultValue;
  }, [mounted, isDarkMode]);

  return { 
    isDarkMode, 
    toggleDarkMode, 
    setSystemTheme, 
    getThemeMode, 
    mounted,
    getDarkModeState,
    themeSwitchRef
  };
}
