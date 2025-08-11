'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { useDarkMode } from './hooks/useDarkMode';

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
  const { isDarkMode } = useDarkMode();

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
      if (parsedUser.role !== 'superadmin') {
        router.push('/dashboard/user');
        return;
      }
      setUser(parsedUser);
    } catch (error) {
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
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
        isDarkMode 
          ? 'bg-slate-800' 
          : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
      }`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-slate-800' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    }`}>
      {/* Sidebar - Fixed on left */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
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
        />

        {/* Main Content - Starts immediately below navbar */}
        <main className="pt-4">
          <div className={`${getContentPadding()} py-8 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
