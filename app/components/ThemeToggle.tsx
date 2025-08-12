'use client';

import { useTheme } from './ThemeProvider';
import { useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' },
  ] as const;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-all duration-200 ${
          isDarkMode
            ? 'bg-gray-800 hover:bg-gray-700 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
        aria-label="Toggle theme"
      >
        {theme === 'light' && '☀️'}
        {theme === 'dark' && '🌙'}
        {theme === 'system' && '💻'}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-20 ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <div className="py-1">
              {themes.map((themeOption) => (
                <button
                  key={themeOption.value}
                  onClick={() => {
                    setTheme(themeOption.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left flex items-center space-x-3 transition-colors duration-200 ${
                    theme === themeOption.value
                      ? isDarkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{themeOption.icon}</span>
                  <span>{themeOption.label}</span>
                  {theme === themeOption.value && (
                    <span className="ml-auto">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
