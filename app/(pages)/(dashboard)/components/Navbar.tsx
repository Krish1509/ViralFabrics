'use client';

import { useState, useEffect } from 'react';
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
  CheckIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../hooks/useDarkMode';

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
}

export default function Navbar({ user, onLogout, onToggleSidebar, onToggleCollapse, isCollapsed, updateUser }: NavbarProps) {
  const { isDarkMode, toggleDarkMode, setSystemTheme } = useDarkMode();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const [screenSize, setScreenSize] = useState<number>(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('blue');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    name: '',
    username: '',
    phoneNumber: '',
    address: '',
    password: ''
  });

  // Track screen size
  useEffect(() => {
    const handleResize = () => {
      setScreenSize(window.innerWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const closeProfileDropdown = () => {
    setIsProfileDropdownOpen(false);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSaveField = async (field: string, value: string) => {
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
  };

  const startEditing = (field: string) => {
    setEditingField(field);
    setEditValues({
      name: user?.name || '',
      username: user?.username || '',
      phoneNumber: user?.phoneNumber || '',
      address: user?.address || '',
      password: ''
    });
  };

  const openProfileModal = async () => {
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
  };

  // Determine screen size categories
  const isLargeScreen = screenSize >= 1200;
  const isMediumScreen = screenSize >= 800 && screenSize < 1200;
  const isSmallScreen = screenSize < 800;

  // Determine which sidebar toggle to show
  const getSidebarToggleButton = () => {
    if (isSmallScreen) {
      // Mobile: Hamburger menu
      return (
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
      );
    } else {
      // Desktop: Toggle collapse button
      return (
        <button
          onClick={onToggleCollapse}
          className={`p-2 rounded-lg transition-all duration-300 cursor-pointer ${
            isDarkMode 
              ? 'bg-white/10 text-white hover:bg-white/20' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } shadow-lg backdrop-blur-sm`}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      );
    }
  };

  return (
    <>
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
              {getSidebarToggleButton()}
            </div>

            {/* Center: Empty space for future search */}
            <div className="flex-1"></div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-3 rounded-lg transition-all duration-300 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } shadow-lg backdrop-blur-sm`}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={toggleProfileDropdown}
                  className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-300 cursor-pointer ${
                    isDarkMode 
                      ? 'bg-white/10 text-white hover:bg-white/20' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } shadow-lg backdrop-blur-sm`}
                  aria-label="User profile menu"
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white' 
                      : 'bg-gradient-to-br from-purple-600 to-purple-700 text-white'
                  }`}>
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
                      
                      <div className={`border-t transition-colors duration-300 ${
                        isDarkMode ? 'border-slate-700' : 'border-gray-200'
                      }`}>
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
                CRM Admin
              </span>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center space-x-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-all duration-300 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } shadow-lg backdrop-blur-sm`}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </button>

              {/* Mobile Profile Button */}
              <div className="relative">
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
                      
                      <div className={`border-t transition-colors duration-300 ${
                        isDarkMode ? 'border-slate-700' : 'border-gray-200'
                      }`}>
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
                    onClick={() => {
                      // Set dark mode
                      if (!isDarkMode) toggleDarkMode();
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
                    onClick={() => {
                      // Set light mode
                      if (isDarkMode) toggleDarkMode();
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