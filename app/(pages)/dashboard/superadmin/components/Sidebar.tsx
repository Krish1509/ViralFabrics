'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon,
  UsersIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../hooks/useDarkMode';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard/superadmin',
    icon: HomeIcon
  },
  {
    name: 'Manage Users',
    href: '/dashboard/superadmin/users',
    icon: UsersIcon,
    badge: 'New'
  },
  {
    name: 'Companies',
    href: '/dashboard/superadmin/companies',
    icon: BuildingOfficeIcon
  },
  {
    name: 'Reports',
    href: '/dashboard/superadmin/reports',
    icon: ChartBarIcon
  },
  {
    name: 'Documents',
    href: '/dashboard/superadmin/documents',
    icon: DocumentTextIcon
  },
  {
    name: 'User Groups',
    href: '/dashboard/superadmin/groups',
    icon: UserGroupIcon
  },
  {
    name: 'Security',
    href: '/dashboard/superadmin/security',
    icon: ShieldCheckIcon
  },
  {
    name: 'Settings',
    href: '/dashboard/superadmin/settings',
    icon: Cog6ToothIcon
  }
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { isDarkMode } = useDarkMode();



  const isActive = (href: string) => {
    if (href === '/dashboard/superadmin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
             {/* Desktop Sidebar */}
       <aside className={`hidden lg:block fixed left-0 top-0 h-full w-64 z-30 transition-all duration-300 ${
         isDarkMode 
           ? 'bg-slate-800 border-r border-slate-700' 
           : 'bg-white/80 backdrop-blur-sm border-r border-gray-200/50'
       }`}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className={`p-6 border-b transition-colors duration-300 ${
            isDarkMode ? 'border-white/10' : 'border-gray-200'
          }`}>
            <Link 
              href="/dashboard/superadmin" 
              className="flex items-center space-x-3 group cursor-pointer"
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-lg transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25' 
                  : 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/25'
              } group-hover:scale-105`}>
                <BuildingOfficeIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className={`text-lg font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  CRM Admin
                </h1>
                <p className={`text-xs transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Super Admin
                </p>
              </div>
            </Link>
          </div>

                     {/* Navigation */}
           <nav className={`flex-1 px-4 py-6 space-y-2 overflow-y-auto max-h-[calc(100vh-140px)] ${
             isDarkMode 
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
                  className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                    active
                      ? isDarkMode
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-colors duration-300 ${
                    active
                      ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      : isDarkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  <span className="font-medium">{item.name}</span>
                  {item.badge && (
                    <span className={`ml-auto px-2 py-1 text-xs font-medium rounded-full ${
                      isDarkMode 
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

          {/* Footer */}
          <div className={`p-4 border-t transition-colors duration-300 ${
            isDarkMode ? 'border-white/10' : 'border-gray-200'
          }`}>
            <div className={`text-xs text-center transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              © 2024 CRM Admin Panel
            </div>
          </div>
        </div>
      </aside>

             {/* Mobile Sidebar Overlay */}
       {isOpen && (
         <div 
           className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 lg:hidden"
           onClick={onClose}
         />
       )}

             {/* Mobile Sidebar */}
       <aside className={`fixed left-0 top-0 h-full w-80 z-60 lg:hidden transition-transform duration-300 ${
         isOpen ? 'translate-x-0' : '-translate-x-full'
       } ${
         isDarkMode 
           ? 'bg-slate-800 border-r border-slate-700' 
           : 'bg-white/80 backdrop-blur-sm border-r border-gray-200/50'
       }`}>
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className={`flex items-center justify-between p-6 border-b transition-colors duration-300 ${
            isDarkMode ? 'border-white/10' : 'border-gray-200'
          }`}>
            <Link 
              href="/dashboard/superadmin" 
              className="flex items-center space-x-3 group cursor-pointer"
              onClick={onClose}
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-lg transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25' 
                  : 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/25'
              } group-hover:scale-105`}>
                <BuildingOfficeIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className={`text-lg font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  CRM Admin
                </h1>
                <p className={`text-xs transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Super Admin
                </p>
              </div>
            </Link>
            
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-all duration-300 cursor-pointer ${
                isDarkMode 
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
             isDarkMode 
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
                      ? isDarkMode
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-colors duration-300 ${
                    active
                      ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      : isDarkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  <span className="font-medium">{item.name}</span>
                  {item.badge && (
                    <span className={`ml-auto px-2 py-1 text-xs font-medium rounded-full ${
                      isDarkMode 
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
            isDarkMode ? 'border-white/10' : 'border-gray-200'
          }`}>
            <div className={`text-xs text-center transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              © 2024 CRM Admin Panel
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
