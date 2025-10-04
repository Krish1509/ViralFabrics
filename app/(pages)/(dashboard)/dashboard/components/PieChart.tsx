'use client';

import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  title: string;
  total: number;
  isDarkMode: boolean;
  icon?: any;
  isLoading?: boolean;
  showEmptyStateDelay?: number; // Delay in milliseconds before showing empty state
}

const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  title, 
  total, 
  isDarkMode, 
  icon: Icon, 
  isLoading = false,
  showEmptyStateDelay = 6000 // 6 seconds default delay
}) => {
  const [showEmptyState, setShowEmptyState] = React.useState(false);
  const [hasData, setHasData] = React.useState(false);
  
  // Filter out "Not Set" entries but keep zero values for consistent display
  const filteredData = data.filter(item => item.name !== 'Not Set');
  
  // Always show chart, but track if there's meaningful data
  React.useEffect(() => {
    if (isLoading) {
      setShowEmptyState(false);
      setHasData(false);
      return;
    }
    
    // Always show the chart, but track if there's meaningful data
    const hasMeaningfulData = filteredData.length > 0 && filteredData.some(item => item.value > 0);
    
    setHasData(true); // Always show chart
    setShowEmptyState(false); // Never show "No data found"
  }, [filteredData.length, isLoading]);
  
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill={isDarkMode ? 'white' : 'black'} 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="500"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className={`rounded-lg border p-3 shadow-lg ${
          isDarkMode 
            ? 'bg-slate-800 border-slate-600' 
            : 'bg-white border-gray-200'
        }`}>
          <p className={`font-medium ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {data.name}
          </p>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Count: {data.value}
          </p>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Percentage: {((data.value / total) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`rounded-xl border shadow-lg p-6 ${
      isDarkMode 
        ? 'bg-slate-800/90 border-slate-600 shadow-slate-900/50 backdrop-blur-sm' 
        : 'bg-white/90 border-gray-200 shadow-gray-200/50 backdrop-blur-sm'
    }`}>
      <h3 className={`text-xl font-bold mb-6 text-center flex items-center justify-center gap-2 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        {Icon && <Icon className="w-6 h-6" />}
        {title}
      </h3>
      
      <div className="h-96 w-full relative">
        {isLoading ? (
          // Enhanced loading skeleton with spinning animation
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-6">
              {/* Spinning pie chart skeleton */}
              <div className="relative w-48 h-48 mx-auto">
                <div className={`absolute inset-0 rounded-full border-8 border-transparent border-t-blue-500 border-r-orange-500 border-b-green-500 border-l-purple-500 animate-spin ${
                  isDarkMode ? 'opacity-60' : 'opacity-40'
                }`}></div>
                <div className={`absolute inset-4 rounded-full border-4 border-transparent border-t-blue-300 border-r-orange-300 border-b-green-300 border-l-purple-300 animate-spin ${
                  isDarkMode ? 'opacity-40' : 'opacity-30'
                }`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                <div className={`absolute inset-8 rounded-full border-2 border-transparent border-t-blue-200 border-r-orange-200 border-b-green-200 border-l-purple-200 animate-spin ${
                  isDarkMode ? 'opacity-30' : 'opacity-20'
                }`} style={{ animationDuration: '2s' }}></div>
              </div>
              
              {/* Loading text with dots animation */}
              <div className="space-y-2">
                <div className={`h-4 w-40 rounded mx-auto animate-pulse ${
                  isDarkMode ? 'bg-slate-700' : 'bg-gray-300'
                }`}></div>
                <div className="flex items-center justify-center space-x-1">
                  <span className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Loading data
                  </span>
                  <div className="flex space-x-1">
                    <div className={`w-1 h-1 rounded-full animate-bounce ${
                      isDarkMode ? 'bg-gray-400' : 'bg-gray-500'
                    }`} style={{ animationDelay: '0ms' }}></div>
                    <div className={`w-1 h-1 rounded-full animate-bounce ${
                      isDarkMode ? 'bg-gray-400' : 'bg-gray-500'
                    }`} style={{ animationDelay: '150ms' }}></div>
                    <div className={`w-1 h-1 rounded-full animate-bounce ${
                      isDarkMode ? 'bg-gray-400' : 'bg-gray-500'
                    }`} style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : !isLoading ? (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={filteredData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={160}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                stroke={isDarkMode ? '#374151' : '#e5e7eb'}
                strokeWidth={3}
              >
                {filteredData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.value > 0 ? entry.color : '#9CA3AF'} // Grey for zero values
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RechartsPieChart>
          </ResponsiveContainer>
        ) : (
          // Still loading - show a subtle loading indicator
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className={`w-12 h-12 rounded-full mx-auto animate-pulse ${
                isDarkMode ? 'bg-slate-700' : 'bg-gray-300'
              }`}></div>
              <div className="space-y-2">
                <div className={`h-4 w-24 rounded mx-auto animate-pulse ${
                  isDarkMode ? 'bg-slate-700' : 'bg-gray-300'
                }`}></div>
                <div className={`h-3 w-16 rounded mx-auto animate-pulse ${
                  isDarkMode ? 'bg-slate-700' : 'bg-gray-300'
                }`}></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Center Content - Always show */}
        {!isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className={`text-4xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {filteredData.reduce((sum, item) => sum + item.value, 0)}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Detailed Breakdown Below Chart */}
      {!isLoading && (
        <div className="mt-6 grid grid-cols-1 gap-4">
          {filteredData.map((item, index) => {
            const total = filteredData.reduce((sum, data) => sum + data.value, 0);
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            
            return (
              <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${
                isDarkMode 
                  ? 'bg-slate-700/50 border border-slate-600' 
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: item.value > 0 ? item.color : '#9CA3AF' }}
                  ></div>
                  <span className={`text-xl font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {item.value}
                  </div>
                  <div className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
    </div>
  );
};

export default PieChart;
