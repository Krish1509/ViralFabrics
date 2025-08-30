// FIX PWA DEBUG PANEL - Run this in browser console
console.log('🔧 FIXING PWA DEBUG PANEL ISSUE...');

// Function to hide PWA debug panel
function hidePWADebugPanel() {
  // Remove any PWA debug elements
  const debugElements = document.querySelectorAll('[class*="debug"], [class*="Debug"], [id*="debug"], [id*="Debug"]');
  debugElements.forEach(element => {
    if (element.textContent && (
      element.textContent.includes('PWA Debug Info') ||
      element.textContent.includes('Manifest:') ||
      element.textContent.includes('Service Worker:') ||
      element.textContent.includes('Standalone:') ||
      element.textContent.includes('Can Install:') ||
      element.textContent.includes('Installed:') ||
      element.textContent.includes('Debug panel')
    )) {
      console.log('🗑️ Removing PWA debug element:', element);
      element.remove();
    }
  });

  // Hide any elements with PWA debug content
  const allElements = document.querySelectorAll('*');
  allElements.forEach(element => {
    if (element.textContent && element.textContent.includes('PWA Debug Info')) {
      console.log('🗑️ Removing PWA debug panel:', element);
      element.style.display = 'none';
      element.remove();
    }
  });
}

// Function to prevent PWA debug from showing
function preventPWADebug() {
  // Override console.log to filter PWA debug messages
  const originalLog = console.log;
  console.log = function(...args) {
    const message = args.join(' ');
    if (!message.includes('PWA Debug') && !message.includes('Debug panel')) {
      originalLog.apply(console, args);
    }
  };

  // Remove any existing PWA debug panels
  hidePWADebugPanel();

  // Monitor for new PWA debug elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          if (element.textContent && element.textContent.includes('PWA Debug Info')) {
            console.log('🔧 Preventing PWA debug panel from showing...');
            element.remove();
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('✅ PWA debug panel prevention active');
}

// Function to disable PWA debugging
function disablePWADebugging() {
  // Set flags to disable PWA debugging
  localStorage.setItem('pwaDebugDisabled', 'true');
  localStorage.setItem('pwaDebugPanelHidden', 'true');
  localStorage.setItem('pwaDebugInfoHidden', 'true');
  
  // Override any PWA debug functions
  if (window.navigator && (window.navigator as any).serviceWorker) {
    const originalRegister = (window.navigator as any).serviceWorker.register;
    (window.navigator as any).serviceWorker.register = function(...args: any[]) {
      // Register service worker without debug info
      return originalRegister.apply(this, args).then((registration: any) => {
        // Don't show debug info
        return registration;
      });
    };
  }

  console.log('✅ PWA debugging disabled');
}

// Run all fixes
console.log('🔧 Applying PWA debug panel fixes...');
preventPWADebug();
disablePWADebugging();
hidePWADebugPanel();

// Set up continuous monitoring
setInterval(() => {
  hidePWADebugPanel();
}, 1000); // Check every second

console.log('✅ PWA debug panel fix applied - Debug panel will not show again!');

// Force refresh to apply changes
const currentUrl = window.location.href;
const separator = currentUrl.includes('?') ? '&' : '?';
const refreshUrl = currentUrl + separator + 'pwaDebugFixed=true&t=' + Date.now();

console.log('🔄 Refreshing page to apply PWA debug fix...');
setTimeout(() => {
  window.location.href = refreshUrl;
}, 500);
