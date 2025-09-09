'use client';

import React, { useState, useEffect } from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';

interface EnhancedStatusPieChartProps {
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

export default function EnhancedStatusPieChart({ 
  title,
  data, 
  loading = false,
  showFilters = true
}: EnhancedStatusPieChartProps) {
  const { isDarkMode } = useDarkMode();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [animationProgress, setAnimationProgress] = useState(0);

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
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  // Animate the chart on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(1);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Calculate the stroke-dasharray for each segment with animation
  const pendingStrokeDasharray = `${(pendingPercentage / 100) * circumference * animationProgress} ${circumference}`;
  const inProgressStrokeDasharray = `${(inProgressPercentage / 100) * circumference * animationProgress} ${circumference}`;
  const completedStrokeDasharray = `${(completedPercentage / 100) * circumference * animationProgress} ${circumference}`;
  const deliveredStrokeDasharray = `${(deliveredPercentage / 100) * circumference * animationProgress} ${circumference}`;
  const cancelledStrokeDasharray = `${(cancelledPercentage / 100) * circumference * animationProgress} ${circumference}`;
  const notSetStrokeDasharray = `${(notSetPercentage / 100) * circumference * animationProgress} ${circumference}`;

  // Calculate the offset for each segment
  const inProgressStrokeDashoffset = -((pendingPercentage / 100) * circumference * animationProgress);
  const completedStrokeDashoffset = -(((pendingPercentage + inProgressPercentage) / 100) * circumference * animationProgress);
  const deliveredStrokeDashoffset = -(((pendingPercentage + inProgressPercentage + completedPercentage) / 100) * circumference * animationProgress);
  const cancelledStrokeDashoffset = -(((pendingPercentage + inProgressPercentage + completedPercentage + deliveredPercentage) / 100) * circumference * animationProgress);
  const notSetStrokeDashoffset = -(((pendingPercentage + inProgressPercentage + completedPercentage + deliveredPercentage + cancelledPercentage) / 100) * circumference * animationProgress);

  if (loading) {
    return (
      <div className={`p-8 rounded-2xl border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } shadow-xl`}>
        <div className="animate-pulse">
          <div className={`h-8 w-40 mb-6 rounded ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}></div>
          <div className="flex items-center justify-center">
            <div className={`w-40 h-40 rounded-full ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
          </div>
          <div className="mt-6 space-y-3">
            <div className={`h-5 w-32 rounded ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
            <div className={`h-5 w-24 rounded ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-8 rounded-2xl border transition-all duration-500 hover:shadow-2xl transform hover:scale-105 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-gray-700 hover:border-gray-600' 
        : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200 hover:border-gray-300'
    } shadow-xl`}>
      <div className="flex items-center justify-between mb-8">
        <h3 className={`text-2xl font-bold ${
          isDarkMode ? 'text-gray-100' : 'text-gray-800'
        }`}>
          {title}
        </h3>
        
        {showFilters && (
          <div className="relative">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className={`text-sm px-4 py-2 rounded-xl border transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-lg`}
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
        {/* Enhanced Pie Chart */}
        <div className="relative w-40 h-40 mb-8">
          <svg
            className="w-40 h-40 transform -rotate-90 drop-shadow-2xl"
            viewBox="0 0 160 160"
          >
            {/* Background circle with gradient */}
            <defs>
              <linearGradient id="pendingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="inProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id="completedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
              <linearGradient id="deliveredGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="cancelledGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
              <linearGradient id="notSetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6b7280" />
                <stop offset="100%" stopColor="#4b5563" />
              </linearGradient>
            </defs>
            
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={isDarkMode ? '#374151' : '#e5e7eb'}
              strokeWidth="10"
              className="opacity-20"
            />
            
            {/* Pending segment with gradient */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="url(#pendingGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={pendingStrokeDasharray}
              className="transition-all duration-1500 ease-out drop-shadow-lg"
              style={{
                filter: 'drop-shadow(0 4px 8px rgba(245, 158, 11, 0.4))'
              }}
            />
            
            {/* In Progress segment with gradient */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="url(#inProgressGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={inProgressStrokeDasharray}
              strokeDashoffset={inProgressStrokeDashoffset}
              className="transition-all duration-1500 ease-out drop-shadow-lg"
              style={{
                filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.4))'
              }}
            />
            
            {/* Completed segment with gradient */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="url(#completedGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={completedStrokeDasharray}
              strokeDashoffset={completedStrokeDashoffset}
              className="transition-all duration-1500 ease-out drop-shadow-lg"
              style={{
                filter: 'drop-shadow(0 4px 8px rgba(139, 92, 246, 0.4))'
              }}
            />
            
            {/* Delivered segment with gradient */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="url(#deliveredGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={deliveredStrokeDasharray}
              strokeDashoffset={deliveredStrokeDashoffset}
              className="transition-all duration-1500 ease-out drop-shadow-lg"
              style={{
                filter: 'drop-shadow(0 4px 8px rgba(16, 185, 129, 0.4))'
              }}
            />
            
            {/* Cancelled segment with gradient */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="url(#cancelledGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={cancelledStrokeDasharray}
              strokeDashoffset={cancelledStrokeDashoffset}
              className="transition-all duration-1500 ease-out drop-shadow-lg"
              style={{
                filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.4))'
              }}
            />
            
            {/* Not Set segment with gradient */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="url(#notSetGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={notSetStrokeDasharray}
              strokeDashoffset={notSetStrokeDashoffset}
              className="transition-all duration-1500 ease-out drop-shadow-lg"
              style={{
                filter: 'drop-shadow(0 4px 8px rgba(107, 114, 128, 0.4))'
              }}
            />
          </svg>
          
          {/* Enhanced center text with animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center transform transition-all duration-500 hover:scale-110">
              <div className={`text-4xl font-bold transition-all duration-500 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                {total}
              </div>
              <div className={`text-sm font-semibold ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Total Orders
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Legend */}
        <div className="space-y-4 w-full">
          {filteredData.pending > 0 && (
            <div className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:bg-opacity-50 ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full mr-4 shadow-lg"></div>
                <span className={`text-base font-semibold ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Pending
                </span>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  {filteredData.pending}
                </div>
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {pendingPercentage.toFixed(0)}%
                </div>
              </div>
            </div>
          )}
          
          {filteredData.in_progress > 0 && (
            <div className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:bg-opacity-50 ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-4 shadow-lg"></div>
                <span className={`text-base font-semibold ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Working
                </span>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  {filteredData.in_progress}
                </div>
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {inProgressPercentage.toFixed(0)}%
                </div>
              </div>
            </div>
          )}
          
          {filteredData.completed > 0 && (
            <div className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:bg-opacity-50 ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mr-4 shadow-lg"></div>
                <span className={`text-base font-semibold ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Completed
                </span>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  {filteredData.completed}
                </div>
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {completedPercentage.toFixed(0)}%
                </div>
              </div>
            </div>
          )}
          
          {filteredData.delivered > 0 && (
            <div className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:bg-opacity-50 ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full mr-4 shadow-lg"></div>
                <span className={`text-base font-semibold ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Delivered
                </span>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  {filteredData.delivered}
                </div>
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {deliveredPercentage.toFixed(0)}%
                </div>
              </div>
            </div>
          )}
          
          {filteredData.cancelled > 0 && (
            <div className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:bg-opacity-50 ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full mr-4 shadow-lg"></div>
                <span className={`text-base font-semibold ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Cancelled
                </span>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  {filteredData.cancelled}
                </div>
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {cancelledPercentage.toFixed(0)}%
                </div>
              </div>
            </div>
          )}
          
          {filteredData.not_set > 0 && (
            <div className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:bg-opacity-50 ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full mr-4 shadow-lg"></div>
                <span className={`text-base font-semibold ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Not Set
                </span>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  {filteredData.not_set}
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
