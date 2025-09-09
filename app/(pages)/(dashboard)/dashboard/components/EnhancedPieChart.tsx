'use client';

import React, { useState, useEffect } from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';

interface EnhancedPieChartProps {
  title: string;
  data: {
    Dying: number;
    Printing: number;
    not_set: number;
  };
  loading?: boolean;
  showFilters?: boolean;
}

export default function EnhancedPieChart({ 
  title,
  data, 
  loading = false,
  showFilters = true
}: EnhancedPieChartProps) {
  const { isDarkMode } = useDarkMode();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [animationProgress, setAnimationProgress] = useState(0);

  const total = data.Dying + data.Printing + data.not_set;
  
  // Calculate percentages
  const dyingPercentage = total > 0 ? (data.Dying / total) * 100 : 0;
  const printingPercentage = total > 0 ? (data.Printing / total) * 100 : 0;
  const notSetPercentage = total > 0 ? (data.not_set / total) * 100 : 0;

  // Calculate the circumference of the circle (2 * π * radius)
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  // Animate the chart on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(1);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Calculate the stroke-dasharray for each segment with animation
  const dyingStrokeDasharray = `${(dyingPercentage / 100) * circumference * animationProgress} ${circumference}`;
  const printingStrokeDasharray = `${(printingPercentage / 100) * circumference * animationProgress} ${circumference}`;
  const notSetStrokeDasharray = `${(notSetPercentage / 100) * circumference * animationProgress} ${circumference}`;

  // Calculate the offset for each segment
  const printingStrokeDashoffset = -((dyingPercentage / 100) * circumference * animationProgress);
  const notSetStrokeDashoffset = -(((dyingPercentage + printingPercentage) / 100) * circumference * animationProgress);

  if (loading) {
    return (
      <div className={`p-6 rounded-xl border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } shadow-lg`}>
        <div className="animate-pulse">
          <div className={`h-6 w-32 mb-4 rounded ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}></div>
          <div className="flex items-center justify-center">
            <div className={`w-32 h-32 rounded-full ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
          </div>
          <div className="mt-4 space-y-2">
            <div className={`h-4 w-24 rounded ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
            <div className={`h-4 w-20 rounded ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl border transition-all duration-500 hover:shadow-xl ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-gray-600' 
        : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-gray-300'
    } shadow-lg`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-bold ${
          isDarkMode ? 'text-gray-100' : 'text-gray-800'
        }`}>
          {title}
        </h3>
        
        {showFilters && (
          <div className="relative">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className={`text-sm px-3 py-2 rounded-lg border transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="all">All Types</option>
              <option value="Dying">Dying Only</option>
              <option value="Printing">Printing Only</option>
            </select>
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-center">
        {/* Enhanced Pie Chart */}
        <div className="relative w-32 h-32 mb-6">
          <svg
            className="w-32 h-32 transform -rotate-90 drop-shadow-lg"
            viewBox="0 0 140 140"
          >
            {/* Background circle with gradient */}
            <defs>
              <linearGradient id="dyingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
              <linearGradient id="printingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id="notSetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6b7280" />
                <stop offset="100%" stopColor="#4b5563" />
              </linearGradient>
            </defs>
            
            {/* Background circle */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={isDarkMode ? '#374151' : '#e5e7eb'}
              strokeWidth="8"
              className="opacity-30"
            />
            
            {/* Dying segment with gradient */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="url(#dyingGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={dyingStrokeDasharray}
              className="transition-all duration-1000 ease-out drop-shadow-sm"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3))'
              }}
            />
            
            {/* Printing segment with gradient */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="url(#printingGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={printingStrokeDasharray}
              strokeDashoffset={printingStrokeDashoffset}
              className="transition-all duration-1000 ease-out drop-shadow-sm"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))'
              }}
            />
            
            {/* Not Set segment with gradient */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="url(#notSetGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={notSetStrokeDasharray}
              strokeDashoffset={notSetStrokeDashoffset}
              className="transition-all duration-1000 ease-out drop-shadow-sm"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(107, 114, 128, 0.3))'
              }}
            />
          </svg>
          
          {/* Enhanced center text with animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center transform transition-all duration-500 hover:scale-110">
              <div className={`text-3xl font-bold transition-all duration-500 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                {total}
              </div>
              <div className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Total Orders
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Legend */}
        <div className="space-y-3 w-full">
          <div className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-opacity-50 ${
            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full mr-3 shadow-sm"></div>
              <span className={`text-sm font-semibold ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Dying
              </span>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${
                isDarkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                {data.Dying}
              </div>
              <div className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {dyingPercentage.toFixed(0)}%
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-opacity-50 ${
            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-3 shadow-sm"></div>
              <span className={`text-sm font-semibold ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Printing
              </span>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${
                isDarkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                {data.Printing}
              </div>
              <div className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {printingPercentage.toFixed(0)}%
              </div>
            </div>
          </div>
          
          {data.not_set > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-opacity-50 ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full mr-3 shadow-sm"></div>
                <span className={`text-sm font-semibold ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Not Set
                </span>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  {data.not_set}
                </div>
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {notSetPercentage.toFixed(0)}%
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
