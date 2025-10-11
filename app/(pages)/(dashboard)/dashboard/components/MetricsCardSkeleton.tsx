'use client';

import React from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';

const MetricsCardSkeleton: React.FC = () => {
  const { isDarkMode } = useDarkMode();

  return (
    <div className={`rounded-xl border shadow-lg p-6 animate-pulse ${
      isDarkMode 
        ? 'bg-slate-800/90 border-slate-600 shadow-slate-900/50 backdrop-blur-sm' 
        : 'bg-white/90 border-gray-200 shadow-gray-200/50 backdrop-blur-sm'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`h-4 w-24 rounded ${
          isDarkMode ? 'bg-slate-700' : 'bg-gray-300'
        }`}></div>
        <div className={`h-8 w-8 rounded ${
          isDarkMode ? 'bg-slate-700' : 'bg-gray-300'
        }`}></div>
      </div>
      
      <div className={`h-12 w-20 rounded mb-2 ${
        isDarkMode ? 'bg-slate-700' : 'bg-gray-300'
      }`}></div>
      
      <div className={`h-4 w-32 rounded ${
        isDarkMode ? 'bg-slate-700' : 'bg-gray-300'
      }`}></div>
    </div>
  );
};

export default MetricsCardSkeleton;
