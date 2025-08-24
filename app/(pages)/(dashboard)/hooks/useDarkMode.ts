'use client';

import { useState, useEffect } from 'react';

interface DarkModeReturn {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setSystemTheme: () => void;
  getThemeMode: () => 'system' | 'dark' | 'light';
  mounted: boolean;
  getDarkModeState: (defaultValue?: boolean) => boolean;
}

export function useDarkMode(): DarkModeReturn {
  // Initialize with a function to prevent hydration mismatch
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Check if we're on the client side
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode !== null) {
        return savedMode === 'true';
      }
      // Default to system preference to prevent flash
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    // Server-side default (will be updated on mount)
    return false;
  });
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    
    // Only update if the initial state doesn't match the current state
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let shouldUpdate = false;
    let newMode = isDarkMode;
    
    if (savedMode !== null) {
      newMode = savedMode === 'true';
      shouldUpdate = newMode !== isDarkMode;
    } else {
      newMode = prefersDark;
      shouldUpdate = newMode !== isDarkMode;
    }
    
    if (shouldUpdate) {
      setIsDarkMode(newMode);
    }

    // Listen for custom dark mode change events
    const handleDarkModeChange = (event: CustomEvent) => {
      setIsDarkMode(event.detail);
    };

    // Listen for storage changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'darkMode') {
        setIsDarkMode(event.newValue === 'true');
      }
    };

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (event: MediaQueryListEvent) => {
      // Only update if user hasn't set a manual preference
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode === null) {
        setIsDarkMode(event.matches);
      }
    };

    window.addEventListener('darkModeChange', handleDarkModeChange as EventListener);
    window.addEventListener('storage', handleStorageChange);
    mediaQuery.addEventListener('change', handleSystemChange);

    return () => {
      window.removeEventListener('darkModeChange', handleDarkModeChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    
    // Dispatch custom event
    const event = new CustomEvent('darkModeChange', { 
      detail: newMode,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
  };

  const setSystemTheme = () => {
    localStorage.removeItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    
    // Dispatch custom event
    const event = new CustomEvent('darkModeChange', { 
      detail: prefersDark,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
  };

  const getThemeMode = () => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === null) return 'system';
    return savedMode === 'true' ? 'dark' : 'light';
  };

  // Helper function to safely get dark mode state
  const getDarkModeState = (defaultValue: boolean = false) => {
    return mounted ? isDarkMode : defaultValue;
  };

  // Return mounted state to prevent hydration mismatches
  return { 
    isDarkMode, 
    toggleDarkMode, 
    setSystemTheme, 
    getThemeMode, 
    mounted,
    getDarkModeState 
  };
}
