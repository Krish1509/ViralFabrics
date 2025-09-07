'use client';

import React from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';

interface TrendData {
  month: string;
  count: number;
}

interface OrderTrendsChartProps {
  data: TrendData[];
  title?: string;
}

export default function OrderTrendsChart({ data, title = "Order Trends" }: OrderTrendsChartProps) {
  const { isDarkMode } = useDarkMode();
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className={`rounded-xl border shadow-lg p-4 sm:p-6 transition-all duration-500 ${
      isDarkMode 
        ? 'bg-slate-800/80 border-slate-700 shadow-slate-900/30 backdrop-blur-sm' 
        : 'bg-white/80 border-gray-200 shadow-gray-200/50 backdrop-blur-sm'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className={`w-5 h-5 transition-colors duration-300 ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`} />
          <h3 className={`text-base sm:text-lg font-semibold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>{title}</h3>
        </div>
        <div className={`flex items-center gap-1 text-sm transition-colors duration-300 ${
          isDarkMode ? 'text-green-400' : 'text-green-600'
        }`}>
          <TrendingUp className="w-4 h-4" />
          <span>+12% from last month</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className={`flex items-center justify-center h-64 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No data available</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chart bars */}
          <div className="flex items-end justify-between h-40 sm:h-48 px-2">
            {data.map((item, index) => {
              const height = (item.count / maxCount) * 100;
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className={`w-full max-w-8 rounded-t relative group transition-colors duration-300 ${
                    isDarkMode ? 'bg-slate-700' : 'bg-blue-100'
                  }`}>
                    <div 
                      className={`rounded-t transition-all duration-300 hover:opacity-80 ${
                        isDarkMode ? 'bg-blue-500' : 'bg-blue-600'
                      }`}
                      style={{ height: `${height}%` }}
                    >
                      <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${
                        isDarkMode 
                          ? 'bg-slate-700 text-white border border-slate-600' 
                          : 'bg-gray-800 text-white'
                      }`}>
                        {item.count} orders
                      </div>
                    </div>
                  </div>
                  <div className={`mt-2 text-xs text-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {new Date(item.month).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: '2-digit' 
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary stats */}
          <div className={`grid grid-cols-3 gap-4 pt-4 border-t transition-colors duration-300 ${
            isDarkMode ? 'border-slate-700' : 'border-gray-200'
          }`}>
            <div className="text-center">
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {data.reduce((sum, item) => sum + item.count, 0)}
              </p>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Total Orders</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {Math.round(data.reduce((sum, item) => sum + item.count, 0) / data.length) || 0}
              </p>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Avg per Month</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {Math.max(...data.map(d => d.count), 0)}
              </p>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Peak Month</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
