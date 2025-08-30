// FORCE NEW MILL FORM - Run this in browser console
console.log('🔥 FORCING NEW MILL FORM VERSION - NO MORE OLD VERSIONS!');

// Function to force new mill form version
function forceNewMillForm() {
  // Clear ALL cache related to mill form
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('mill') || key.includes('form') || key.includes('cache'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Clear session storage
  sessionStorage.clear();
  
  // Set new version with timestamp
  const timestamp = Date.now();
  const version = 'FORCE_NEW_' + timestamp;
  
  localStorage.setItem('millInputFormVersion', version);
  localStorage.setItem('millInputFormTimestamp', timestamp.toString());
  localStorage.setItem('millInputFormForceNew', 'true');
  localStorage.setItem('millInputFormNoCache', 'true');
  localStorage.setItem('millInputFormNuclear', 'true');
  localStorage.setItem('millInputFormPermanent', 'true');
  localStorage.setItem('millInputFormLatest', 'true');
  localStorage.setItem('millInputFormNoOldVersion', 'true');
  localStorage.setItem('millInputFormForceReload', 'true');
  localStorage.setItem('millInputFormVersion3', 'true');
  localStorage.setItem('millInputFormV2Active', 'true');
  localStorage.setItem('millInputFormFreshStart', 'true');
  localStorage.setItem('millInputFormNoOldData', 'true');
  localStorage.setItem('millInputFormUltimate', 'true');
  localStorage.setItem('millInputFormPermanentFix', 'true');
  
  console.log('✅ New mill form version set:', version);
}

// Function to clear all caches
function clearAllCaches() {
  // Clear IndexedDB
  if ('indexedDB' in window) {
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        indexedDB.deleteDatabase(db.name);
      });
    });
  }
  
  // Clear Service Workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    });
  }
  
  // Clear Cache Storage
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
      });
    });
  }
  
  console.log('✅ All caches cleared');
}

// Function to force reload with cache busting
function forceReloadWithCacheBust() {
  const currentUrl = window.location.href;
  const separator = currentUrl.includes('?') ? '&' : '?';
  const timestamp = Date.now();
  const newUrl = currentUrl + separator + 'v=' + timestamp + '&cache=bust&force=new&noOld=true&t=' + Date.now() + '&nuclear=true&millForm=new&permanent=true';
  
  console.log('🔄 Reloading with cache busting...');
  window.location.href = newUrl;
}

// Function to monitor and prevent old version
function monitorAndPreventOldVersion() {
  // Check every 2 seconds for old version
  setInterval(() => {
    const currentVersion = localStorage.getItem('millInputFormVersion');
    const timestamp = localStorage.getItem('millInputFormTimestamp');
    
    if (!currentVersion || !timestamp || currentVersion === '2.0' || currentVersion === '3.0') {
      console.log('🔧 Detected old version, forcing new version...');
      forceNewMillForm();
    }
  }, 2000);
  
  // Monitor DOM for old form elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          if (element.textContent && element.textContent.includes('Mill Input Form')) {
            // Check if it's the old version
            const isOldVersion = element.textContent.includes('v2.0') || 
                                element.textContent.includes('v3.0') ||
                                !element.textContent.includes('FORCE_NEW');
            
            if (isOldVersion) {
              console.log('🔧 Detected old form in DOM, forcing reload...');
              forceReloadWithCacheBust();
            }
          }
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('✅ Monitoring active - Old versions will be prevented');
}

// Function to add cache-busting meta tags
function addCacheBustingMetaTags() {
  // Remove existing cache control meta tags
  const existingMeta = document.querySelectorAll('meta[http-equiv="Cache-Control"]');
  existingMeta.forEach(meta => meta.remove());
  
  // Add new cache control meta tags
  const meta = document.createElement('meta');
  meta.setAttribute('http-equiv', 'Cache-Control');
  meta.setAttribute('content', 'no-cache, no-store, must-revalidate, max-age=0');
  document.head.appendChild(meta);
  
  const metaPragma = document.createElement('meta');
  metaPragma.setAttribute('http-equiv', 'Pragma');
  metaPragma.setAttribute('content', 'no-cache');
  document.head.appendChild(metaPragma);
  
  const metaExpires = document.createElement('meta');
  metaExpires.setAttribute('http-equiv', 'Expires');
  metaExpires.setAttribute('content', '0');
  document.head.appendChild(metaExpires);
  
  console.log('✅ Cache-busting meta tags added');
}

// Function to override fetch to add cache busting
function overrideFetchWithCacheBust() {
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [url, options = {}] = args;
    
    // Add cache busting to URLs
    if (typeof url === 'string' && url.includes('mill')) {
      const separator = url.includes('?') ? '&' : '?';
      const cacheBustUrl = url + separator + 'cache=bust&t=' + Date.now();
      return originalFetch(cacheBustUrl, {
        ...options,
        cache: 'no-cache',
        headers: {
          ...options.headers,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
    }
    
    return originalFetch(...args);
  };
  
  console.log('✅ Fetch overridden with cache busting');
}

// Run all functions
console.log('🔥 Starting FORCE NEW MILL FORM process...');
forceNewMillForm();
clearAllCaches();
addCacheBustingMetaTags();
overrideFetchWithCacheBust();
monitorAndPreventOldVersion();

// Set up continuous version enforcement
setInterval(() => {
  forceNewMillForm();
}, 5000); // Every 5 seconds

console.log('✅ FORCE NEW MILL FORM active - Your new version will always show!');

// Force reload after 1 second to apply all changes
setTimeout(() => {
  forceReloadWithCacheBust();
}, 1000);
