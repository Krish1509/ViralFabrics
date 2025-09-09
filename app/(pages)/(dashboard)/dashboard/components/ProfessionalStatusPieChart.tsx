'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ClockIcon, CheckCircleIcon, TruckIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useDarkMode } from '../../hooks/useDarkMode';

interface StatusData {
  name: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}

interface ProfessionalStatusPieChartProps {
  data: {
    pending: number;
    in_progress: number;
    completed: number;
    delivered: number;
    cancelled: number;
    not_set: number;
  };
  title?: string;
  loading?: boolean;
}

export default function ProfessionalStatusPieChart({ 
  data, 
  title = "Order Status Distribution", 
  loading = false 
}: ProfessionalStatusPieChartProps) {
  const { isDarkMode } = useDarkMode();
  
  const chartData: StatusData[] = [
    {
      name: 'Pending',
      value: data.pending,
      color: isDarkMode ? '#FBBF24' : '#F59E0B',
      icon: <ClockIcon className="w-4 h-4" />
    },
    {
      name: 'In Progress',
      value: data.in_progress,
      color: isDarkMode ? '#60A5FA' : '#3B82F6',
      icon: <TruckIcon className="w-4 h-4" />
    },
    {
      name: 'Completed',
      value: data.completed,
      color: isDarkMode ? '#A78BFA' : '#8B5CF6',
      icon: <CheckCircleIcon className="w-4 h-4" />
    },
    {
      name: 'Delivered',
      value: data.delivered,
      color: isDarkMode ? '#34D399' : '#10B981',
      icon: <CheckCircleIcon className="w-4 h-4" />
    },
    {
      name: 'Cancelled',
      value: data.cancelled,
      color: isDarkMode ? '#F87171' : '#EF4444',
      icon: <XCircleIcon className="w-4 h-4" />
    },
    {
      name: 'Not Set',
      value: data.not_set,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      icon: <ExclamationTriangleIcon className="w-4 h-4" />
    }
  ].filter(item => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className={`p-3 border rounded-lg shadow-lg transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-slate-800 border-slate-600' 
            : 'bg-white border-gray-200'
        }`}>
          <p className={`font-medium transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>{data.name}</p>
          <p className={`text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {data.value} orders ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`rounded-xl border shadow-lg p-4 sm:p-6 transition-all duration-500 ${
        isDarkMode 
          ? 'bg-slate-800/80 border-slate-700 shadow-slate-900/30 backdrop-blur-sm' 
          : 'bg-white/80 border-gray-200 shadow-gray-200/50 backdrop-blur-sm'
      }`}>
        <div className="animate-pulse">
          <div className={`h-6 w-32 mb-6 rounded ${
            isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
          }`}></div>
          <div className={`h-48 sm:h-64 rounded ${
            isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
          }`}></div>
          <div className="mt-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`h-4 rounded ${
                isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
              }`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border shadow-lg p-4 sm:p-6 transition-all duration-500 ${
      isDarkMode 
        ? 'bg-slate-800/80 border-slate-700 shadow-slate-900/30 backdrop-blur-sm' 
        : 'bg-white/80 border-gray-200 shadow-gray-200/50 backdrop-blur-sm'
    }`}>
      <div className="flex items-center gap-2 mb-6">
        <PieChart className={`w-5 h-5 transition-colors duration-300 ${
          isDarkMode ? 'text-blue-400' : 'text-blue-600'
        }`} />
        <h3 className={`text-base sm:text-lg font-semibold transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>{title}</h3>
      </div>

      {total === 0 ? (
        <div className={`flex items-center justify-center h-64 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <div className="text-center">
            <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No data available</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pie Chart */}
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            {chartData.map((item, index) => {
              const percentage = ((item.value / total) * 100).toFixed(1);
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className={`text-sm font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>{item.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{item.value}</p>
                    <p className={`text-xs transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>{percentage}%</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className={`pt-4 border-t transition-colors duration-300 ${
            isDarkMode ? 'border-slate-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Total Orders</span>
              <span className={`text-lg font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{total}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
