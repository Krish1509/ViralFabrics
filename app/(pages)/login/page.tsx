'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  UserIcon, 
  LockClosedIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

interface LoginFormData {
  username: string;
  password: string;
  rememberMe: boolean;
}

interface LoginErrors {
  username?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Check for dark mode preference
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(savedMode ? savedMode === 'true' : prefersDark);
  }, []);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => setShowSuccessMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.user.role === 'superadmin') {
          router.push('/dashboard/superadmin');
        } else {
          router.push('/dashboard/user');
        }
      } else {
        setErrors({ general: data.error || 'Login failed' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof LoginErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

     return (
     <div className={`min-h-screen flex flex-col justify-center items-center relative p-6 transition-colors duration-300 ${
       isDarkMode 
         ? 'bg-slate-800' 
         : 'bg-blue-50'
     }`}>
      {/* Theme Toggle */}
      <button
        onClick={toggleDarkMode}
        className={`absolute top-6 right-6 p-3 rounded-full transition-all duration-300 cursor-pointer ${
          isDarkMode 
            ? 'bg-white/10 text-white hover:bg-white/20' 
            : 'bg-white/80 text-gray-700 hover:bg-white'
        } shadow-lg backdrop-blur-sm`}
      >
        {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
      </button>

             {/* Main Card */}
       <div className={`w-full max-w-md relative z-10 ${
         isDarkMode 
           ? 'bg-white/10 backdrop-blur-sm border border-white/10 shadow-[0_0_10px_rgba(0,0,0,0.1)]' 
           : 'bg-white/80 border border-gray-200/50 shadow-[0_0_10px_rgba(30,64,175,0.4)]'
       } rounded-xl transition-all duration-300`}>
        <div className="p-8">
          {/* Logo */}
          <div className="flex justify-center items-center mb-6">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-lg transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25' 
                : 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/25'
            }`}>
              <BuildingOfficeIcon className="h-5 w-5 text-white" />
            </div>
            <span className={`ml-3 text-2xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              CRM
            </span>
          </div>

                     {/* Header */}
           <div className="text-left mb-8">
             <h1 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
               isDarkMode ? 'text-white' : 'text-gray-900'
             }`}>
               Adventure starts here 🚀
             </h1>
             <p className={`text-base transition-colors duration-300 ${
               isDarkMode ? 'text-gray-300' : 'text-gray-600'
             }`}>
               Make your app management easy and fun!
             </p>
           </div>

          {/* Success Message */}
          {showSuccessMessage && (
            <div className={`mb-6 p-4 rounded-lg border transition-all duration-300 ${
              isDarkMode 
                ? 'bg-green-500/20 border-green-400/30' 
                : 'bg-green-50 border-green-200'
            } animate-in slide-in-from-top-2 duration-300`}>
              <div className="flex items-center">
                <CheckCircleIcon className={`h-5 w-5 mr-3 flex-shrink-0 ${
                  isDarkMode ? 'text-green-400' : 'text-green-600'
                }`} />
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-green-200' : 'text-green-700'
                }`}>
                  Account created successfully! Please sign in.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errors.general && (
            <div className={`mb-6 p-4 rounded-lg border transition-all duration-300 ${
              isDarkMode 
                ? 'bg-red-500/20 border-red-400/30' 
                : 'bg-red-50 border-red-200'
            } animate-in slide-in-from-top-2 duration-300`}>
              <div className="flex items-center">
                <ExclamationTriangleIcon className={`h-5 w-5 mr-3 flex-shrink-0 ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`} />
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-red-200' : 'text-red-700'
                }`}>
                  {errors.general}
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                                     className={`block w-full px-4 py-4 border rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 ${
                     isDarkMode 
                       ? 'bg-white/10 text-white border-white/20 backdrop-blur-sm' 
                       : 'bg-white text-gray-900 border-gray-300'
                   } ${
                     errors.username 
                       ? 'border-red-400 focus:ring-red-500/50 focus:border-red-400' 
                       : ''
                   } ${
                     focusedField === 'username' || formData.username
                       ? 'border-blue-500' 
                       : ''
                   }`}
                  placeholder=""
                />
                                 <label className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                   focusedField === 'username' || formData.username
                     ? isDarkMode 
                       ? 'top-[-10px] text-sm font-extralight text-white bg-[#343F51] px-1   border-blue-500 rounded-md'
                       : 'top-[-10px] text-sm font-medium text-blue-500 bg-white px-1'
                     : isDarkMode ? 'top-4 text-sm text-gray-300' : 'top-4 text-sm text-gray-500'
                 } ${isDarkMode && (focusedField === 'username' || formData.username) ? 'bg-[#5A6371]' : ''}`}>
                  Username
                </label>
              </div>
              {errors.username && (
                <p className="text-sm text-red-500 animate-in slide-in-from-top-1 duration-200">
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type={isPasswordShown ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                                     className={`block w-full px-4 pr-12 py-4 border rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 ${
                     isDarkMode 
                       ? 'bg-white/10 text-white border-white/20 backdrop-blur-sm' 
                       : 'bg-white text-gray-900 border-gray-300'
                   } ${
                     errors.password 
                       ? 'border-red-400 focus:ring-red-500/50 focus:border-red-400' 
                       : ''
                   } ${
                     focusedField === 'password' || formData.password
                       ? 'border-blue-500' 
                       : ''
                   }`}
                  placeholder=""
                />
                                 <label className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                   focusedField === 'password' || formData.password
                     ? isDarkMode 
                       ? 'top-[-10px] text-sm font-extralight text-white bg-[#343F51] px-1   border-blue-500 rounded-md'
                       : 'top-[-10px] text-sm font-medium text-blue-500 bg-white px-1'
                     : isDarkMode ? 'top-4 text-sm text-gray-300' : 'top-4 text-sm text-gray-500'
                 } ${isDarkMode && (focusedField === 'password' || formData.password) ? 'bg-slate-800' : ''}`}>
                  Password
                </label>
                <button
                  type="button"
                  className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  onClick={() => setIsPasswordShown(!isPasswordShown)}
                >
                  {isPasswordShown ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 animate-in slide-in-from-top-1 duration-200">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex justify-between items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  className={`w-4 h-4 rounded border-2 transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-white/10 border-white/30 text-blue-500 focus:ring-blue-500/50' 
                      : 'bg-white border-gray-300 text-blue-600 focus:ring-blue-500/50'
                  }`}
                />
                <span className={`ml-2 text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className={`text-sm font-medium transition-colors duration-200 ${
                  isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                }`}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/25 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center">
                  <span>Sign In</span>
                  <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8">
        <p className={`text-xs transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          © 2024 CRM Admin Panel. All rights reserved.
        </p>
      </div>
    </div>
  );
}
