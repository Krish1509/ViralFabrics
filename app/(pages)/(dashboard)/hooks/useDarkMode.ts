'use client';

import { useState, useEffect, useCallback } from 'react';

interface DarkModeReturn {
  isDarkMode: boolean;
  toggleDarkMode: (event?: React.MouseEvent) => void;
  setSystemTheme: (event?: React.MouseEvent) => void;
  getThemeMode: () => 'system' | 'dark' | 'light';
  mounted: boolean;
  getDarkModeState: (defaultValue?: boolean) => boolean;
}

export function useDarkMode(): DarkModeReturn {
  // Initialize with the theme from the optimized script in layout.tsx
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      // Use the initial theme set by the layout script
      return (window as any).__INITIAL_THEME__ ?? false;
    }
    return false;
  });
  
  const [mounted, setMounted] = useState<boolean>(false);



  useEffect(() => {
    setMounted(true);
    
    // Only update if needed (prevents unnecessary re-renders)
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const expectedMode = savedMode !== null ? savedMode === 'true' : prefersDark;
    
    if (expectedMode !== isDarkMode) {
      setIsDarkMode(expectedMode);
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
  }, [isDarkMode]);

  // Memoized toggle function for better performance - now uses fast position-based animation
  const toggleDarkMode = useCallback((event?: React.MouseEvent) => {
    // If we have a click event, create fast animation from button position
    if (event && event.currentTarget) {
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      
      // Create fast animation element at exact button position
      const animationElement = document.createElement('div');
      animationElement.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        background: ${isDarkMode ? '#ffffff' : '#1f2937'};
        border-radius: 8px;
        pointer-events: none;
        z-index: 9999;
        transform: scale(0);
        opacity: 0.8;
        transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      `;
      
      document.body.appendChild(animationElement);
      
      // Trigger fast animation
      requestAnimationFrame(() => {
        const maxDimension = Math.max(window.innerWidth, window.innerHeight) * 1.5;
        animationElement.style.width = `${maxDimension}px`;
        animationElement.style.height = `${maxDimension}px`;
        animationElement.style.top = `${rect.top - (maxDimension - rect.height) / 2}px`;
        animationElement.style.left = `${rect.left - (maxDimension - rect.width) / 2}px`;
        animationElement.style.transform = 'scale(1)';
        animationElement.style.opacity = '0';
      });
      
      // Clean up after animation
      setTimeout(() => {
        if (document.body.contains(animationElement)) {
          document.body.removeChild(animationElement);
        }
      }, 400);
    }
    
    // Toggle theme immediately
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    
    // Dispatch custom event
    const customEvent = new CustomEvent('darkModeChange', { 
      detail: newMode,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(customEvent);
  }, [isDarkMode]);

  const setSystemTheme = useCallback((event?: React.MouseEvent) => {
    localStorage.removeItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Use fast animation for system theme change
    if (prefersDark !== isDarkMode) {
      // If we have a click event, create fast animation from button position
      if (event && event.currentTarget) {
        const button = event.currentTarget as HTMLElement;
        const rect = button.getBoundingClientRect();
        
        // Create fast animation element at exact button position
        const animationElement = document.createElement('div');
        animationElement.style.cssText = `
          position: fixed;
          top: ${rect.top}px;
          left: ${rect.left}px;
          width: ${rect.width}px;
          height: ${rect.height}px;
          background: ${isDarkMode ? '#ffffff' : '#1f2937'};
          border-radius: 8px;
          pointer-events: none;
          z-index: 9999;
          transform: scale(0);
          opacity: 0.8;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        `;
        
        document.body.appendChild(animationElement);
        
        // Trigger fast animation
        requestAnimationFrame(() => {
          const maxDimension = Math.max(window.innerWidth, window.innerHeight) * 1.5;
          animationElement.style.width = `${maxDimension}px`;
          animationElement.style.height = `${maxDimension}px`;
          animationElement.style.top = `${rect.top - (maxDimension - rect.height) / 2}px`;
          animationElement.style.left = `${rect.left - (maxDimension - rect.width) / 2}px`;
          animationElement.style.transform = 'scale(1)';
          animationElement.style.opacity = '0';
        });
        
        // Clean up after animation
        setTimeout(() => {
          if (document.body.contains(animationElement)) {
            document.body.removeChild(animationElement);
          }
        }, 400);
      }
      
      // Set the new theme immediately
      setIsDarkMode(prefersDark);
      localStorage.setItem('darkMode', prefersDark.toString());
      
      // Dispatch custom event
      const customEvent = new CustomEvent('darkModeChange', { 
        detail: prefersDark,
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(customEvent);
    }
  }, [isDarkMode]);

  const getThemeMode = useCallback(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === null) return 'system';
    return savedMode === 'true' ? 'dark' : 'light';
  }, []);

  const getDarkModeState = useCallback((defaultValue: boolean = false) => {
    return mounted ? isDarkMode : defaultValue;
  }, [mounted, isDarkMode]);

  return { 
    isDarkMode, 
    toggleDarkMode, 
    setSystemTheme, 
    getThemeMode, 
    mounted,
    getDarkModeState
  };
}
