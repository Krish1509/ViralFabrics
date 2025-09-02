'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { useDarkMode } from './hooks/useDarkMode';
import PageVisitLogger from './components/PageVisitLogger';
import LoadingOptimizer from './components/LoadingOptimizer';
import GlobalSkeleton from './components/GlobalSkeleton';
import PerformanceMonitor from './components/PerformanceMonitor';
import PWARegistration from './components/PWARegistration';

interface User {
  _id: string;
  name: string;
  username: string;
  phoneNumber?: string;
  address?: string;
  role: string;
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [screenSize, setScreenSize] = useState<number>(0);
  const [sessionStatus, setSessionStatus] = useState<'active' | 'refreshing' | 'expired'>('active');
  const { isDarkMode, mounted } = useDarkMode();

  // Track screen size with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newScreenSize = window.innerWidth;
        setScreenSize(newScreenSize);
        
        // Set default collapsed state based on screen size
        if (newScreenSize >= 800 && newScreenSize < 1600) {
          // Medium screens: icons-only by default
          setIsSidebarCollapsed(true);
        } else if (newScreenSize >= 1600) {
          // Large screens: full sidebar by default (icons + text)
          setIsSidebarCollapsed(false);
        }
        // For screens < 800px, keep the current collapsed state (mobile overlay)
      }, 100); // Debounce resize events
    };

    // Set initial size and state
    const initialSize = window.innerWidth;
    setScreenSize(initialSize);
    
    if (initialSize >= 800 && initialSize < 1600) {
      setIsSidebarCollapsed(true);
    } else if (initialSize >= 1600) {
      setIsSidebarCollapsed(false);
    }
    
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    // Check authentication and role
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Auto-refresh session when user is active
  useEffect(() => {
    if (!user) return;

    let sessionRefreshInterval: NodeJS.Timeout;
    let lastActivity = Date.now();

    // Function to refresh session
    const refreshSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      setSessionStatus('refreshing');
      
      try {
        const response = await fetch('/api/auth/refresh-session', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Update stored token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            setSessionStatus('active');
            // Session refreshed successfully
          } else {
            setSessionStatus('expired');
          }
        } else {
          setSessionStatus('expired');
        }
      } catch (error) {
        console.error('Session refresh failed:', error);
        setSessionStatus('expired');
      }
    };

    // Function to track user activity
    const updateActivity = () => {
      lastActivity = Date.now();
    };

    // Set up activity tracking
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Refresh session every 30 minutes if user is active
    sessionRefreshInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      
      // Only refresh if user has been active in the last 5 minutes
      if (timeSinceLastActivity < 5 * 60 * 1000) {
        refreshSession();
      }
    }, 30 * 60 * 1000); // 30 minutes

    // Cleanup
    return () => {
      clearInterval(sessionRefreshInterval);
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [user]);

  const handleLogout = useCallback(async () => {
    try {
      // Call logout API to log the action
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Error logging logout:', error);
    } finally {
      // Always clear local storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  }, [router]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const toggleSidebarCollapse = useCallback(() => {
    console.log('Toggle sidebar collapse called, current state:', isSidebarCollapsed);
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      console.log('Sidebar collapsed state changing from', prev, 'to', newState);
      return newState;
    });
  }, [isSidebarCollapsed]);

  // Memoize main content margin calculation
  const mainContentMargin = useMemo(() => {
    if (screenSize < 800) {
      return 'ml-0'; // No margin for mobile
    } else if (screenSize >= 1600) {
      return isSidebarCollapsed ? 'ml-20' : 'ml-64'; // Toggle between collapsed and full
    } else {
      // Medium screens (800px to 1600px) - allow toggle between icons and full
      return isSidebarCollapsed ? 'ml-20' : 'ml-64';
    }
  }, [screenSize, isSidebarCollapsed]);

  // Memoize content padding calculation
  const contentPadding = useMemo(() => {
    if (screenSize >= 1350) {
      return 'px-4 lg:px-6';
    } else if (screenSize >= 1200) {
      return 'px-3 lg:px-4';
    } else {
      return 'px-3 sm:px-4';
    }
  }, [screenSize]);

  if (isLoading || !mounted) {
    return <GlobalSkeleton type="page" />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      mounted && isDarkMode 
        ? 'bg-slate-800' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    }`}>
      {/* Page Visit Logger - Logs all page visits */}
      <PageVisitLogger />
      
      {/* Loading Optimizer - Improves performance across all pages */}
      <LoadingOptimizer />
      
      {/* Silent Performance Monitor - No UI */}
      <PerformanceMonitor />
      
      {/* PWA Registration - Handles service worker and PWA setup */}
      <PWARegistration />
      
      {/* Sidebar - Fixed on left */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        user={user}
      />
      
      {/* Main content area - Flush with sidebar */}
      <div className={mainContentMargin}>
        {/* Navbar - Full width, no extra padding */}
        <Navbar 
          user={user} 
          onLogout={handleLogout} 
          onToggleSidebar={toggleSidebar}
          onToggleCollapse={toggleSidebarCollapse}
          isCollapsed={isSidebarCollapsed}
          updateUser={updateUser}
          sessionStatus={sessionStatus}
        />

        {/* Main Content - Starts immediately below navbar */}
        <main className="pt-4">
          <div className={`${contentPadding} py-8 transition-colors duration-300 ${
            mounted && isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
