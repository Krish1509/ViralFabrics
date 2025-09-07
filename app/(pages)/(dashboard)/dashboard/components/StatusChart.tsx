'use client';

import React from 'react';
import { Clock, CheckCircle, Truck, XCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';

interface StatusData {
  pending: number;
  in_progress: number;
  completed: number;
  delivered: number;
  cancelled: number;
  not_set: number;
}

interface StatusChartProps {
  data: StatusData;
  title?: string;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Clock className="w-4 h-4" />,
    bgColor: '#FEF3C7'
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <AlertCircle className="w-4 h-4" />,
    bgColor: '#DBEAFE'
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle className="w-4 h-4" />,
    bgColor: '#D1FAE5'
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: <Truck className="w-4 h-4" />,
    bgColor: '#A7F3D0'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle className="w-4 h-4" />,
    bgColor: '#FEE2E2'
  },
  not_set: {
    label: 'Not Set',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <HelpCircle className="w-4 h-4" />,
    bgColor: '#F3F4F6'
  }
};

export default function StatusChart({ data, title = "Order Status Overview" }: StatusChartProps) {
  const { isDarkMode } = useDarkMode();
  const statuses = Object.entries(data).filter(([_, count]) => count > 0);
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  return (
    <div className={`rounded-xl border shadow-lg p-4 sm:p-6 transition-all duration-500 ${
      isDarkMode 
        ? 'bg-slate-800/80 border-slate-700 shadow-slate-900/30 backdrop-blur-sm' 
        : 'bg-white/80 border-gray-200 shadow-gray-200/50 backdrop-blur-sm'
    }`}>
      <div className="flex items-center gap-2 mb-6">
        <CheckCircle className={`w-5 h-5 transition-colors duration-300 ${
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
            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No data available</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status bars */}
          {statuses.map(([status, count]) => {
            const config = statusConfig[status as keyof StatusData];
            const percentage = ((count / total) * 100).toFixed(1);
            
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <span className={`text-sm font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{config.label}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-semibold transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{count}</span>
                    <span className={`text-xs ml-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>({percentage}%)</span>
                  </div>
                </div>
                <div className={`w-full rounded-full h-2 transition-colors duration-300 ${
                  isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
                }`}>
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: config.bgColor.replace('100', '500')
                    }}
                  />
                </div>
              </div>
            );
          })}

          {/* Summary */}
          <div className={`pt-4 border-t transition-colors duration-300 ${
            isDarkMode ? 'border-slate-700' : 'border-gray-200'
          }`}>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className={`text-2xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{total}</p>
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Total Orders</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-green-400' : 'text-green-600'
                }`}>
                  {data.delivered + data.completed}
                </p>
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Completed</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
