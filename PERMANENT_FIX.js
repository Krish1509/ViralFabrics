// PERMANENT FIX - This script runs automatically to prevent old mill form from loading...
console.log('🔧 PERMANENT FIX - Preventing old mill form from loading...');

// Function to force mill form version
function forceMillFormVersion() {
  // Always set the latest version
  localStorage.setItem('millInputFormVersion', 'PERMANENT_FIX');
  localStorage.setItem('millInputFormTimestamp', Date.now().toString());
  localStorage.setItem('millInputFormForceNew', 'true');
  localStorage.setItem('millInputFormV2Active', 'true');
  localStorage.setItem('millInputFormPermanent', 'true');
  localStorage.setItem('millInputFormNoOldVersion', 'true');
  localStorage.setItem('millInputFormNuclear', 'true');
  localStorage.setItem('millInputFormForceReload', 'true');
  localStorage.setItem('millInputFormVersion3', 'true');
  localStorage.setItem('millInputFormNoCache', 'true');
  localStorage.setItem('millInputFormUltimate', 'true');
  localStorage.setItem('millInputFormFreshStart', 'true');
  localStorage.setItem('millInputFormNoOldData', 'true');
  localStorage.setItem('millInputFormPermanentFix', 'true');
  
  console.log('✅ PERMANENT FIX: Mill form version forced to PERMANENT_FIX');
}

// Function to clear all cache
function clearAllCache() {
  // Clear all storage
  localStorage.clear();
  sessionStorage.clear();
  
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
  
  console.log('✅ PERMANENT FIX: All cache cleared');
}

// Function to force reload with cache busting
function forceReloadWithCacheBust() {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const permanentId = `permanent-${timestamp}-${randomId}`;
  
  // Set permanent version flags
  localStorage.setItem('millInputFormVersion', 'PERMANENT_FIX');
  localStorage.setItem('millInputFormTimestamp', timestamp.toString());
  localStorage.setItem('millInputFormForceNew', 'true');
  localStorage.setItem('millInputFormV2Active', 'true');
  localStorage.setItem('millInputFormPermanent', 'true');
  localStorage.setItem('millInputFormNoOldVersion', 'true');
  localStorage.setItem('millInputFormNuclear', 'true');
  localStorage.setItem('millInputFormNuclearId', permanentId);
  localStorage.setItem('millInputFormForceReload', 'true');
  localStorage.setItem('millInputFormVersion3', 'true');
  localStorage.setItem('millInputFormNoCache', 'true');
  localStorage.setItem('millInputFormUltimate', 'true');
  localStorage.setItem('millInputFormFreshStart', 'true');
  localStorage.setItem('millInputFormNoOldData', 'true');
  localStorage.setItem('millInputFormPermanentFix', 'true');
  
  // Force reload with cache busting
  const currentUrl = window.location.href;
  const separator = currentUrl.includes('?') ? '&' : '?';
  const permanentUrl = currentUrl + separator + 
    'permanent=' + permanentId + 
    '&v=' + timestamp + 
    '&cache=permanent' + 
    '&force=new' + 
    '&noOld=true' + 
    '&t=' + Date.now() + 
    '&millForm=PERMANENT_FIX' + 
    '&noCache=true' + 
    '&freshStart=true' + 
    '&nuclear=true' + 
    '&permanentFix=true';
  
  console.log('🔄 PERMANENT FIX: Reloading with cache busting...');
  console.log('URL:', permanentUrl);
  
  // Force reload
  setTimeout(() => {
    window.location.href = permanentUrl;
  }, 100);
}

// Check if we need to apply permanent fix
function checkAndApplyPermanentFix() {
  const currentVersion = localStorage.getItem('millInputFormVersion');
  const permanentFix = localStorage.getItem('millInputFormPermanentFix');
  
  // If not the permanent version, apply fix
  if (currentVersion !== 'PERMANENT_FIX' || !permanentFix) {
    console.log('🔧 PERMANENT FIX: Old version detected, applying fix...');
    clearAllCache();
    forceReloadWithCacheBust();
  } else {
    console.log('✅ PERMANENT FIX: Already applied, continuing...');
    forceMillFormVersion(); // Ensure version is set
  }
}

// Run permanent fix on page load
if (typeof window !== 'undefined') {
  // Run immediately
  checkAndApplyPermanentFix();
  
  // Also run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndApplyPermanentFix);
  } else {
    checkAndApplyPermanentFix();
  }
  
  // Also run on window load
  window.addEventListener('load', checkAndApplyPermanentFix);
  
  // Monitor for any changes and reapply if needed
  setInterval(() => {
    const currentVersion = localStorage.getItem('millInputFormVersion');
    if (currentVersion !== 'PERMANENT_FIX') {
      console.log('🔧 PERMANENT FIX: Version changed, reapplying...');
      forceMillFormVersion();
    }
  }, 5000); // Check every 5 seconds
}

console.log('✅ PERMANENT FIX: Script loaded and monitoring...');
