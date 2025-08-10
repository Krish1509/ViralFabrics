'use client';

import { useState, useEffect, Suspense } from 'react';
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

// Separate component for search params logic
function LoginForm() {
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
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect based on role
        if (data.user.role === 'superadmin') {
          router.push('/dashboard/superadmin');
        } else {
          router.push('/dashboard/user');
        }
      } else {
        console.error('Login failed:', { status: response.status, data });
        setErrors({ general: data.message || `Login failed (${response.status})` });
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
    // Clear error when user starts typing
    if (errors[field as keyof LoginErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleInputFocus = (field: string) => {
    setFocusedField(field);
  };

  const handleInputBlur = () => {
    setFocusedField(null);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Background Graphics for larger screens */}
      <div className="hidden md:block fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z" fill="currentColor" className="text-blue-600"/>
          </svg>
        </div>
        <div className="absolute top-20 right-20 w-24 h-24 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M20 20 L80 20 L80 80 L20 80 Z" fill="currentColor" className="text-indigo-600"/>
          </svg>
        </div>
        <div className="absolute bottom-20 left-20 w-20 h-20 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="40" fill="currentColor" className="text-purple-600"/>
          </svg>
        </div>
      </div>

      {/* Main Login Card */}
      <div className={`w-full max-w-md relative z-10 transition-all duration-300 ${
        isDarkMode
          ? 'bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl shadow-blue-800/50'
          : 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl shadow-blue-800/20'
      } rounded-xl p-8`}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
              isDarkMode
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25'
                : 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/25'
            }`}>
              <BuildingOfficeIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <h1 className={`text-xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                CRM
              </h1>
            </div>
          </div>
          
          <h2 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Adventure starts here 🚀
          </h2>
          <p className={`text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Make your app management easy and fun!
          </p>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <span className="text-green-800 text-sm">Registration successful! Please log in.</span>
          </div>
        )}

        {/* Error Message */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <span className="text-red-800 text-sm">{errors.general}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div className="relative">
            <div className={`relative transition-all duration-300 ${
              focusedField === 'username' 
                ? 'ring-2 ring-blue-500 ring-opacity-50' 
                : ''
            }`}>
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <UserIcon className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                onFocus={() => handleInputFocus('username')}
                onBlur={handleInputBlur}
                placeholder="Username"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-white/20'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                } ${errors.username ? 'border-red-500' : ''}`}
              />
              {focusedField === 'username' && (
                <div className={`absolute -top-2 left-3 px-2 text-xs font-medium transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-blue-400 bg-transparent' 
                    : 'text-blue-500 bg-white'
                }`}>
                  Username
                </div>
              )}
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="relative">
            <div className={`relative transition-all duration-300 ${
              focusedField === 'password' 
                ? 'ring-2 ring-blue-500 ring-opacity-50' 
                : ''
            }`}>
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <LockClosedIcon className="h-5 w-5" />
              </div>
              <input
                type={isPasswordShown ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onFocus={() => handleInputFocus('password')}
                onBlur={handleInputBlur}
                placeholder="Password"
                className={`w-full pl-10 pr-12 py-3 border rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-white/20'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                } ${errors.password ? 'border-red-500' : ''}`}
              />
              {focusedField === 'password' && (
                <div className={`absolute -top-2 left-3 px-2 text-xs font-medium transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-blue-400 bg-transparent' 
                    : 'text-blue-500 bg-white'
                }`}>
                  Password
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsPasswordShown(!isPasswordShown)}
                className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {isPasswordShown ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                className={`w-4 h-4 rounded transition-colors duration-300 ${
                  isDarkMode
                    ? 'bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500/20'
                    : 'bg-white border-gray-300 text-blue-600 focus:ring-blue-500/20'
                }`}
              />
              <span className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Remember me
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-300 cursor-pointer ${
              isLoading
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Sign in</span>
                <ArrowRightIcon className="h-4 w-4" />
              </div>
            )}
          </button>
        </form>

        {/* Theme Toggle */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-all duration-300 ${
              isDarkMode
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
