'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldExclamationIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../hooks/useDarkMode';

export default function AccessDeniedPage() {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    // Get user info from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

 

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-slate-800' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    }`}>
      <div className={`max-w-md w-full mx-auto p-8 rounded-xl shadow-2xl ${
        isDarkMode 
          ? 'bg-slate-700 border border-slate-600' 
          : 'bg-white border border-gray-200'
      }`}>
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className={`p-4 rounded-full ${
            isDarkMode 
              ? 'bg-red-500/20 text-red-400' 
              : 'bg-red-100 text-red-600'
          }`}>
            <ShieldExclamationIcon className="h-12 w-12" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className={`text-2xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Access Denied
          </h1>
          <p className={`text-lg ${
            isDarkMode ? 'text-red-400' : 'text-red-600'
          }`}>
            Superadmin Access Only
          </p>
        </div>

        {/* Message */}
        <div className={`text-center mb-8 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          <p className="mb-4">
            You don't have permission to access this page. This area is restricted to superadmin users only.
          </p>
          {user && (
            <div className={`p-4 rounded-lg ${
              isDarkMode 
                ? 'bg-slate-600/50 border border-slate-500' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <p className="text-sm">
                <span className="font-medium">Current User:</span> {user.name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Role:</span> {user.role === 'superadmin' ? 'Super Admin' : 'User'}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
         
          
          <button
            onClick={handleGoHome}
            className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              isDarkMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Go to Dashboard
          </button>
        </div>

        {/* Footer */}
        <div className={`text-center mt-8 text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <p>If you believe this is an error, please contact your system administrator.</p>
        </div>
      </div>
    </div>
  );
}
