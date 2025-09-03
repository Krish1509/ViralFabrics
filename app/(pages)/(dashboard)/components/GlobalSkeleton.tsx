'use client';

import React, { useState, useEffect } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/config';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

interface GlobalSkeletonProps {
  type: 'page' | 'table' | 'card' | 'form' | 'navbar' | 'sidebar' | 'login' | 'users';
}

const GlobalSkeleton: React.FC<GlobalSkeletonProps> = ({ type }) => {
  const { isDarkMode, mounted } = useDarkMode();
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing...');

  // Always start from 0% and progress to 100%
  useEffect(() => {
    // Reset to 0% when component mounts
    setProgress(0);
    setLoadingText('Initializing...');

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // More realistic progress increments
        const increment = Math.random() * 8 + 2; // 2-10% increments
        const newProgress = Math.min(prev + increment, 100);
        
        // Update loading text based on progress
        if (newProgress < 20) {
          setLoadingText('Initializing...');
        } else if (newProgress < 40) {
          setLoadingText('Loading data...');
        } else if (newProgress < 60) {
          setLoadingText('Processing...');
        } else if (newProgress < 80) {
          setLoadingText('Almost ready...');
        } else if (newProgress < 100) {
          setLoadingText('Finalizing...');
        } else {
          setLoadingText('Complete!');
        }
        
        return newProgress;
      });
    }, 150); // Slightly slower for better visual effect

    return () => clearInterval(interval);
  }, []); // Empty dependency array ensures it only runs once on mount

  const EnhancedLoading = () => {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        mounted && isDarkMode 
          ? 'bg-slate-900' 
          : 'bg-gradient-to-br from-slate-50 to-blue-50'
      }`}>
        <div className="text-center max-w-md mx-auto px-6">
          {/* Logo Section - Matching Sidebar Style */}
          <div className="mb-8">
            <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 ${
              mounted && isDarkMode 
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25' 
                : 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/25'
            } group-hover:scale-105`}>
              <BuildingOfficeIcon className="h-10 w-10 text-white" />
            </div>
          </div>
          
          {/* Brand Information */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
              mounted && isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {BRAND_NAME}
            </h1>
            <p className={`text-sm transition-colors duration-300 ${
              mounted && isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {BRAND_TAGLINE}
            </p>
          </div>
          
          {/* Enhanced Loading Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium transition-colors duration-300 ${
                mounted && isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {loadingText}
              </span>
              <span className={`text-sm font-bold transition-colors duration-300 ${
                mounted && isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`}>
                {Math.round(progress)}%
              </span>
            </div>
            
            {/* Progress Bar Container */}
            <div className={`w-full rounded-full h-2 transition-colors duration-300 ${
              mounted && isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
            } overflow-hidden relative`}>
              {/* Animated Progress Bar */}
              <div 
                className={`h-full rounded-full transition-all duration-300 ease-out ${
                  mounted && isDarkMode 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                } shadow-lg`}
                style={{ 
                  width: `${progress}%`,
                  transition: 'width 0.3s ease-out'
                }}
              />
              
              {/* Shimmer Effect */}
              <div 
                className={`absolute inset-0 rounded-full transition-all duration-300 ${
                  mounted && isDarkMode 
                    ? 'bg-gradient-to-r from-transparent via-white/20 to-transparent' 
                    : 'bg-gradient-to-r from-transparent via-white/40 to-transparent'
                } animate-pulse`}
                style={{ 
                  width: `${progress}%`,
                  left: '0',
                  top: '0'
                }}
              />
            </div>
          </div>
          
          {/* Loading Status */}
          <div className={`text-xs transition-colors duration-300 ${
            mounted && isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {progress < 100 ? loadingText : 'Ready!'}
          </div>
        </div>
      </div>
    );
  };

  const renderPageSkeleton = () => <EnhancedLoading />;
  const renderTableSkeleton = () => <EnhancedLoading />;
  const renderCardSkeleton = () => <EnhancedLoading />;
  const renderFormSkeleton = () => <EnhancedLoading />;
  const renderNavbarSkeleton = () => <EnhancedLoading />;
  const renderSidebarSkeleton = () => <EnhancedLoading />;
  const renderLoginSkeleton = () => <EnhancedLoading />;
  const renderUsersSkeleton = () => <EnhancedLoading />;

  switch (type) {
    case 'page':
      return renderPageSkeleton();
    case 'table':
      return renderTableSkeleton();
    case 'card':
      return renderCardSkeleton();
    case 'form':
      return renderFormSkeleton();
    case 'navbar':
      return renderNavbarSkeleton();
    case 'sidebar':
      return renderSidebarSkeleton();
    case 'login':
      return renderLoginSkeleton();
    case 'users':
      return renderUsersSkeleton();
    default:
      return <EnhancedLoading />;
  }
};

export default GlobalSkeleton;
