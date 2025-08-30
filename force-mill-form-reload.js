// FORCE MILL FORM RELOAD - Run this in browser console
console.log('🔥 FORCE MILL FORM RELOAD - ELIMINATING OLD MILL FORM...');

// Clear ALL localStorage
localStorage.clear();
console.log('✅ Cleared ALL localStorage');

// Clear ALL sessionStorage
sessionStorage.clear();
console.log('✅ Cleared ALL sessionStorage');

// Clear IndexedDB
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      indexedDB.deleteDatabase(db.name);
    });
  });
  console.log('✅ Cleared ALL IndexedDB databases');
}

// Clear Service Worker cache
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
  });
  console.log('✅ Unregistered ALL Service Workers');
  
  // Clear caches
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
      });
    });
    console.log('✅ Cleared ALL Cache Storage');
  }
}

// Force reload with nuclear parameters
const timestamp = Date.now();
const randomId = Math.random().toString(36).substring(7);
const nuclearId = `nuclear-${timestamp}-${randomId}`;

// Set nuclear version flags
localStorage.setItem('millInputFormVersion', '3.0');
localStorage.setItem('millInputFormTimestamp', timestamp.toString());
localStorage.setItem('millInputFormForceNew', 'true');
localStorage.setItem('millInputFormV2Active', 'true');
localStorage.setItem('millInputFormPermanent', 'true');
localStorage.setItem('millInputFormNoOldVersion', 'true');
localStorage.setItem('millInputFormNuclear', 'true');
localStorage.setItem('millInputFormNuclearId', nuclearId);
localStorage.setItem('millInputFormForceReload', 'true');
localStorage.setItem('millInputFormVersion3', 'true');
localStorage.setItem('millInputFormNoCache', 'true');

console.log('✅ Set NUCLEAR version flags');

// Force reload with nuclear cache busting
const currentUrl = window.location.href;
const separator = currentUrl.includes('?') ? '&' : '?';
const nuclearUrl = currentUrl + separator + 'nuclear=' + nuclearId + '&v=' + timestamp + '&cache=nuclear&force=new&noOld=true&t=' + Date.now() + '&millForm=3.0&noCache=true';

console.log('🔥 NUCLEAR RELOAD with cache busting...');
console.log('URL:', nuclearUrl);

// Force reload with cache bypass
setTimeout(() => {
  window.location.href = nuclearUrl;
}, 100);
