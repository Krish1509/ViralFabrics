'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../hooks/useDarkMode';
import { BRAND_NAME, BRAND_COPYRIGHT, BRAND_TAGLINE } from '@/lib/config';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  user?: {
    role: string;
  } | null;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const getNavItems = (userRole?: string): NavItem[] => {
  const items: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon
    },
    {
      name: 'Users',
      href: '/users',
      icon: UsersIcon
    },
    // {
    //   name: 'Orders',
    //   href: '/orders',
    //   icon: ShoppingBagIcon
    // }
  ];

  // Only show Users for superadmin
  if (userRole !== 'superadmin') {
    items.splice(1, 1); // Remove Users item for non-superadmin
  }

  return items;
};

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse, user }: SidebarProps) {
  const pathname = usePathname();
  const { isDarkMode, mounted } = useDarkMode();
  const [screenSize, setScreenSize] = useState<number>(0);
  const navItems = getNavItems(user?.role);

  // Track screen size
  useEffect(() => {
    const handleResize = () => {
      setScreenSize(window.innerWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard/superadmin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Determine sidebar mode based on screen size
  const isLargeScreen = screenSize >= 1400;
  const isMediumScreen = screenSize >= 800 && screenSize < 1400;
  const isSmallScreen = screenSize < 800;

  // Calculate sidebar width
  const getSidebarWidth = () => {
    if (isSmallScreen) return 'w-80'; // Mobile overlay
    if (isMediumScreen) {
      return isCollapsed ? 'w-20' : 'w-64'; // Icons-only by default, toggle to full
    }
    if (isLargeScreen) {
      return isCollapsed ? 'w-20' : 'w-64'; // Full by default, toggle to icons-only
    }
    return 'w-64';
  };

  // Determine if text should be shown
  const shouldShowText = () => {
    if (isSmallScreen) return true; // Always show text in mobile overlay
    if (isMediumScreen) return !isCollapsed; // Show text when not collapsed (toggle)
    if (isLargeScreen) return !isCollapsed; // Show text when not collapsed (toggle)
    return true;
  };

  return (
    <>
      {/* Desktop Sidebar - Large and Medium Screens */}
      <aside className={`hidden min-[800px]:block fixed left-0 top-0 h-full z-40 transition-all duration-300 ${getSidebarWidth()} ${
        mounted && isDarkMode 
          ? 'bg-slate-800 border-r border-slate-700' 
          : 'bg-white/80 backdrop-blur-sm border-r border-gray-200/50'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className={`border-b transition-colors duration-300 ${
            mounted && isDarkMode ? 'border-white/10' : 'border-gray-200'
          } ${shouldShowText() ? 'p-6' : 'p-4'}`}>
            <Link 
              href="/dashboard/superadmin" 
              className={`group cursor-pointer ${shouldShowText() ? 'flex items-center space-x-3' : 'flex justify-center'}`}
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-lg transition-all duration-300 ${
                mounted && isDarkMode 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25' 
                  : 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/25'
              } group-hover:scale-105`}>
                <BuildingOfficeIcon className="h-5 w-5 text-white" />
              </div>
              {shouldShowText() && (
                <div className="min-w-0">
                  <h1 className={`text-lg font-bold transition-colors duration-300 ${
                    mounted && isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {BRAND_NAME}
                  </h1>
                  <p className={`text-xs transition-colors duration-300 ${
                    mounted && isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {BRAND_TAGLINE}
                  </p>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 overflow-y-auto max-h-[calc(100vh-140px)] ${
            mounted && isDarkMode 
              ? 'scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-500 hover:scrollbar-thumb-slate-400' 
              : 'scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400'
          } ${shouldShowText() ? 'px-4 py-6 space-y-2' : 'px-3 py-4 space-y-1'}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center transition-all duration-300 cursor-pointer rounded-xl ${
                    shouldShowText() 
                      ? 'space-x-3 px-4 py-3 justify-start' 
                      : 'justify-center p-3'
                  } ${
                    active
                      ? mounted && isDarkMode
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                      : mounted && isDarkMode
                        ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={!shouldShowText() ? item.name : undefined}
                >
                  <div className="relative">
                    <Icon className={`h-6 w-6 transition-colors duration-300 ${
                      active
                        ? mounted && isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        : mounted && isDarkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-700'
                    }`} />
                    {!shouldShowText() && item.badge && (
                      <span className={`absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium ${
                        mounted && isDarkMode ? 'text-white' : 'text-white'
                      }`}>
                        {item.badge === 'New' ? 'N' : item.badge}
                      </span>
                    )}
                  </div>
                  {shouldShowText() && (
                    <>
                      <span className="font-medium">{item.name}</span>
                      {item.badge && (
                        <span className={`ml-auto px-2 py-1 text-xs font-medium rounded-full ${
                          mounted && isDarkMode 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          {shouldShowText() && (
            <div className={`p-4 border-t transition-colors duration-300 ${
              mounted && isDarkMode ? 'border-white/10' : 'border-gray-200'
            }`}>
              <div className={`text-xs text-center transition-colors duration-300 ${
                mounted && isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {BRAND_COPYRIGHT}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isOpen && isSmallScreen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-80 z-50 transition-transform duration-300 ${
        isSmallScreen ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'hidden'
      } ${
        mounted && isDarkMode 
          ? 'bg-slate-800 border-r border-slate-700' 
          : 'bg-white/80 backdrop-blur-sm border-r border-gray-200/50'
      }`}>
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className={`flex items-center justify-between p-6 border-b transition-colors duration-300 ${
            mounted && isDarkMode ? 'border-white/10' : 'border-gray-200'
          }`}>
            <Link 
              href="/dashboard/superadmin" 
              className="flex items-center space-x-3 group cursor-pointer"
              onClick={onClose}
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-lg transition-all duration-300 ${
                mounted && isDarkMode 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25' 
                  : 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/25'
              } group-hover:scale-105`}>
                <BuildingOfficeIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className={`text-lg font-bold transition-colors duration-300 ${
                  mounted && isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {BRAND_NAME}
                </h1>
                <p className={`text-xs transition-colors duration-300 ${
                  mounted && isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {BRAND_TAGLINE}
                </p>
              </div>
            </Link>
            
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-all duration-300 cursor-pointer ${
                mounted && isDarkMode 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } shadow-lg backdrop-blur-sm`}
              aria-label="Close sidebar"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className={`flex-1 px-4 py-6 space-y-2 overflow-y-auto max-h-[calc(100vh-140px)] ${
            mounted && isDarkMode 
              ? 'scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-500 hover:scrollbar-thumb-slate-400' 
              : 'scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400'
          }`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                    active
                      ? mounted && isDarkMode
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                      : mounted && isDarkMode
                        ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-colors duration-300 ${
                    active
                      ? mounted && isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      : mounted && isDarkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  <span className="font-medium">{item.name}</span>
                  {item.badge && (
                    <span className={`ml-auto px-2 py-1 text-xs font-medium rounded-full ${
                      mounted && isDarkMode 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Footer */}
          <div className={`p-4 border-t transition-colors duration-300 ${
            mounted && isDarkMode ? 'border-white/10' : 'border-gray-200'
          }`}>
            <div className={`text-xs text-center transition-colors duration-300 ${
              mounted && isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {BRAND_COPYRIGHT}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSmallScreen && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
    </>
  );
}