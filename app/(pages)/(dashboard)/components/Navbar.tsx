'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// Custom CSS for sun glow animation and theme transition
const sunGlowStyles = `
  @keyframes sunGlow {
    0%, 100% { 
      filter: drop-shadow(0 0 3px rgba(255, 255, 0, 0.2)) 
              drop-shadow(0 0 6px rgba(255, 255, 0, 0.3)) 
              drop-shadow(0 0 9px rgba(255, 255, 0, 0.2));
    }
    50% { 
      filter: drop-shadow(0 0 5px rgba(255, 255, 0, 0.4)) 
              drop-shadow(0 0 10px rgba(255, 255, 0, 0.6)) 
              drop-shadow(0 0 15px rgba(255, 255, 0, 0.4));
    }
  }

  @keyframes rippleExpand {
    0% {
      transform: scale(0);
      opacity: 1;
      background: #1D293D;
    }
    25% {
      transform: scale(25);
      opacity: 0.9;
      background: #1D293D;
    }
    50% {
      transform: scale(50);
      opacity: 0.8;
      background: #1D293D;
    }
    75% {
      transform: scale(75);
      opacity: 0.6;
      background: #1D293D;
    }
    100% {
      transform: scale(150);
      opacity: 0;
      background: #1D293D;
    }
  }

  @keyframes rippleContract {
    0% {
      transform: scale(150);
      opacity: 0;
      background: #1D293D;
    }
    25% {
      transform: scale(75);
      opacity: 0.6;
      background: #1D293D;
    }
    50% {
      transform: scale(50);
      opacity: 0.8;
      background: #1D293D;
    }
    75% {
      transform: scale(25);
      opacity: 0.9;
      background: #1D293D;
    }
    100% {
      transform: scale(0);
      opacity: 1;
      background: #1D293D;
    }
  }

  .theme-ripple {
    position: fixed;
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    animation: rippleExpand 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    transform-origin: center;
    will-change: transform;
  }

  .theme-ripple.dark-to-light {
    animation: rippleContract 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .theme-transition {
    overflow: hidden !important;
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }

  .theme-transition::-webkit-scrollbar {
    display: none !important;
  }

  .theme-transition * {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }

  .theme-transition *::-webkit-scrollbar {
    display: none !important;
  }

  body.theme-transition {
    overflow: hidden !important;
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }

  body.theme-transition::-webkit-scrollbar {
    display: none !important;
  }

  body.theme-transition * {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }

  body.theme-transition *::-webkit-scrollbar {
    display: none !important;
  }

  html.theme-transition {
    overflow: hidden !important;
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }

  html.theme-transition::-webkit-scrollbar {
    display: none !important;
  }

  .theme-transition {
    overflow: hidden;
  }

  .theme-transition * {
    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  }

  .theme-transition {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .theme-transition::-webkit-scrollbar {
    display: none;
  }
`;
import Link from 'next/link';
import { 
  CogIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  CheckIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../hooks/useDarkMode';
import { BRAND_NAME } from '@/lib/config';
import GlobalSkeleton from './GlobalSkeleton';

interface User {
  _id: string;
  name: string;
  username: string;
  phoneNumber?: string;
  address?: string;
  role: string;
}

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onToggleSidebar: () => void;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
  updateUser: (updatedUser: User) => void;
  sessionStatus?: 'active' | 'refreshing' | 'expired';
}

export default function Navbar({ user, onLogout, onToggleSidebar, onToggleCollapse, isCollapsed, updateUser, sessionStatus = 'active' }: NavbarProps) {
  const { isDarkMode, toggleDarkMode, setSystemTheme, mounted } = useDarkMode();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const [screenSize, setScreenSize] = useState<number>(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('blue');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    name: '',
    username: '',
    phoneNumber: '',
    address: '',
    password: ''
  });
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  // Track screen size with debouncing
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

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Check if click is outside the profile dropdown
      if (isProfileDropdownOpen && !target.closest('[data-profile-dropdown]')) {
        setIsProfileDropdownOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileDropdownOpen]);

  // Cleanup theme transition on unmount
  useEffect(() => {
    return () => {
      // Ensure scrollbars are restored when component unmounts
      document.documentElement.classList.remove('theme-transition');
      document.body.classList.remove('theme-transition');
    };
  }, []);

  // PWA Install functionality - Simplified and reliable
  useEffect(() => {
    let mounted = true;

    // Check if app is already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      return isStandalone || isIOSStandalone;
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      if (mounted) {
        setDeferredPrompt(e);
      }
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      if (mounted) {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    };

    // Check initial state
    const isAlreadyInstalled = checkIfInstalled();
    setIsInstalled(isAlreadyInstalled);
    
    if (!isAlreadyInstalled) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
    }

    return () => {
      mounted = false;
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    setIsInstalling(true);

    try {
      if (deferredPrompt) {
        // Show the install prompt
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setCanInstall(false);
        }
      } else {
        // Always show manual instructions if no prompt available
        setShowManualInstructions(true);
      }
    } catch (error) {
      console.error('Installation error:', error);
      setShowManualInstructions(true);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleOpenInApp = () => {
    // If app is installed, try to open it in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      // Already in app mode, do nothing
      return;
    }
    
    // Try to open in app mode by redirecting to the same URL
    // This will trigger the browser to open in app mode if installed
    window.location.href = window.location.href;
  };

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

  // Optimized click handlers
  const handleToggleSidebar = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSidebar();
  }, [onToggleSidebar]);

  const handleToggleCollapse = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleCollapse();
  }, [onToggleCollapse]);

  const toggleProfileDropdown = useCallback(() => {
    setIsProfileDropdownOpen(prev => !prev);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  }, []);

  const handleThemeToggle = useCallback((event: React.MouseEvent) => {
    setIsThemeTransitioning(true);
    
    // Get button position for ripple effect
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Create ripple element
    const ripple = document.createElement('div');
    ripple.className = 'theme-ripple';
    
    // Set ripple position and size - ensure it covers the entire screen
    const screenWidth = Math.max(window.innerWidth, document.documentElement.clientWidth);
    const screenHeight = Math.max(window.innerHeight, document.documentElement.clientHeight);
    const maxDimension = Math.max(screenWidth, screenHeight);
    
    ripple.style.left = `${centerX - 10}px`;
    ripple.style.top = `${centerY - 10}px`;
    ripple.style.width = '20px';
    ripple.style.height = '20px';
    ripple.style.transformOrigin = 'center';
    
    // Set ripple direction based on current theme
    const isCurrentlyDark = isDarkMode;
    if (isCurrentlyDark) {
      ripple.classList.add('dark-to-light');
    }
    
    // Add ripple to body
    document.body.appendChild(ripple);
    
    // Add theme transition class to html and body
    document.documentElement.classList.add('theme-transition');
    document.body.classList.add('theme-transition');
    
    // Toggle dark mode
    toggleDarkMode();
    
    // Remove ripple and transition class after animation completes
    setTimeout(() => {
      try {
        if (document.body.contains(ripple)) {
          document.body.removeChild(ripple);
        }
        document.documentElement.classList.remove('theme-transition');
        document.body.classList.remove('theme-transition');
        setIsThemeTransitioning(false);
      } catch (error) {
        console.error('Error cleaning up theme transition:', error);
        // Force cleanup even if there's an error
        document.documentElement.classList.remove('theme-transition');
        document.body.classList.remove('theme-transition');
        setIsThemeTransitioning(false);
      }
    }, 500);
  }, [toggleDarkMode, isDarkMode]);

  // Helper functions
  const getUserInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const closeProfileDropdown = useCallback(() => {
    setIsProfileDropdownOpen(false);
  }, []);

  const handleSaveField = useCallback(async (field: string, value: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the user state locally
        if (user && data.user) {
          const updatedUser = { ...user, ...data.user };
          updateUser(updatedUser);
        }
        setEditingField(null);
        // Show success message or update UI
      } else {
        console.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  }, [user, updateUser]);

  const startEditing = useCallback((field: string) => {
    setEditingField(field);
    setEditValues({
      name: user?.name || '',
      username: user?.username || '',
      phoneNumber: user?.phoneNumber || '',
      address: user?.address || '',
      password: ''
    });
  }, [user]);

  const openProfileModal = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        // Update the user state with fresh data
        if (user) {
          const updatedUser = { ...user, ...userData };
          updateUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
    
    setShowProfileModal(true);
    closeProfileDropdown();
  }, [user, updateUser, closeProfileDropdown]);

  // Memoize sidebar toggle button
  const sidebarToggleButton = useMemo(() => {
    if (screenConfig.isSmallScreen) {
      // Mobile: Hamburger menu
      return (
        <button
          onClick={handleToggleSidebar}
          className={`p-2 rounded-lg transition-all duration-300 cursor-pointer ${
            isDarkMode 
              ? 'bg-white/10 text-white hover:bg-white/20' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } shadow-lg backdrop-blur-sm`}
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      );
    } else {
      // Desktop: Toggle collapse button with responsive text
      const isLargeScreen = screenSize >= 1600;
      
      return (
        <button
          onClick={(e) => {
            console.log('Navbar: Toggle collapse button clicked, current state:', isCollapsed);
            handleToggleCollapse(e);
          }}
          className={`p-2 rounded-lg transition-all duration-300 cursor-pointer ${
            isDarkMode 
              ? 'bg-white/10 text-white hover:bg-white/20' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } shadow-lg backdrop-blur-sm`}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <div className="flex items-center space-x-2">
            {isCollapsed ? (
              <ChevronRightIcon className="h-5 w-5" />
            ) : (
              <ChevronLeftIcon className="h-5 w-5" />
            )}
            {/* Show text only on large screens (1600px+) */}
            {isLargeScreen && (
              <span className="text-sm font-medium">
                {isCollapsed ? "Expand" : "Collapse"}
              </span>
            )}
          </div>
        </button>
      );
    }
  }, [screenConfig.isSmallScreen, isDarkMode, isCollapsed, handleToggleSidebar, handleToggleCollapse, screenSize]);

  // Show skeleton while not mounted
  if (!mounted) {
    return <GlobalSkeleton type="navbar" />;
  }

  return (
    <>
      {/* Inject custom CSS */}
      <style dangerouslySetInnerHTML={{ __html: sunGlowStyles }} />
      
      {/* Desktop Navbar */}
      <nav className={`hidden min-[800px]:block sticky top-0 z-30 transition-all duration-300 ${
        isDarkMode 
          ? 'bg-white/10 backdrop-blur-sm border-b border-white/10' 
          : 'bg-white/80 backdrop-blur-sm border-b border-gray-200/50'
      }`}>
        <div className={`transition-all duration-300 ${
          screenSize >= 1350 ? 'px-4 lg:px-6' :
          screenSize >= 1200 ? 'px-3 lg:px-4' :
          'px-3 sm:px-4'
        }`}>
          <div className="flex justify-between items-center py-3">
            {/* Left: Sidebar Toggle */}
            <div className="flex items-center">
              {sidebarToggleButton}
            </div>

            {/* Center: Empty space for future search */}
            <div className="flex-1"></div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-4">
              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className={`p-3 rounded-lg transition-all duration-300 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } shadow-lg backdrop-blur-sm`}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <ArrowsPointingInIcon className="h-5 w-5" /> : <ArrowsPointingOutIcon className="h-5 w-5" />}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={handleThemeToggle}
                disabled={isThemeTransitioning}
                className={`p-3 rounded-lg transition-all duration-500 cursor-pointer relative overflow-hidden ${
                  isDarkMode 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } shadow-lg backdrop-blur-sm group ${isThemeTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Toggle dark mode"
              >
                {/* Icon with rotation animation */}
                <div className={`relative transition-all duration-500 ease-in-out ${
                  isDarkMode ? 'rotate-180 scale-110' : 'rotate-0 scale-100'
                }`}>
                  {isDarkMode ? (
                    <SunIcon className="h-5 w-5 animate-[sunGlow_3s_ease-in-out_infinite]" />
                  ) : (
                    <MoonIcon className="h-5 w-5" />
                  )}
                </div>
                
                {/* Ripple effect */}
                <div className={`absolute inset-0 rounded-lg transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-white/5 scale-0 group-hover:scale-100' 
                    : 'bg-gray-400/10 scale-0 group-hover:scale-100'
                }`}></div>
              </button>



              {/* Profile Dropdown */}
              <div className="relative" data-profile-dropdown>
                <button
                  onClick={toggleProfileDropdown}
                  className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-300 cursor-pointer ${
                    isDarkMode 
                      ? 'bg-white/10 text-white hover:bg-white/20' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } shadow-lg backdrop-blur-sm`}
                  aria-label="User profile menu"
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white' 
                      : 'bg-gradient-to-br from-purple-600 to-purple-700 text-white'
                  } ${
                    sessionStatus === 'active' 
                      ? 'border-green-500' 
                      : sessionStatus === 'refreshing'
                      ? 'border-yellow-500 animate-pulse'
                      : 'border-red-500'
                  }`} title={`Session: ${sessionStatus}`}>
                    {user ? getUserInitials(user.name) : 'U'}
                  </div>
                  <span className={`hidden min-[800px]:block font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {user?.name || 'User'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg transition-all duration-300 z-50">
                    <div className={`py-2 transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-slate-800 border border-slate-700' 
                        : 'bg-white border border-gray-200'
                    } rounded-xl shadow-xl`}>
                      <div className={`px-4 py-3 border-b transition-colors duration-300 ${
                        isDarkMode ? 'border-slate-700' : 'border-gray-200'
                      }`}>
                        <p className={`text-sm font-medium transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {user?.name || 'User'}
                        </p>
                        <p className={`text-xs transition-colors duration-300 ${
                          isDarkMode ? 'text-purple-400' : 'text-purple-600'
                        }`}>
                          {user?.role === 'superadmin' ? 'Super Admin' : 'User'}
                        </p>
                      </div>
                      
                      <button
                        className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                          isDarkMode 
                            ? 'text-gray-300 hover:bg-slate-700' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={openProfileModal}
                      >
                        <div className="flex items-center space-x-2">
                          <UserIcon className="h-4 w-4" />
                          <span>Profile</span>
                        </div>
                      </button>
                      
                      <button
                        className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                          isDarkMode 
                            ? 'text-orange-300 hover:bg-orange-500/10' 
                            : 'text-orange-600 hover:bg-orange-50'
                        }`}
                        onClick={() => {
                          closeProfileDropdown();
                          setShowThemeModal(true);
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <SunIcon className="h-4 w-4" />
                          <span>Theme</span>
                        </div>
                      </button>
                      
                      <button
                        className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                          isDarkMode 
                            ? 'text-blue-300 hover:bg-blue-500/10' 
                            : 'text-blue-600 hover:bg-blue-50'
                        }`}
                        onClick={() => {
                          closeProfileDropdown();
                          toggleFullscreen();
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          {isFullscreen ? <ArrowsPointingInIcon className="h-4 w-4" /> : <ArrowsPointingOutIcon className="h-4 w-4" />}
                          <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                        </div>
                      </button>
                      
                      {/* Install App / Open in App Button */}
                      {isInstalled ? (
                        <button
                          className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                            isDarkMode 
                              ? 'text-green-300 hover:bg-green-500/10' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          onClick={() => {
                            closeProfileDropdown();
                            handleOpenInApp();
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <DevicePhoneMobileIcon className="h-4 w-4" />
                            <span>Open in App</span>
                          </div>
                        </button>
                      ) : (
                        <div className={`px-4 py-3 rounded-lg transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-purple-500/10 border border-purple-500/20' 
                            : 'bg-purple-50 border border-purple-200'
                        }`}>
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${
                              isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                            }`}>
                              <DevicePhoneMobileIcon className="h-5 w-5 text-purple-600" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-semibold ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                Install {BRAND_NAME}
                              </h4>
                              <p className={`text-xs mt-1 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                Get quick access to your CRM dashboard on your device
                              </p>
                              
                              <button
                                onClick={() => {
                                  closeProfileDropdown();
                                  handleInstallClick();
                                }}
                                disabled={isInstalling}
                                className={`mt-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                  isInstalling
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : isDarkMode
                                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                                }`}
                              >
                                {isInstalling ? 'Installing...' : 'Install'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className={`border-t transition-colors duration-300 ${
                        isDarkMode ? 'border-slate-700' : 'border-gray-200'
                      }`}>
                        <button
                          onClick={() => {
                            closeProfileDropdown();
                            // Clear session and redirect to login for account change
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            window.location.href = '/login';
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                            isDarkMode 
                              ? 'text-indigo-400 hover:bg-indigo-500/10' 
                              : 'text-indigo-600 hover:bg-indigo-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4" />
                            <span>Change Account</span>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            closeProfileDropdown();
                            onLogout();
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                            isDarkMode 
                              ? 'text-red-400 hover:bg-red-500/10' 
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <ArrowRightOnRectangleIcon className="h-4 w-4" />
                            <span>Logout</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className={`max-[799px]:block hidden sticky top-0 z-30 transition-all duration-300 ${
        isDarkMode 
          ? 'bg-white/10 backdrop-blur-sm border-b border-white/10' 
          : 'bg-white/80 backdrop-blur-sm border-b border-gray-200/50'
      }`}>
        <div className="px-3 py-3">
          <div className="flex justify-between items-center">
            {/* Mobile Menu Button */}
            <button
              onClick={onToggleSidebar}
              className={`p-2 rounded-lg transition-all duration-300 cursor-pointer ${
                isDarkMode 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } shadow-lg backdrop-blur-sm`}
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Mobile App Name */}
            <div className="flex items-center">
              <span className={`text-lg font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {BRAND_NAME}
              </span>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center space-x-2">
              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className={`p-2 rounded-lg transition-all duration-300 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } shadow-lg backdrop-blur-sm`}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <ArrowsPointingInIcon className="h-5 w-5" /> : <ArrowsPointingOutIcon className="h-5 w-5" />}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={handleThemeToggle}
                disabled={isThemeTransitioning}
                className={`p-2 rounded-lg transition-all duration-500 cursor-pointer relative overflow-hidden ${
                  isDarkMode 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } shadow-lg backdrop-blur-sm group ${isThemeTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Toggle dark mode"
              >
                {/* Icon with rotation animation */}
                <div className={`relative transition-all duration-500 ease-in-out ${
                  isDarkMode ? 'rotate-180 scale-110' : 'rotate-0 scale-100'
                }`}>
                  {isDarkMode ? (
                    <SunIcon className="h-5 w-5 animate-[sunGlow_3s_ease-in-out_infinite]" />
                  ) : (
                    <MoonIcon className="h-5 w-5" />
                  )}
                </div>
                
                {/* Ripple effect */}
                <div className={`absolute inset-0 rounded-lg transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-white/5 scale-0 group-hover:scale-100' 
                    : 'bg-gray-400/10 scale-0 group-hover:scale-100'
                }`}></div>
              </button>

              {/* Mobile Profile Button */}
              <div className="relative" data-profile-dropdown>
                <button
                  onClick={toggleProfileDropdown}
                  className={`p-2 rounded-lg transition-all duration-300 cursor-pointer ${
                    isDarkMode 
                      ? 'bg-white/10 text-white hover:bg-white/20' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } shadow-lg backdrop-blur-sm`}
                  aria-label="User profile menu"
                >
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white' 
                      : 'bg-gradient-to-br from-purple-600 to-purple-700 text-white'
                  }`}>
                    {user ? getUserInitials(user.name) : 'U'}
                  </div>
                </button>

                {/* Mobile Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg transition-all duration-300 z-50">
                    <div className={`py-2 transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-slate-800 border border-slate-700' 
                        : 'bg-white border border-gray-200'
                    } rounded-xl shadow-xl`}>
                      <div className={`px-3 py-2 border-b transition-colors duration-300 ${
                        isDarkMode ? 'border-slate-700' : 'border-gray-200'
                      }`}>
                        <p className={`text-sm font-medium transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {user?.name || 'User'}
                        </p>
                        <p className={`text-xs transition-colors duration-300 ${
                          isDarkMode ? 'text-purple-400' : 'text-purple-600'
                        }`}>
                          {user?.role === 'superadmin' ? 'Super Admin' : 'User'}
                        </p>
                      </div>
                      
                      <button
                        className={`w-full text-left px-3 py-2 text-sm transition-colors duration-200 ${
                          isDarkMode 
                            ? 'text-gray-300 hover:bg-slate-700' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={openProfileModal}
                      >
                        <div className="flex items-center space-x-2">
                          <UserIcon className="h-4 w-4" />
                          <span>Profile</span>
                        </div>
                      </button>
                      
                      <button
                        className={`w-full text-left px-3 py-2 text-sm transition-colors duration-200 ${
                          isDarkMode 
                            ? 'text-orange-300 hover:bg-orange-500/10' 
                            : 'text-orange-600 hover:bg-orange-50'
                        }`}
                        onClick={() => {
                          closeProfileDropdown();
                          setShowThemeModal(true);
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <SunIcon className="h-4 w-4" />
                          <span>Theme</span>
                        </div>
                      </button>
                      
                      <button
                        className={`w-full text-left px-3 py-2 text-sm transition-colors duration-200 ${
                          isDarkMode 
                            ? 'text-blue-300 hover:bg-blue-500/10' 
                            : 'text-blue-600 hover:bg-blue-50'
                        }`}
                        onClick={() => {
                          closeProfileDropdown();
                          toggleFullscreen();
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          {isFullscreen ? <ArrowsPointingInIcon className="h-4 w-4" /> : <ArrowsPointingOutIcon className="h-4 w-4" />}
                          <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                        </div>
                      </button>
                      
                      {/* Install App / Open in App Button */}
                      {isInstalled ? (
                        <button
                          className={`w-full text-left px-3 py-2 text-sm transition-colors duration-200 ${
                            isDarkMode 
                              ? 'text-green-300 hover:bg-green-500/10' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          onClick={() => {
                            closeProfileDropdown();
                            handleOpenInApp();
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <DevicePhoneMobileIcon className="h-4 w-4" />
                            <span>Open in App</span>
                          </div>
                        </button>
                      ) : (
                        <div className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-purple-500/10 border border-purple-500/20' 
                            : 'bg-purple-50 border border-purple-200'
                        }`}>
                          <div className="flex items-start space-x-2">
                            <div className={`p-1.5 rounded-lg ${
                              isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                            }`}>
                              <DevicePhoneMobileIcon className="h-4 w-4 text-purple-600" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-xs font-semibold ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                Install {BRAND_NAME}
                              </h4>
                              <p className={`text-xs mt-0.5 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                Get quick access to your CRM dashboard
                              </p>
                              
                              <button
                                onClick={() => {
                                  closeProfileDropdown();
                                  handleInstallClick();
                                }}
                                disabled={isInstalling}
                                className={`mt-1.5 px-2 py-1 text-xs font-medium rounded transition-colors ${
                                  isInstalling
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : isDarkMode
                                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                                }`}
                              >
                                {isInstalling ? 'Installing...' : 'Install'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className={`border-t transition-colors duration-300 ${
                        isDarkMode ? 'border-slate-700' : 'border-gray-200'
                      }`}>
                        <button
                          onClick={() => {
                            closeProfileDropdown();
                            // Clear session and redirect to login for account change
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            window.location.href = '/login';
                          }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors duration-200 ${
                            isDarkMode 
                              ? 'text-indigo-400 hover:bg-indigo-500/10' 
                              : 'text-indigo-600 hover:bg-indigo-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4" />
                            <span>Change Account</span>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            closeProfileDropdown();
                            onLogout();
                          }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors duration-200 ${
                            isDarkMode 
                              ? 'text-red-400 hover:bg-red-500/10' 
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <ArrowRightOnRectangleIcon className="h-4 w-4" />
                            <span>Logout</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          }`}>
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Profile
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-white/10'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* User Avatar and Basic Info */}
              <div className="flex items-center mb-6">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center text-xl font-semibold ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white' 
                    : 'bg-gradient-to-br from-purple-600 to-purple-700 text-white'
                }`}>
                  {user ? getUserInitials(user.name) : 'U'}
                </div>
                <div className="ml-4">
                  <h4 className={`text-lg font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {user?.name || 'User'}
                  </h4>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {user?.username || 'username'}
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                    user?.role === 'superadmin'
                      ? isDarkMode
                        ? 'bg-purple-900/20 text-purple-400'
                        : 'bg-purple-100 text-purple-800'
                      : isDarkMode
                        ? 'bg-blue-900/20 text-blue-400'
                        : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user?.role === 'superadmin' ? 'Super Admin' : 'User'}
                  </span>
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`block text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Name
                    </label>
                    {user?.role === 'superadmin' && (
                      <button
                        onClick={() => startEditing('name')}
                        className={`p-1 rounded transition-all duration-300 ${
                          isDarkMode
                            ? 'text-gray-400 hover:bg-white/10'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {editingField === 'name' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editValues.name}
                        onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors duration-300 ${
                          isDarkMode
                            ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                        }`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveField('name', e.currentTarget.value);
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveField('name', editValues.name)}
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          isDarkMode
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingField(null)}
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          isDarkMode
                            ? 'bg-gray-600 text-white hover:bg-gray-700'
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                        }`}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {user?.name || 'Not provided'}
                    </p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`block text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Username
                    </label>
                    {user?.role === 'superadmin' && (
                      <button
                        onClick={() => startEditing('username')}
                        className={`p-1 rounded transition-all duration-300 ${
                          isDarkMode
                            ? 'text-gray-400 hover:bg-white/10'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {editingField === 'username' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editValues.username}
                        onChange={(e) => setEditValues({ ...editValues, username: e.target.value })}
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors duration-300 ${
                          isDarkMode
                            ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                        }`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveField('username', e.currentTarget.value);
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveField('username', editValues.username)}
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          isDarkMode
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingField(null)}
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          isDarkMode
                            ? 'bg-gray-600 text-white hover:bg-gray-700'
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                        }`}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {user?.username || 'Not provided'}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`block text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Phone Number
                    </label>
                    {user?.role === 'superadmin' && (
                      <button
                        onClick={() => startEditing('phoneNumber')}
                        className={`p-1 rounded transition-all duration-300 ${
                          isDarkMode
                            ? 'text-gray-400 hover:bg-white/10'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {editingField === 'phoneNumber' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="tel"
                        value={editValues.phoneNumber}
                        onChange={(e) => setEditValues({ ...editValues, phoneNumber: e.target.value })}
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors duration-300 ${
                          isDarkMode
                            ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                        }`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveField('phoneNumber', e.currentTarget.value);
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveField('phoneNumber', editValues.phoneNumber)}
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          isDarkMode
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingField(null)}
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          isDarkMode
                            ? 'bg-gray-600 text-white hover:bg-gray-700'
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                        }`}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {user?.phoneNumber || 'Not provided'}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`block text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Address
                    </label>
                    {user?.role === 'superadmin' && (
                      <button
                        onClick={() => startEditing('address')}
                        className={`p-1 rounded transition-all duration-300 ${
                          isDarkMode
                            ? 'text-gray-400 hover:bg-white/10'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {editingField === 'address' ? (
                    <div className="flex items-start space-x-2">
                      <textarea
                        value={editValues.address}
                        onChange={(e) => setEditValues({ ...editValues, address: e.target.value })}
                        rows={3}
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors duration-300 resize-none ${
                          isDarkMode
                            ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                        }`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            handleSaveField('address', e.currentTarget.value);
                          }
                        }}
                        autoFocus
                      />
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => handleSaveField('address', editValues.address)}
                          className={`p-2 rounded-lg transition-all duration-300 ${
                            isDarkMode
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingField(null)}
                          className={`p-2 rounded-lg transition-all duration-300 ${
                            isDarkMode
                              ? 'bg-gray-600 text-white hover:bg-gray-700'
                              : 'bg-gray-600 text-white hover:bg-gray-700'
                          }`}
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {user?.address || 'Not provided'}
                    </p>
                  )}
                </div>

                {/* Password - Only for superadmin */}
                {user?.role === 'superadmin' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className={`block text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Password
                      </label>
                      <button
                        onClick={() => startEditing('password')}
                        className={`p-1 rounded transition-all duration-300 ${
                          isDarkMode
                            ? 'text-gray-400 hover:bg-white/10'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                    {editingField === 'password' ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="password"
                          value={editValues.password}
                          onChange={(e) => setEditValues({ ...editValues, password: e.target.value })}
                          className={`flex-1 px-3 py-2 rounded-lg border transition-colors duration-300 ${
                            isDarkMode
                              ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                          }`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveField('password', e.currentTarget.value);
                            }
                          }}
                          placeholder="Enter new password"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveField('password', editValues.password)}
                          className={`p-2 rounded-lg transition-all duration-300 ${
                            isDarkMode
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingField(null)}
                          className={`p-2 rounded-lg transition-all duration-300 ${
                            isDarkMode
                              ? 'bg-gray-600 text-white hover:bg-gray-700'
                              : 'bg-gray-600 text-white hover:bg-gray-700'
                          }`}
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        ••••••••
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className={`flex justify-between items-center p-6 border-t ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              {/* Left: Logout Button */}
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  onLogout();
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isDarkMode
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span>Logout</span>
              </button>

              {/* Right: Close Button */}
              <button
                onClick={() => setShowProfileModal(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-300 hover:bg-white/10'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Installation Instructions Modal */}
      {showManualInstructions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          }`}>
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Install {BRAND_NAME}
              </h3>
              <button
                onClick={() => setShowManualInstructions(false)}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-white/10'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-blue-900/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-800'
                  }`}>
                    Chrome / Edge / Brave
                  </h4>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-blue-200' : 'text-blue-700'
                  }`}>
                    Click the ⋮ menu → "Install {BRAND_NAME}" or "Add to Home Screen"
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-orange-900/20 border border-orange-500/30' : 'bg-orange-50 border border-orange-200'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    isDarkMode ? 'text-orange-300' : 'text-orange-800'
                  }`}>
                    Firefox
                  </h4>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-orange-200' : 'text-orange-700'
                  }`}>
                    Click the ⋮ menu → "Install App" or "Add to Home Screen"
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-purple-900/20 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    isDarkMode ? 'text-purple-300' : 'text-purple-800'
                  }`}>
                    Safari (iOS)
                  </h4>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-purple-200' : 'text-purple-700'
                  }`}>
                    Tap Share button → "Add to Home Screen"
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-green-900/20 border border-green-500/30' : 'bg-green-50 border border-green-200'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    isDarkMode ? 'text-green-300' : 'text-green-800'
                  }`}>
                    Samsung Internet
                  </h4>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-green-200' : 'text-green-700'
                  }`}>
                    Tap ⋮ menu → "Add page to" → "Home screen"
                  </p>
                </div>
              </div>
            </div>

            <div className={`flex justify-end p-6 border-t ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => setShowManualInstructions(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-300 hover:bg-white/10'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Theme Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          }`}>
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Theme Settings
              </h3>
              <button
                onClick={() => setShowThemeModal(false)}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-white/10'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Theme Mode
                </label>
                <div className="space-y-2">
                  <button
                    onClick={(e) => {
                      // Set dark mode
                      if (!isDarkMode) handleThemeToggle(e);
                      setShowThemeModal(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isDarkMode
                        ? 'bg-blue-600 text-white'
                        : isDarkMode
                          ? 'bg-slate-700 text-white hover:bg-slate-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <MoonIcon className="h-5 w-5" />
                      <span>Dark</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      // Set light mode
                      if (isDarkMode) handleThemeToggle(e);
                      setShowThemeModal(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                      !isDarkMode
                        ? 'bg-blue-600 text-white'
                        : isDarkMode
                          ? 'bg-slate-700 text-white hover:bg-slate-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <SunIcon className="h-5 w-5" />
                      <span>White</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      // Set system default (detect system preference)
                      setSystemTheme();
                      setShowThemeModal(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isDarkMode
                        ? 'bg-slate-700 text-white hover:bg-slate-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <CogIcon className="h-5 w-5" />
                      <span>System Default</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className={`flex justify-end space-x-3 p-6 border-t ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => setShowThemeModal(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-300 hover:bg-white/10'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}