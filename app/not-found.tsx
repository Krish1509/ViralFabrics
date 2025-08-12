'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from './components/ThemeProvider';

export default function NotFound() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-md w-full mx-auto text-center px-6">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-6xl font-bold ${
            isDarkMode 
              ? 'bg-gray-800 text-red-400' 
              : 'bg-white text-red-500 shadow-lg'
          }`}>
            404
          </div>
        </div>

        {/* Error Message */}
        <h1 className={`text-4xl font-bold mb-4 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Oops! Page Not Found
        </h1>
        
        <p className={`text-lg mb-8 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          The page you're looking for doesn't exist or may have been moved.
        </p>

        {/* Go Back Button */}
        <button
          onClick={handleGoBack}
          className={`w-full py-4 px-8 rounded-lg font-medium text-lg transition-all duration-200 ${
            isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
          }`}
        >
          ← Go Back
        </button>

        {/* Help Text */}
        <p className={`mt-8 text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Need help? Contact our support team.
        </p>
      </div>
    </div>
  );
}
