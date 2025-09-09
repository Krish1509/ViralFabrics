'use client';

import React from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';

interface OrderStatusPieChartProps {
  pendingCount: number;
  deliveredCount: number;
  loading?: boolean;
}

export default function OrderStatusPieChart({ 
  pendingCount, 
  deliveredCount, 
  loading = false 
}: OrderStatusPieChartProps) {
  const { isDarkMode } = useDarkMode();

  const total = pendingCount + deliveredCount;
  const pendingPercentage = total > 0 ? (pendingCount / total) * 100 : 0;
  const deliveredPercentage = total > 0 ? (deliveredCount / total) * 100 : 0;

  // Calculate the circumference of the circle (2 * π * radius)
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  // Calculate the stroke-dasharray for each segment
  const pendingStrokeDasharray = `${(pendingPercentage / 100) * circumference} ${circumference}`;
  const deliveredStrokeDasharray = `${(deliveredPercentage / 100) * circumference} ${circumference}`;

  // Calculate the offset for the delivered segment (starts where pending ends)
  const deliveredStrokeDashoffset = -((pendingPercentage / 100) * circumference);

  if (loading) {
    return (
      <div className={`p-6 rounded-lg border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } shadow-sm`}>
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
    <div className={`p-6 rounded-lg border ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } shadow-sm`}>
      <h3 className={`text-lg font-semibold mb-4 ${
        isDarkMode ? 'text-gray-200' : 'text-gray-800'
      }`}>
        Order Status Distribution
      </h3>
      
      <div className="flex flex-col items-center">
        {/* Pie Chart */}
        <div className="relative w-32 h-32 mb-4">
          <svg
            className="w-32 h-32 transform -rotate-90"
            viewBox="0 0 140 140"
          >
            {/* Background circle */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={isDarkMode ? '#374151' : '#e5e7eb'}
              strokeWidth="8"
            />
            
            {/* Pending segment */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={pendingStrokeDasharray}
              className="transition-all duration-1000 ease-out"
            />
            
            {/* Delivered segment */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#10b981"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={deliveredStrokeDasharray}
              strokeDashoffset={deliveredStrokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-2xl font-bold ${
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
        <div className="space-y-2 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-amber-500 rounded-full mr-2"></div>
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Pending
              </span>
            </div>
            <div className="text-right">
              <div className={`text-sm font-bold ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {pendingCount}
              </div>
              <div className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {pendingPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-emerald-500 rounded-full mr-2"></div>
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Delivered
              </span>
            </div>
            <div className="text-right">
              <div className={`text-sm font-bold ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {deliveredCount}
              </div>
              <div className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {deliveredPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
