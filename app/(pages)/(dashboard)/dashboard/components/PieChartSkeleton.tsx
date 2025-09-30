'use client';

import React from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';

const PieChartSkeleton: React.FC = () => {
  const { isDarkMode } = useDarkMode();

  return (
    <div className={`rounded-xl border shadow-lg p-6 animate-pulse ${
      isDarkMode 
        ? 'bg-slate-800/90 border-slate-600 shadow-slate-900/50 backdrop-blur-sm' 
        : 'bg-white/90 border-gray-200 shadow-gray-200/50 backdrop-blur-sm'
    }`}>
      {/* Title skeleton */}
      <div className={`h-6 w-48 rounded mb-6 mx-auto ${
        isDarkMode ? 'bg-slate-700' : 'bg-gray-300'
      }`}></div>
      
      {/* Pie chart skeleton */}
      <div className="h-96 w-full flex items-center justify-center mb-6">
        <div className={`w-64 h-64 rounded-full ${
          isDarkMode ? 'bg-slate-700' : 'bg-gray-300'
        }`}></div>
      </div>
      
      {/* Breakdown skeleton */}
      <div className="grid grid-cols-1 gap-4">
        <div className={`flex items-center justify-between p-4 rounded-lg ${
          isDarkMode 
            ? 'bg-slate-700/50 border border-slate-600' 
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full ${
              isDarkMode ? 'bg-slate-600' : 'bg-gray-400'
            }`}></div>
            <div className={`h-5 w-16 rounded ${
              isDarkMode ? 'bg-slate-600' : 'bg-gray-400'
            }`}></div>
          </div>
          <div className="text-right">
            <div className={`h-8 w-12 rounded mb-1 ${
              isDarkMode ? 'bg-slate-600' : 'bg-gray-400'
            }`}></div>
            <div className={`h-4 w-8 rounded ${
              isDarkMode ? 'bg-slate-600' : 'bg-gray-400'
            }`}></div>
          </div>
        </div>
        
        <div className={`flex items-center justify-between p-4 rounded-lg ${
          isDarkMode 
            ? 'bg-slate-700/50 border border-slate-600' 
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full ${
              isDarkMode ? 'bg-slate-600' : 'bg-gray-400'
            }`}></div>
            <div className={`h-5 w-20 rounded ${
              isDarkMode ? 'bg-slate-600' : 'bg-gray-400'
            }`}></div>
          </div>
          <div className="text-right">
            <div className={`h-8 w-8 rounded mb-1 ${
              isDarkMode ? 'bg-slate-600' : 'bg-gray-400'
            }`}></div>
            <div className={`h-4 w-8 rounded ${
              isDarkMode ? 'bg-slate-600' : 'bg-gray-400'
            }`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PieChartSkeleton;
