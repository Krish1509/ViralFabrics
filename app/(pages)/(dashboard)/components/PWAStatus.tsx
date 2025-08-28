'use client';

import { useState, useEffect } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function PWAStatus() {
  const { isDarkMode } = useDarkMode();
  const [pwaStatus, setPwaStatus] = useState({
    manifest: false,
    serviceWorker: false,
    canInstall: false,
    isOnline: true
  });

  useEffect(() => {
    const checkPWAStatus = () => {
      const status = {
        manifest: !!document.querySelector('link[rel="manifest"]'),
        serviceWorker: 'serviceWorker' in navigator,
        canInstall: !!(window as any).deferredPrompt,
        isOnline: navigator.onLine
      };
      setPwaStatus(status);
    };

    checkPWAStatus();
    
    // Check again after a delay
    const timer = setTimeout(checkPWAStatus, 2000);     
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`fixed bottom-4 left-4 z-40 p-3 rounded-lg shadow-lg border ${
      isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'
    } max-w-xs`}>
      <h3 className={`text-xs font-semibold mb-2 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        PWA Status
      </h3>
      
      <div className={`text-xs space-y-1 ${
        isDarkMode ? 'text-gray-300' : 'text-gray-600'
      }`}>
        <div className="flex items-center space-x-2">
          {pwaStatus.manifest ? (
            <CheckCircleIcon className="h-3 w-3 text-green-500" />
          ) : (
            <XCircleIcon className="h-3 w-3 text-red-500" />
          )}
          <span>Manifest</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {pwaStatus.serviceWorker ? (
            <CheckCircleIcon className="h-3 w-3 text-green-500" />
          ) : (
            <XCircleIcon className="h-3 w-3 text-red-500" />
          )}
          <span>Service Worker</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {pwaStatus.canInstall ? (
            <CheckCircleIcon className="h-3 w-3 text-green-500" />
          ) : (
            <ExclamationTriangleIcon className="h-3 w-3 text-yellow-500" />
          )}
          <span>Can Install</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {pwaStatus.isOnline ? (
            <CheckCircleIcon className="h-3 w-3 text-green-500" />
          ) : (
            <XCircleIcon className="h-3 w-3 text-red-500" />
          )}
          <span>Online</span>
        </div>
      </div>
    </div>
  );
}
