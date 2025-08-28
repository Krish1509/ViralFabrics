'use client';

import { useState, useEffect } from 'react';
import { 
  DevicePhoneMobileIcon, 
  ComputerDesktopIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../hooks/useDarkMode';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallButton() {
  const { isDarkMode } = useDarkMode();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setInstallStatus('success');
      setTimeout(() => setInstallStatus('idle'), 3000);
    };

    // Check if already installed
    if (!checkIfInstalled()) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show manual installation instructions
      setShowInstallPrompt(true);
      return;
    }

    setIsInstalling(true);
    setInstallStatus('idle');

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setInstallStatus('success');
        setTimeout(() => {
          setShowInstallPrompt(false);
          setInstallStatus('idle');
        }, 2000);
      } else {
        console.log('User dismissed the install prompt');
        setInstallStatus('error');
        setTimeout(() => setInstallStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error during installation:', error);
      setInstallStatus('error');
      setTimeout(() => setInstallStatus('idle'), 3000);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Always show the button for testing (both localhost and production)
  // This ensures the install button is always visible
  if (!showInstallPrompt && !deferredPrompt) {
    // Still show the button, but it will show manual instructions
    return (
      <button
        onClick={() => setShowInstallPrompt(true)}
        className={`group flex items-center space-x-3 p-4 rounded-xl shadow-lg transition-all duration-300 ${
          isDarkMode 
            ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-blue-500/50' 
            : 'bg-white border border-gray-200 hover:bg-gray-50 hover:border-blue-300'
        }`}
      >
        <div className={`p-3 rounded-xl ${
          isDarkMode ? 'bg-purple-500/20 group-hover:bg-purple-500/30' : 'bg-purple-100 group-hover:bg-purple-200'
        }`}>
          <DevicePhoneMobileIcon className="h-8 w-8 text-purple-600 group-hover:text-purple-700" />
        </div>
        
        <div className="flex-1 text-left">
          <h3 className={`text-lg font-medium transition-colors duration-300 ${
            isDarkMode ? 'text-white group-hover:text-purple-400' : 'text-gray-900 group-hover:text-purple-600'
          }`}>
            Install App
          </h3>
          <p className={`text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-500'
          }`}>
            Download as mobile/desktop app
          </p>
        </div>

        <div className={`p-2 rounded-lg ${
          isDarkMode ? 'text-gray-400 group-hover:text-purple-400' : 'text-gray-500 group-hover:text-purple-600'
        }`}>
          <ComputerDesktopIcon className="h-5 w-5" />
        </div>
      </button>
    );
  }

  return (
    <>
      {/* Floating Install Button */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`rounded-xl shadow-2xl border-2 ${
            isDarkMode 
              ? 'bg-slate-800 border-blue-500/50' 
              : 'bg-white border-blue-200'
          } p-4 max-w-sm`}>
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${
                isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}>
                <DevicePhoneMobileIcon className="h-6 w-6 text-blue-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Install CRM Admin App
                </h3>
                <p className={`text-xs mt-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Get quick access to your CRM dashboard on your device
                </p>
                
                                 <div className="flex items-center space-x-2 mt-3">
                   {deferredPrompt ? (
                     <button
                       onClick={handleInstallClick}
                       disabled={isInstalling}
                       className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                         isInstalling
                           ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                           : isDarkMode
                             ? 'bg-blue-600 hover:bg-blue-700 text-white'
                             : 'bg-blue-600 hover:bg-blue-700 text-white'
                       }`}
                     >
                       {isInstalling ? 'Installing...' : 'Install'}
                     </button>
                   ) : (
                     <div className="flex-1">
                       <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                         Manual Installation:
                       </p>
                       <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} space-y-1`}>
                         <p>• Chrome/Edge: Click ⋮ menu → "Install app"</p>
                         <p>• Firefox: Click ⋮ menu → "Install App"</p>
                         <p>• Safari: Share → "Add to Home Screen"</p>
                       </div>
                     </div>
                   )}
                  
                  <button
                    onClick={handleDismiss}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Status Messages */}
                {installStatus === 'success' && (
                  <div className="flex items-center space-x-2 mt-2 text-green-600">
                    <CheckCircleIcon className="h-4 w-4" />
                    <span className="text-xs">Installation successful!</span>
                  </div>
                )}

                {installStatus === 'error' && (
                  <div className="flex items-center space-x-2 mt-2 text-red-600">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span className="text-xs">Installation failed. Please try again.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Install Button */}
      <button
        onClick={() => setShowInstallPrompt(true)}
        className={`group flex items-center space-x-3 p-4 rounded-xl shadow-lg transition-all duration-300 ${
          isDarkMode 
            ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-blue-500/50' 
            : 'bg-white border border-gray-200 hover:bg-gray-50 hover:border-blue-300'
        }`}
      >
        <div className={`p-3 rounded-xl ${
          isDarkMode ? 'bg-purple-500/20 group-hover:bg-purple-500/30' : 'bg-purple-100 group-hover:bg-purple-200'
        }`}>
          <DevicePhoneMobileIcon className="h-8 w-8 text-purple-600 group-hover:text-purple-700" />
        </div>
        
        <div className="flex-1 text-left">
          <h3 className={`text-lg font-medium transition-colors duration-300 ${
            isDarkMode ? 'text-white group-hover:text-purple-400' : 'text-gray-900 group-hover:text-purple-600'
          }`}>
            Install App
          </h3>
          <p className={`text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-500'
          }`}>
            Download as mobile/desktop app
          </p>
        </div>

        <div className={`p-2 rounded-lg ${
          isDarkMode ? 'text-gray-400 group-hover:text-purple-400' : 'text-gray-500 group-hover:text-purple-600'
        }`}>
          <ComputerDesktopIcon className="h-5 w-5" />
        </div>
      </button>
    </>
  );
}
