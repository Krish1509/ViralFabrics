'use client';

import React, { useState } from 'react';
import { CalendarIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDarkMode } from '@/app/contexts/DarkModeContext';

interface DashboardFiltersProps {
  onFiltersChange: (filters: {
    startDate: string;
    endDate: string;
    financialYear: string;
  }) => void;
  loading?: boolean;
}

export default function DashboardFilters({ onFiltersChange, loading = false }: DashboardFiltersProps) {
  const { isDarkMode } = useDarkMode();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [financialYear, setFinancialYear] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Generate financial year options
  const getFinancialYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [];
    
    // Generate last 5 financial years and next 2
    for (let i = 5; i >= -2; i--) {
      const year = currentYear - i;
      const fyStart = `${year}-04-01`;
      const fyEnd = `${year + 1}-03-31`;
      options.push({
        value: `${year}-${year + 1}`,
        label: `FY ${year}-${(year + 1).toString().slice(-2)}`,
        startDate: fyStart,
        endDate: fyEnd
      });
    }
    return options;
  };

  const handleApplyFilters = () => {
    let finalStartDate = startDate;
    let finalEndDate = endDate;

    // If financial year is selected, use its dates
    if (financialYear !== 'all') {
      const fyOption = getFinancialYearOptions().find(opt => opt.value === financialYear);
      if (fyOption) {
        finalStartDate = fyOption.startDate;
        finalEndDate = fyOption.endDate;
      }
    }

    onFiltersChange({
      startDate: finalStartDate,
      endDate: finalEndDate,
      financialYear
    });
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setFinancialYear('all');
    onFiltersChange({
      startDate: '',
      endDate: '',
      financialYear: 'all'
    });
  };

  const hasActiveFilters = startDate || endDate || financialYear !== 'all';

  return (
    <div className={`rounded-xl border shadow-lg p-2 sm:p-3 mb-2 sm:mb-3 transition-all duration-500 ${
      isDarkMode 
        ? 'bg-slate-800/90 border-slate-600 shadow-slate-900/50 backdrop-blur-sm' 
        : 'bg-white/90 border-gray-200 shadow-gray-200/50 backdrop-blur-sm'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FunnelIcon className={`w-5 h-5 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`} />
          <h3 className={`text-base sm:text-lg font-semibold transition-colors duration-300 ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>Filters</h3>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className={`flex items-center gap-1 px-3 py-1 text-sm border rounded-md transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-gray-300 hover:text-gray-100 border-slate-600 hover:bg-slate-700' 
                  : 'text-gray-600 hover:text-gray-800 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <XMarkIcon className="w-4 h-4" />
              Clear
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
              isDarkMode 
                ? 'bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 text-gray-300 hover:text-white' 
                : 'bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-600 hover:text-gray-800'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {/* Date Range */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Start Date
            </label>
            <div className="relative">
              <CalendarIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-500 text-gray-100 placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={`block text-sm font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              End Date
            </label>
            <div className="relative">
              <CalendarIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-500 text-gray-100 placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>


          {/* Financial Year */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Financial Year
            </label>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-500 text-gray-100' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Financial Years</option>
              {getFinancialYearOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {showFilters && (
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleApplyFilters}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Applying...' : 'Apply Filters'}
          </button>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-2 pt-2 border-t">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            {startDate && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                From: {new Date(startDate).toLocaleDateString()}
              </span>
            )}
            {endDate && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                To: {new Date(endDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
