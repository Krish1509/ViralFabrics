'use client';

import React, { useState } from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface OrderTypePieChartProps {
  title: string;
  data: {
    Dying: number;
    Printing: number;
    not_set: number;
  };
  loading?: boolean;
  showFilters?: boolean;
}

export default function OrderTypePieChart({ 
  title,
  data, 
  loading = false,
  showFilters = true
}: OrderTypePieChartProps) {
  const { isDarkMode } = useDarkMode();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const total = data.Dying + data.Printing + data.not_set;
  
  // Calculate percentages
  const dyingPercentage = total > 0 ? (data.Dying / total) * 100 : 0;
  const printingPercentage = total > 0 ? (data.Printing / total) * 100 : 0;
  const notSetPercentage = total > 0 ? (data.not_set / total) * 100 : 0;

  // Calculate the circumference of the circle (2 * π * radius)
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  // Calculate the stroke-dasharray for each segment
  const dyingStrokeDasharray = `${(dyingPercentage / 100) * circumference} ${circumference}`;
  const printingStrokeDasharray = `${(printingPercentage / 100) * circumference} ${circumference}`;
  const notSetStrokeDasharray = `${(notSetPercentage / 100) * circumference} ${circumference}`;

  // Calculate the offset for each segment
  const printingStrokeDashoffset = -((dyingPercentage / 100) * circumference);
  const notSetStrokeDashoffset = -(((dyingPercentage + printingPercentage) / 100) * circumference);

  if (loading) {
    return (
      <div className={`p-4 rounded-lg border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } shadow-sm`}>
        <div className="animate-pulse">
          <div className={`h-5 w-24 mb-3 rounded ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}></div>
          <div className="flex items-center justify-center">
            <div className={`w-24 h-24 rounded-full ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
          </div>
          <div className="mt-3 space-y-1">
            <div className={`h-3 w-16 rounded ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
            <div className={`h-3 w-12 rounded ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-semibold ${
          isDarkMode ? 'text-gray-200' : 'text-gray-800'
        }`}>
          {title}
        </h3>
        
        {showFilters && (
          <div className="relative">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className={`text-xs px-2 py-1 rounded border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-200' 
                  : 'bg-white border-gray-300 text-gray-700'
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
            >
              <option value="all">All Types</option>
              <option value="Dying">Dying Only</option>
              <option value="Printing">Printing Only</option>
            </select>
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-center">
        {/* Pie Chart */}
        <div className="relative w-24 h-24 mb-3">
          <svg
            className="w-24 h-24 transform -rotate-90"
            viewBox="0 0 120 120"
          >
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={isDarkMode ? '#374151' : '#e5e7eb'}
              strokeWidth="6"
            />
            
            {/* Dying segment */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#ef4444"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={dyingStrokeDasharray}
              className="transition-all duration-1000 ease-out"
            />
            
            {/* Printing segment */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={printingStrokeDasharray}
              strokeDashoffset={printingStrokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            
            {/* Not Set segment */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#6b7280"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={notSetStrokeDasharray}
              strokeDashoffset={notSetStrokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-lg font-bold ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {total}
              </div>
              <div className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Total
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-1 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className={`text-xs font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Dying
              </span>
            </div>
            <div className="text-right">
              <div className={`text-xs font-bold ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {data.Dying}
              </div>
              <div className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {dyingPercentage.toFixed(0)}%
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className={`text-xs font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Printing
              </span>
            </div>
            <div className="text-right">
              <div className={`text-xs font-bold ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {data.Printing}
              </div>
              <div className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {printingPercentage.toFixed(0)}%
              </div>
            </div>
          </div>
          
          {data.not_set > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                <span className={`text-xs font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Not Set
                </span>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {data.not_set}
                </div>
                <div className={`text-xs ${
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
