'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BuildingOfficeIcon,
  BellIcon,
  CogIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../hooks/useDarkMode';

interface User {
  _id: string;
  name: string;
  username: string;
  role: string;
}

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export default function Navbar({ user, onLogout, onToggleSidebar }: NavbarProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);



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

  return (
    <>
             {/* Desktop Navbar */}
       <nav className={`hidden lg:block sticky top-0 z-40 transition-all duration-300 ${
         isDarkMode 
           ? 'bg-white/10 backdrop-blur-sm border-b border-white/10' 
           : 'bg-white/80 backdrop-blur-sm border-b border-gray-200/50'
       }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
                         {/* Left: App Name Only */}
             <div className="flex items-center">
               <h1 className={`text-xl font-bold transition-colors duration-300 ${
                 isDarkMode ? 'text-white' : 'text-gray-900'
               }`}>
                 CRM Admin Panel
               </h1>
             </div>

            {/* Center: Empty space for future search */}
            <div className="flex-1"></div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-3 rounded-full transition-all duration-300 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } shadow-lg backdrop-blur-sm`}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </button>

              {/* Notification Bell */}
              <button
                className={`relative p-3 rounded-full transition-all duration-300 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } shadow-lg backdrop-blur-sm`}
                aria-label="Notifications"
              >
                <BellIcon className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
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
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' 
                      : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                  }`}>
                    {user ? getUserInitials(user.name) : 'U'}
                  </div>
                  <span className={`hidden lg:block font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {user?.name || 'User'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg transition-all duration-300 z-50">
                    <div className={`py-2 transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-white/10 backdrop-blur-sm border border-white/10' 
                        : 'bg-white border border-gray-200/50'
                    } rounded-xl shadow-xl`}>
                      <div className={`px-4 py-3 border-b transition-colors duration-300 ${
                        isDarkMode ? 'border-white/10' : 'border-gray-200'
                      }`}>
                        <p className={`text-sm font-medium transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {user?.name || 'User'}
                        </p>
                        <p className={`text-xs transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {user?.username || 'user@example.com'}
                        </p>
                      </div>
                      
                      <button
                        className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                          isDarkMode 
                            ? 'text-gray-300 hover:bg-white/10' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={closeProfileDropdown}
                      >
                        <div className="flex items-center space-x-2">
                          <UserIcon className="h-4 w-4" />
                          <span>View Profile</span>
                        </div>
                      </button>
                      
                      <button
                        className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                          isDarkMode 
                            ? 'text-gray-300 hover:bg-white/10' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={closeProfileDropdown}
                      >
                        <div className="flex items-center space-x-2">
                          <CogIcon className="h-4 w-4" />
                          <span>Settings</span>
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
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

             {/* Mobile Navbar */}
       <nav className={`lg:hidden sticky top-0 z-40 transition-all duration-300 ${
         isDarkMode 
           ? 'bg-white/10 backdrop-blur-sm border-b border-white/10' 
           : 'bg-white/80 backdrop-blur-sm border-b border-gray-200/50'
       }`}>
        <div className="px-4 py-4">
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

              {/* Notification Bell */}
              <button
                className={`relative p-2 rounded-lg transition-all duration-300 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } shadow-lg backdrop-blur-sm`}
                aria-label="Notifications"
              >
                <BellIcon className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

               </nav>
    </>
  );
}
