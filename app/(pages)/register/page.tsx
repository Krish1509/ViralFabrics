'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  UserIcon, 
  LockClosedIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  SunIcon,
  MoonIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

interface RegisterFormData {
  name: string;
  username: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  address: string;
  agreeToTerms: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: '',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(savedMode ? savedMode === 'true' : prefersDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
          address: formData.address
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/login?registered=true');
      } else {
        setErrors({ general: data.message || 'Registration failed' });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    }`}>
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className={`mx-auto h-16 w-16 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25' 
              : 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/25'
          }`}>
            <BuildingOfficeIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className={`mt-6 text-3xl font-bold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Create Account
          </h2>
          <p className={`mt-2 text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Join our CRM platform today
          </p>
        </div>

        {/* Theme Toggle */}
        <div className="flex justify-center">
          <button
            onClick={toggleDarkMode}
            className={`p-3 rounded-full transition-all duration-300 cursor-pointer ${
              isDarkMode 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-white/80 text-gray-700 hover:bg-white shadow-lg backdrop-blur-sm'
            }`}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
        </div>

        {/* Form */}
        <div className={`mt-8 space-y-6 rounded-xl p-8 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-white/5 backdrop-blur-sm border border-white/10' 
            : 'bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-xl'
        }`}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name Field */}
            <div>
              <label htmlFor="name" className={`block text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Full Name
              </label>
              <div className="mt-1 relative">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <UserIcon className="h-5 w-5" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg transition-all duration-300 ${
                    isDarkMode
                      ? 'border-white/20 bg-white/5 text-white placeholder-gray-400 focus:border-white/40'
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Username Field */}
            <div>
              <label htmlFor="username" className={`block text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Username
              </label>
              <div className="mt-1 relative">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <UserIcon className="h-5 w-5" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg transition-all duration-300 ${
                    isDarkMode
                      ? 'border-white/20 bg-white/5 text-white placeholder-gray-400 focus:border-white/40'
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                  placeholder="Choose a username"
                />
              </div>
            </div>

            {/* Phone Number Field */}
            <div>
              <label htmlFor="phoneNumber" className={`block text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Phone Number
              </label>
              <div className="mt-1 relative">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <PhoneIcon className="h-5 w-5" />
                </div>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg transition-all duration-300 ${
                    isDarkMode
                      ? 'border-white/20 bg-white/5 text-white placeholder-gray-400 focus:border-white/40'
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Address Field */}
            <div>
              <label htmlFor="address" className={`block text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Address
              </label>
              <div className="mt-1 relative">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <MapPinIcon className="h-5 w-5" />
                </div>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg transition-all duration-300 ${
                    isDarkMode
                      ? 'border-white/20 bg-white/5 text-white placeholder-gray-400 focus:border-white/40'
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none`}
                  placeholder="Enter your address"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className={`block text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Password
              </label>
              <div className="mt-1 relative">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <LockClosedIcon className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={isPasswordShown ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`block w-full pl-10 pr-12 py-3 border rounded-lg transition-all duration-300 ${
                    isDarkMode
                      ? 'border-white/20 bg-white/5 text-white placeholder-gray-400 focus:border-white/40'
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordShown(!isPasswordShown)}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {isPasswordShown ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className={`block text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <LockClosedIcon className="h-5 w-5" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={isConfirmPasswordShown ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`block w-full pl-10 pr-12 py-3 border rounded-lg transition-all duration-300 ${
                    isDarkMode
                      ? 'border-white/20 bg-white/5 text-white placeholder-gray-400 focus:border-white/40'
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setIsConfirmPasswordShown(!isConfirmPasswordShown)}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {isConfirmPasswordShown ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                  className={`h-4 w-4 rounded transition-colors duration-300 ${
                    isDarkMode
                      ? 'border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500'
                      : 'border-gray-300 bg-white text-blue-600 focus:ring-blue-500'
                  } focus:ring-2 focus:ring-opacity-50`}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agreeToTerms" className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  I agree to the{' '}
                  <a href="#" className={`font-medium hover:underline transition-colors duration-300 ${
                    isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                  }`}>
                    Terms and Conditions
                  </a>
                </label>
              </div>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  {errors.general}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg transition-all duration-300 ${
                  isLoading
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                      : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50`}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    Create Account
                    <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="text-center">
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Already have an account?{' '}
              <a 
                href="/login" 
                className={`font-medium hover:underline transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                }`}
              >
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
