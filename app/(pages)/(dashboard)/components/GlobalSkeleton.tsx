'use client';

import React from 'react';
import { useDarkMode } from '../hooks/useDarkMode';
import { BRAND_NAME } from '@/lib/config';

interface GlobalSkeletonProps {
  type: 'page' | 'table' | 'card' | 'form' | 'navbar' | 'sidebar' | 'login' | 'users';
}

const GlobalSkeleton: React.FC<GlobalSkeletonProps> = ({ type }) => {
  const { isDarkMode, mounted } = useDarkMode();

  const SimpleLoading = () => {
    // Use blue theme with lighter background that matches the app
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-600">
        <div className="text-center">
          {/* Simple Logo */}
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center bg-blue-600">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
          </div>
          
          {/* Simple Text */}
          <h1 className="text-2xl font-semibold mb-2 text-white">
            {BRAND_NAME}
          </h1>
          <p className="text-sm mb-6 text-slate-200">
            Loading...
          </p>
          
          {/* Simple Loading Bar */}
          <div className="w-48 mx-auto">
            <div className="w-full rounded-full h-1.5 bg-slate-500">
              <div className="bg-blue-500 h-1.5 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPageSkeleton = () => <SimpleLoading />;
  const renderTableSkeleton = () => <SimpleLoading />;
  const renderCardSkeleton = () => <SimpleLoading />;
  const renderFormSkeleton = () => <SimpleLoading />;
  const renderNavbarSkeleton = () => <SimpleLoading />;
  const renderSidebarSkeleton = () => <SimpleLoading />;
  const renderLoginSkeleton = () => <SimpleLoading />;
  const renderUsersSkeleton = () => <SimpleLoading />;

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
      return <SimpleLoading />;
  }
};

export default GlobalSkeleton;
