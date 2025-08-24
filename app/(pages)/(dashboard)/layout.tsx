'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { useDarkMode } from './hooks/useDarkMode';
import PageVisitLogger from './components/PageVisitLogger';
import LoadingOptimizer from './components/LoadingOptimizer';

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [screenSize, setScreenSize] = useState<number>(0);
  const [sessionStatus, setSessionStatus] = useState<'active' | 'refreshing' | 'expired'>('active');
  const { isDarkMode, mounted } = useDarkMode();

  // Track screen size
  useEffect(() => {
    const handleResize = () => {
      const newScreenSize = window.innerWidth;
      setScreenSize(newScreenSize);
      
      // Set default collapsed state based on screen size
      if (newScreenSize >= 800 && newScreenSize < 1400) {
        // Medium screens: icons-only by default
        setIsSidebarCollapsed(true);
      } else if (newScreenSize >= 1400) {
        // Large screens: full sidebar by default (icons + text)
        setIsSidebarCollapsed(false);
      }
      // For screens < 800px, keep the current collapsed state (mobile overlay)
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
            console.log('✅ Session refreshed successfully');
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

  const handleLogout = async () => {
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
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Calculate main content margin based on screen size and sidebar state
  const getMainContentMargin = () => {
    if (screenSize < 800) {
      return 'ml-0'; // No margin for mobile
    } else if (screenSize >= 1400) {
      return isSidebarCollapsed ? 'ml-20' : 'ml-64'; // Toggle between collapsed and full
    } else {
      // Medium screens (800px to 1400px) - allow toggle between icons and full
      return isSidebarCollapsed ? 'ml-20' : 'ml-64';
    }
  };

  // Calculate content padding for different screen sizes
  const getContentPadding = () => {
    if (screenSize >= 1350) {
      return 'px-4 lg:px-6';
    } else if (screenSize >= 1200) {
      return 'px-3 lg:px-4';
    } else {
      return 'px-3 sm:px-4';
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        mounted && isDarkMode 
          ? 'bg-slate-800' 
          : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
      }`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
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
      
      {/* Sidebar - Fixed on left */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        user={user}
      />
      
      {/* Main content area - Flush with sidebar */}
      <div className={getMainContentMargin()}>
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
          <div className={`${getContentPadding()} py-8 transition-colors duration-300 ${
            mounted && isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
