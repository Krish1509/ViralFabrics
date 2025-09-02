'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../hooks/useDarkMode';
import { BRAND_NAME, BRAND_COPYRIGHT, BRAND_TAGLINE } from '@/lib/config';
import GlobalSkeleton from './GlobalSkeleton';

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

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse, user }: SidebarProps) {
  const pathname = usePathname();
  const { isDarkMode, mounted } = useDarkMode();
  const [screenSize, setScreenSize] = useState<number>(0);
  const [hasSetInitialState, setHasSetInitialState] = useState<boolean>(false);

  // Debug current pathname
  useEffect(() => {
    console.log('Current pathname:', pathname);
  }, [pathname]);

  // Memoize nav items to prevent recalculation on every render
  const navItems = useMemo(() => {
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
      {
        name: 'Orders',
        href: '/orders',
        icon: ShoppingBagIcon
      },
      {
        name: 'Fabrics',
        href: '/fabrics',
        icon: CubeIcon
      }
    ];

    // Only show Users for superadmin
    if (user?.role !== 'superadmin') {
      items.splice(1, 1); // Remove Users item for non-superadmin
    }
    
    // Add Logs for both users and superadmins
    items.push({
      name: 'Logs',
      href: '/logs',
      icon: DocumentTextIcon
    });

    return items;
  }, [user?.role]);

  // Optimized screen size tracking with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setScreenSize(window.innerWidth);
      }, 100); // Debounce resize events
    };

    // Set initial size
    setScreenSize(window.innerWidth);
    
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Set initial collapse state based on screen size (only once)
  useEffect(() => {
    if (screenSize > 0 && !hasSetInitialState) {
      const isLargeScreen = screenSize >= 1600;
      
      console.log('Sidebar: Setting initial state', {
        screenSize,
        isLargeScreen,
        isCollapsed,
        shouldExpand: isLargeScreen && isCollapsed,
        shouldCollapse: !isLargeScreen && !isCollapsed
      });
      
      // Only set initial state if it doesn't match the expected state
      // This prevents unnecessary toggles on mount
      if (isLargeScreen && isCollapsed) {
        // Large screen but collapsed - expand to show text
        console.log('Sidebar: Expanding sidebar for large screen');
        onToggleCollapse();
      } else if (!isLargeScreen && !isCollapsed) {
        // Small/medium screen but expanded - collapse to icons-only
        console.log('Sidebar: Collapsing sidebar for small/medium screen');
        onToggleCollapse();
      }
      
      setHasSetInitialState(true);
    }
  }, [screenSize, hasSetInitialState, isCollapsed, onToggleCollapse]);

  // Remove auto-adjustment on screen size changes to prevent interference with manual toggles
  // The user can now manually control the sidebar state via the Navbar toggle button

  // Memoize active state calculation
  const isActive = useCallback((href: string) => {
    const result = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
    console.log(`isActive check for ${href}: pathname=${pathname}, result=${result}`);
    return result;
  }, [pathname]);

  // Memoize screen size calculations
  const screenConfig = useMemo(() => {
    const isLargeScreen = screenSize >= 1600;
    const isMediumScreen = screenSize >= 800 && screenSize < 1600;
    const isSmallScreen = screenSize < 800;

    return {
      isLargeScreen,
      isMediumScreen,
      isSmallScreen
    };
  }, [screenSize]);

  // Auto-close sidebar on route change for mobile
  useEffect(() => {
    // Temporarily disable auto-close to test navigation
    // if (screenConfig.isSmallScreen && isOpen) {
    //   // Only close if we're actually navigating to a different page
    //   const timer = setTimeout(() => {
    //     onClose();
    //   }, 500);
    //   return () => clearTimeout(timer);
    // }
  }, [pathname, screenConfig.isSmallScreen, isOpen, onClose]);



  // Memoize sidebar width calculation
  const sidebarWidth = useMemo(() => {
    if (screenConfig.isSmallScreen) return 'w-80'; // Mobile overlay
    if (screenConfig.isMediumScreen) {
      return isCollapsed ? 'w-20' : 'w-64'; // Icons-only by default, allow toggle for medium screens (800px - 1599px)
    }
    if (screenConfig.isLargeScreen) {
      return isCollapsed ? 'w-20' : 'w-64'; // Full by default, toggle to icons-only for large screens (1600px+)
    }
    return 'w-64';
  }, [screenConfig, isCollapsed]);

  // Memoize text visibility
  const shouldShowText = useMemo(() => {
    if (screenConfig.isSmallScreen) return true; // Always show text in mobile overlay
    if (screenConfig.isMediumScreen) return !isCollapsed; // Allow toggle for medium screens (800px - 1599px)
    if (screenConfig.isLargeScreen) return !isCollapsed; // Show text when not collapsed (toggle)
    return true;
  }, [screenConfig, isCollapsed]);

  // Optimized click handler for mobile close
  const handleMobileClose = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  }, [onClose]);

  // Handle navigation with delayed close for mobile
  const handleNavigation = useCallback((e: React.MouseEvent) => {
    // Only close sidebar on mobile screens
    if (screenConfig.isSmallScreen) {
      // Close sidebar immediately for now to test
      onClose();
    }
    // Don't prevent default - let the link work normally
  }, [screenConfig.isSmallScreen, onClose]);

  // Show skeleton while not mounted
  if (!mounted) {
    return <GlobalSkeleton type="sidebar" />;
  }

  return (
    <>
      {/* Desktop Sidebar - Large and Medium Screens */}
      <aside className={`hidden min-[800px]:block fixed left-0 top-0 h-full z-40 transition-all duration-300 ${sidebarWidth} ${
        mounted && isDarkMode 
          ? 'bg-slate-800 border-r border-slate-700' 
          : 'bg-white/80 backdrop-blur-sm border-r border-gray-200/50'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className={`border-b transition-colors duration-300 ${
            mounted && isDarkMode ? 'border-white/10' : 'border-gray-200'
          } ${shouldShowText ? 'p-6' : 'p-4'}`}>
            <Link 
              href="/dashboard" 
              onClick={() => {
                console.log('Logo clicked - redirecting to /dashboard');
              }}
              className={`group cursor-pointer ${shouldShowText ? 'flex items-center space-x-3' : 'flex justify-center'}`}
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-lg transition-all duration-300 ${
                mounted && isDarkMode 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25' 
                  : 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/25'
              } group-hover:scale-105`}>
                <BuildingOfficeIcon className="h-5 w-5 text-white" />
              </div>
              {shouldShowText && (
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
          } ${shouldShowText ? 'px-4 py-6 space-y-2' : 'px-3 py-4 space-y-1'}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                 
                  className={`group flex items-center transition-all duration-300 cursor-pointer rounded-xl ${
                    shouldShowText 
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
                  title={!shouldShowText ? item.name : undefined}
                >
                  <div className="relative">
                    <Icon className={`h-6 w-6 transition-colors duration-300 ${
                      active
                        ? mounted && isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        : mounted && isDarkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-700'
                    }`} />
                    {!shouldShowText && item.badge && (
                      <span className={`absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium ${
                        mounted && isDarkMode ? 'text-white' : 'text-white'
                      }`}>
                        {item.badge === 'New' ? 'N' : item.badge}
                      </span>
                    )}
                  </div>
                  {shouldShowText && (
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
          {shouldShowText && (
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
      {isOpen && screenConfig.isSmallScreen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={handleMobileClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-80 z-50 transition-transform duration-300 ${
        screenConfig.isSmallScreen ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'hidden'
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
              href="/dashboard" 
              onClick={() => {
                console.log('Mobile logo clicked - redirecting to /dashboard');
              }}
              className="flex items-center space-x-3 group cursor-pointer"
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
              onClick={handleMobileClose}
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
                  onClick={() => {
                    console.log('Mobile navigation clicked:', item.href);
                    // Close sidebar manually
                    onClose();
                  }}
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
    </>
  );
}