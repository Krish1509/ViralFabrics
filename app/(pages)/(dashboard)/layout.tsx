'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { useDarkMode } from './hooks/useDarkMode';


import GlobalSkeleton from './components/GlobalSkeleton';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
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



  // Fullscreen toggle function
  const handleFullscreenToggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.log('Error attempting to exit fullscreen:', err);
      });
    }
  }, []);

  // PWA install prompt detection and status checking
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event so it can be triggered later
      (window as any).deferredPrompt = e;
      console.log('Install prompt captured and stored');
    };

    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setIsInstalling(false);
      // Store install status in localStorage
      localStorage.setItem('pwa-installed', 'true');
      // Clear the deferred prompt
      (window as any).deferredPrompt = null;
    };

    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      if ('standalone' in navigator && (navigator as any).standalone === true) {
        console.log('App is already installed and running in standalone mode');
        setIsInstalled(true);
      }
      // Check if there's a stored install status
      const storedInstallStatus = localStorage.getItem('pwa-installed');
      if (storedInstallStatus === 'true') {
        console.log('App install status found in localStorage');
        setIsInstalled(true);
      }
    };

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    // Listen for the appinstalled event
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check initial install status
    checkIfInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // PWA install functions
  const handleInstallClick = useCallback(() => {
    setIsInstalling(true);
    
    // Check if PWA is supported
    if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window) {
      // Trigger the browser's install prompt
      const installPrompt = (window as any).deferredPrompt;
      
      if (installPrompt) {
        installPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        installPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
            setIsInstalled(true);
            // Store install status in localStorage
            localStorage.setItem('pwa-installed', 'true');
          } else {
            console.log('User dismissed the install prompt');
          }
          setIsInstalling(false);
          // Clear the prompt
          (window as any).deferredPrompt = null;
        });
      } else {
        // No install prompt available, try alternative method
        console.log('No install prompt available, trying alternative method');
        // For some browsers, we can try to install directly
        if ('standalone' in navigator && (navigator as any).standalone === false) {
          // iOS Safari - show instructions
          alert('To install this app:\n1. Tap the Share button\n2. Tap "Add to Home Screen"\n3. Tap "Add"');
        } else {
          // Other browsers - show manual install instructions
          alert('To install this app, look for the install icon in your browser\'s address bar or menu.');
        }
        setIsInstalling(false);
      }
    } else {
      // PWA not supported
      console.log('PWA not supported in this browser');
      alert('PWA installation is not supported in your browser. Please use a modern browser like Chrome, Edge, or Firefox.');
      setIsInstalling(false);
    }
  }, []);

  const handleOpenInApp = useCallback(() => {
    // Handle opening in app mode
    if ('standalone' in navigator && (navigator as any).standalone === true) {
      // Already in app mode
      console.log('Already running in app mode');
    } else {
      // Try to open in app mode
      if (window.location.href.includes('localhost')) {
        // Development - show message
        alert('App mode is only available when the app is properly deployed and installed.');
      } else {
        // Production - try to open in app
        window.location.reload();
      }
    }
  }, []);

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
      return '';
    } else if (screenSize >= 1200) {
      return '';
    } else {
      return '';
    }
  }, [screenSize]);

  // Only show loading skeleton when actually loading, not when just waiting for dark mode
  if (isLoading) {
    return <GlobalSkeleton type="page" minLoadTime={200} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 theme-switch-root ${
      mounted && isDarkMode 
        ? 'bg-slate-800' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    }`}>
      {/* PWA Registration - Handles service worker and PWA setup */}
      <PWARegistration />
      
      {/* Sidebar - Fixed on left */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        user={user}
        onLogout={handleLogout}

        onFullscreenToggle={handleFullscreenToggle}
        isFullscreen={isFullscreen}
        isInstalled={isInstalled}
        isInstalling={isInstalling}
        onInstallClick={handleInstallClick}
        onOpenInApp={handleOpenInApp}
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
          isInstalled={isInstalled}
          isInstalling={isInstalling}
          onInstallClick={handleInstallClick}
          onOpenInApp={handleOpenInApp}
        />

        {/* Main Content - Starts immediately below navbar */}
        <main className="">
          <div className={`${contentPadding} transition-colors duration-300 ${
            mounted && isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
