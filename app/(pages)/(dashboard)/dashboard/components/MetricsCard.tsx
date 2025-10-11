'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';

interface MetricsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  onClick?: () => void;
}

const colorClasses = {
  blue: {
    light: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      border: 'border-blue-200'
    },
    dark: {
      bg: 'bg-blue-900/30',
      icon: 'text-blue-400',
      border: 'border-blue-800/50'
    }
  },
  green: {
    light: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      border: 'border-green-200'
    },
    dark: {
      bg: 'bg-green-900/30',
      icon: 'text-green-400',
      border: 'border-green-800/50'
    }
  },
  yellow: {
    light: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      border: 'border-yellow-200'
    },
    dark: {
      bg: 'bg-yellow-900/30',
      icon: 'text-yellow-400',
      border: 'border-yellow-800/50'
    }
  },
  red: {
    light: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      border: 'border-red-200'
    },
    dark: {
      bg: 'bg-red-900/30',
      icon: 'text-red-400',
      border: 'border-red-800/50'
    }
  },
  purple: {
    light: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      border: 'border-purple-200'
    },
    dark: {
      bg: 'bg-purple-900/30',
      icon: 'text-purple-400',
      border: 'border-purple-800/50'
    }
  },
  indigo: {
    light: {
      bg: 'bg-indigo-50',
      icon: 'text-indigo-600',
      border: 'border-indigo-200'
    },
    dark: {
      bg: 'bg-indigo-900/30',
      icon: 'text-indigo-400',
      border: 'border-indigo-800/50'
    }
  }
};

export default function MetricsCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend, 
  subtitle,
  onClick 
}: MetricsCardProps) {
  const { isDarkMode } = useDarkMode();
  const colors = isDarkMode ? colorClasses[color].dark : colorClasses[color].light;

  const handleClick = (e: React.MouseEvent) => {
    console.log('🔧 MetricsCard clicked:', { title, onClick: !!onClick });
    alert(`MetricsCard clicked: ${title}`); // Temporary alert for testing
    if (onClick) {
      onClick();
    } else {
      console.log('🔧 MetricsCard - no onClick handler provided');
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`${colors.bg} ${colors.border} border rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-500 transform hover:-translate-y-1 ${
        isDarkMode 
          ? 'hover:shadow-xl hover:shadow-black/30 backdrop-blur-sm' 
          : 'hover:shadow-xl hover:shadow-gray-200/50 backdrop-blur-sm'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium mb-1 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>{title}</p>
          <p className={`text-xl sm:text-2xl lg:text-3xl font-bold transition-all duration-500 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>{value}</p>
          {subtitle && (
            <p className={`text-xs mt-1 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>{subtitle}</p>
          )}
          {onClick && (
            <p className={`text-xs mt-1 transition-colors duration-300 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>Click to view →</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs font-medium transition-colors duration-300 ${
                trend.isPositive 
                  ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                  : (isDarkMode ? 'text-red-400' : 'text-red-600')
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className={`text-xs ml-1 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>vs last month</span>
            </div>
          )}
        </div>
        <div className={`${colors.icon} p-3 sm:p-4 rounded-full transition-all duration-500 transform hover:scale-110 ${
          isDarkMode ? 'bg-slate-800/80 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm'
        }`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
}
