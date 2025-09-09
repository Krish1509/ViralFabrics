'use client';

import React, { useState } from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';

interface OrderStatusPieChartDetailedProps {
  title: string;
  data: {
    pending: number;
    in_progress: number;
    completed: number;
    delivered: number;
    cancelled: number;
    not_set: number;
  };
  loading?: boolean;
  showFilters?: boolean;
}

export default function OrderStatusPieChartDetailed({ 
  title,
  data, 
  loading = false,
  showFilters = true
}: OrderStatusPieChartDetailedProps) {
  const { isDarkMode } = useDarkMode();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Filter data based on selection
  let filteredData = data;
  if (selectedFilter === 'pending') {
    filteredData = {
      pending: data.pending + data.not_set,
      in_progress: 0,
      completed: 0,
      delivered: 0,
      cancelled: 0,
      not_set: 0
    };
  } else if (selectedFilter === 'delivered') {
    filteredData = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      delivered: data.delivered + data.completed,
      cancelled: 0,
      not_set: 0
    };
  } else if (selectedFilter === 'working') {
    filteredData = {
      pending: 0,
      in_progress: data.in_progress,
      completed: 0,
      delivered: 0,
      cancelled: 0,
      not_set: 0
    };
  }

  const total = filteredData.pending + filteredData.in_progress + filteredData.completed + filteredData.delivered + filteredData.cancelled + filteredData.not_set;
  
  // Calculate percentages
  const pendingPercentage = total > 0 ? (filteredData.pending / total) * 100 : 0;
  const inProgressPercentage = total > 0 ? (filteredData.in_progress / total) * 100 : 0;
  const completedPercentage = total > 0 ? (filteredData.completed / total) * 100 : 0;
  const deliveredPercentage = total > 0 ? (filteredData.delivered / total) * 100 : 0;
  const cancelledPercentage = total > 0 ? (filteredData.cancelled / total) * 100 : 0;
  const notSetPercentage = total > 0 ? (filteredData.not_set / total) * 100 : 0;

  // Calculate the circumference of the circle (2 * π * radius)
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  // Calculate the stroke-dasharray for each segment
  const pendingStrokeDasharray = `${(pendingPercentage / 100) * circumference} ${circumference}`;
  const inProgressStrokeDasharray = `${(inProgressPercentage / 100) * circumference} ${circumference}`;
  const completedStrokeDasharray = `${(completedPercentage / 100) * circumference} ${circumference}`;
  const deliveredStrokeDasharray = `${(deliveredPercentage / 100) * circumference} ${circumference}`;
  const cancelledStrokeDasharray = `${(cancelledPercentage / 100) * circumference} ${circumference}`;
  const notSetStrokeDasharray = `${(notSetPercentage / 100) * circumference} ${circumference}`;

  // Calculate the offset for each segment
  const inProgressStrokeDashoffset = -((pendingPercentage / 100) * circumference);
  const completedStrokeDashoffset = -(((pendingPercentage + inProgressPercentage) / 100) * circumference);
  const deliveredStrokeDashoffset = -(((pendingPercentage + inProgressPercentage + completedPercentage) / 100) * circumference);
  const cancelledStrokeDashoffset = -(((pendingPercentage + inProgressPercentage + completedPercentage + deliveredPercentage) / 100) * circumference);
  const notSetStrokeDashoffset = -(((pendingPercentage + inProgressPercentage + completedPercentage + deliveredPercentage + cancelledPercentage) / 100) * circumference);

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
              <option value="all">All Status</option>
              <option value="pending">Pending Only</option>
              <option value="delivered">Delivered Only</option>
              <option value="working">Working Only</option>
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
            
            {/* Pending segment */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={pendingStrokeDasharray}
              className="transition-all duration-1000 ease-out"
            />
            
            {/* In Progress segment */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={inProgressStrokeDasharray}
              strokeDashoffset={inProgressStrokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            
            {/* Completed segment */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={completedStrokeDasharray}
              strokeDashoffset={completedStrokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            
            {/* Delivered segment */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#10b981"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={deliveredStrokeDasharray}
              strokeDashoffset={deliveredStrokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            
            {/* Cancelled segment */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#ef4444"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={cancelledStrokeDasharray}
              strokeDashoffset={cancelledStrokeDashoffset}
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
          {filteredData.pending > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                <span className={`text-xs font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Pending
                </span>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {filteredData.pending}
                </div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {pendingPercentage.toFixed(0)}%
                </div>
              </div>
            </div>
          )}
          
          {filteredData.in_progress > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className={`text-xs font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Working
                </span>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {filteredData.in_progress}
                </div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {inProgressPercentage.toFixed(0)}%
                </div>
              </div>
            </div>
          )}
          
          {filteredData.completed > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                <span className={`text-xs font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Completed
                </span>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {filteredData.completed}
                </div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {completedPercentage.toFixed(0)}%
                </div>
              </div>
            </div>
          )}
          
          {filteredData.delivered > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                <span className={`text-xs font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Delivered
                </span>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {filteredData.delivered}
                </div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {deliveredPercentage.toFixed(0)}%
                </div>
              </div>
            </div>
          )}
          
          {filteredData.cancelled > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className={`text-xs font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Cancelled
                </span>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {filteredData.cancelled}
                </div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {cancelledPercentage.toFixed(0)}%
                </div>
              </div>
            </div>
          )}
          
          {filteredData.not_set > 0 && (
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
                  {filteredData.not_set}
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
