'use client';

import { useEffect, useState } from 'react';

export default function PWARegistration() {
  const [isOnline, setIsOnline] = useState(true);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Register service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });

          setSwRegistration(registration);

          // Listen for beforeinstallprompt event
          window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            (window as unknown as Record<string, unknown>).deferredPrompt = e;
            // PWA install prompt available (debug disabled)
          });

          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available (debug disabled)
                  
                  // Show update notification
                  if (confirm('A new version of the app is available. Would you like to update?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });

          // Handle service worker controller change
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            // Service worker controller changed (debug disabled)
          });

          // Service Worker registered successfully (debug disabled)
        } catch (error) {
          }
      }
    };

    // Handle online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      // App is online (debug disabled)
    };

    const handleOffline = () => {
      setIsOnline(false);
      // App is offline (debug disabled)
    };

    // Register service worker
    registerServiceWorker();

    // Add online/offline listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial online status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add PWA meta tags to head
  useEffect(() => {
    const addPWAMetaTags = () => {
      // Check if manifest link already exists
      if (document.querySelector('link[rel="manifest"]')) {
        // Manifest link already exists (debug disabled)
        return;
      }

      // Adding PWA meta tags (debug disabled)

      // Add theme color meta tag
      const themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      themeColorMeta.content = '#3B82F6';
      document.head.appendChild(themeColorMeta);

      // Add apple-mobile-web-app-capable meta tag
      const appleCapableMeta = document.createElement('meta');
      appleCapableMeta.name = 'apple-mobile-web-app-capable';
      appleCapableMeta.content = 'yes';
      document.head.appendChild(appleCapableMeta);

      // Add apple-mobile-web-app-status-bar-style meta tag
      const appleStatusBarMeta = document.createElement('meta');
      appleStatusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
      appleStatusBarMeta.content = 'default';
      document.head.appendChild(appleStatusBarMeta);

      // Add apple-mobile-web-app-title meta tag
      const appleTitleMeta = document.createElement('meta');
      appleTitleMeta.name = 'apple-mobile-web-app-title';
              appleTitleMeta.content = 'Viral Fabrics';
      document.head.appendChild(appleTitleMeta);

      // Add viewport meta tag for PWA
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
      }

      // Add manifest link
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      document.head.appendChild(manifestLink);
      // Manifest link added (debug disabled)

      // Add apple touch icons
      const appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      appleTouchIcon.href = '/icons/icon-192x192.svg';
      document.head.appendChild(appleTouchIcon);

      // Add apple touch icon for different sizes
      const appleTouchIcon152 = document.createElement('link');
      appleTouchIcon152.rel = 'apple-touch-icon';
      appleTouchIcon152.sizes = '152x152';
      appleTouchIcon152.href = '/icons/icon-152x152.svg';
      document.head.appendChild(appleTouchIcon152);

      const appleTouchIcon180 = document.createElement('link');
      appleTouchIcon180.rel = 'apple-touch-icon';
      appleTouchIcon180.sizes = '180x180';
      appleTouchIcon180.href = '/icons/icon-192x192.svg';
      document.head.appendChild(appleTouchIcon180);

      // Add mask icon for Safari
      const maskIcon = document.createElement('link');
      maskIcon.rel = 'mask-icon';
      maskIcon.href = '/icons/safari-pinned-tab.svg';
      maskIcon.setAttribute('color', '#3B82F6');
      document.head.appendChild(maskIcon);

      // Add msapplication meta tags for Windows
      const msTileColor = document.createElement('meta');
      msTileColor.name = 'msapplication-TileColor';
      msTileColor.content = '#3B82F6';
      document.head.appendChild(msTileColor);

      const msTileImage = document.createElement('meta');
      msTileImage.name = 'msapplication-TileImage';
      msTileImage.content = '/icons/icon-144x144.svg';
      document.head.appendChild(msTileImage);

      const msConfig = document.createElement('meta');
      msConfig.name = 'msapplication-config';
      msConfig.content = '/browserconfig.xml';
      document.head.appendChild(msConfig);
    };

    addPWAMetaTags();
  }, []);

  // Show offline indicator
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white text-center py-2 px-4">
        <span className="text-sm font-medium">
          You are currently offline. Some features may be limited.
        </span>
      </div>
    );
  }

  return null;
}
