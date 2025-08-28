'use client';

import { useState, useEffect } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';

export default function PWADebug() {
  const { isDarkMode } = useDarkMode();
  const [pwaStatus, setPwaStatus] = useState({
    isInstalled: false,
    hasManifest: false,
    hasServiceWorker: false,
    isStandalone: false,
    canInstall: false,
    deferredPrompt: false
  });

  useEffect(() => {
    const checkPWAStatus = () => {
      const status = {
        isInstalled: window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone === true,
        hasManifest: !!document.querySelector('link[rel="manifest"]'),
        hasServiceWorker: 'serviceWorker' in navigator,
        isStandalone: window.matchMedia('(display-mode: standalone)').matches,
        canInstall: false,
        deferredPrompt: false
      };

      // Check if we can install (this will be set by the install button component)
      if ((window as any).deferredPrompt) {
        status.canInstall = true;
        status.deferredPrompt = true;
      }

      setPwaStatus(status);
    };

    checkPWAStatus();
    
    // Check again after a delay to catch service worker registration
    const timer = setTimeout(checkPWAStatus, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Only show on localhost for debugging
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return null;
  }

  return (
    <div className={`fixed top-16 right-4 z-40 p-4 rounded-lg shadow-lg border ${
      isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'
    } max-w-xs`}>
      <h3 className={`text-sm font-semibold mb-2 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        PWA Debug Info
      </h3>
      
      <div className={`text-xs space-y-1 ${
        isDarkMode ? 'text-gray-300' : 'text-gray-600'
      }`}>
        <div className="flex justify-between">
          <span>Manifest:</span>
          <span className={pwaStatus.hasManifest ? 'text-green-500' : 'text-red-500'}>
            {pwaStatus.hasManifest ? '✅' : '❌'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Service Worker:</span>
          <span className={pwaStatus.hasServiceWorker ? 'text-green-500' : 'text-red-500'}>
            {pwaStatus.hasServiceWorker ? '✅' : '❌'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Standalone:</span>
          <span className={pwaStatus.isStandalone ? 'text-green-500' : 'text-red-500'}>
            {pwaStatus.isStandalone ? '✅' : '❌'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Can Install:</span>
          <span className={pwaStatus.canInstall ? 'text-green-500' : 'text-red-500'}>
            {pwaStatus.canInstall ? '✅' : '❌'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Installed:</span>
          <span className={pwaStatus.isInstalled ? 'text-green-500' : 'text-red-500'}>
            {pwaStatus.isInstalled ? '✅' : '❌'}
          </span>
        </div>
      </div>
      
      <div className={`mt-3 pt-2 border-t ${
        isDarkMode ? 'border-slate-600' : 'border-gray-200'
      }`}>
        <p className={`text-xs ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          This debug panel only shows on localhost
        </p>
      </div>
    </div>
  );
}
