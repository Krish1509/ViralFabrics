// ULTIMATE CACHE FIX - Run this in browser console
console.log('☢️ ULTIMATE CACHE FIX - NUCLEAR OPTION ACTIVATED...');

// Step 1: Clear ALL browser storage
console.log('🧹 Step 1: Clearing ALL browser storage...');
localStorage.clear();
sessionStorage.clear();
console.log('✅ Cleared localStorage and sessionStorage');

// Step 2: Clear IndexedDB
console.log('🗄️ Step 2: Clearing IndexedDB...');
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      indexedDB.deleteDatabase(db.name);
    });
  });
  console.log('✅ Cleared ALL IndexedDB databases');
}

// Step 3: Clear Service Workers
console.log('🔧 Step 3: Clearing Service Workers...');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
  });
  console.log('✅ Unregistered ALL Service Workers');
}

// Step 4: Clear Cache Storage
console.log('📦 Step 4: Clearing Cache Storage...');
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      caches.delete(cacheName);
    });
  });
  console.log('✅ Cleared ALL Cache Storage');
}

// Step 5: Clear Application Cache
console.log('📱 Step 5: Clearing Application Cache...');
if ('applicationCache' in window) {
  window.applicationCache.update();
  console.log('✅ Updated Application Cache');
}

// Step 6: Set ULTIMATE version flags
console.log('🏷️ Step 6: Setting ULTIMATE version flags...');
const timestamp = Date.now();
const randomId = Math.random().toString(36).substring(7);
const ultimateId = `ultimate-${timestamp}-${randomId}`;

localStorage.setItem('millInputFormVersion', 'ULTIMATE');
localStorage.setItem('millInputFormTimestamp', timestamp.toString());
localStorage.setItem('millInputFormForceNew', 'true');
localStorage.setItem('millInputFormV2Active', 'true');
localStorage.setItem('millInputFormPermanent', 'true');
localStorage.setItem('millInputFormNoOldVersion', 'true');
localStorage.setItem('millInputFormNuclear', 'true');
localStorage.setItem('millInputFormNuclearId', ultimateId);
localStorage.setItem('millInputFormForceReload', 'true');
localStorage.setItem('millInputFormVersion3', 'true');
localStorage.setItem('millInputFormNoCache', 'true');
localStorage.setItem('millInputFormUltimate', 'true');
localStorage.setItem('millInputFormFreshStart', 'true');
localStorage.setItem('millInputFormNoOldData', 'true');

console.log('✅ Set ULTIMATE version flags');

// Step 7: Force reload with ULTIMATE cache busting
console.log('☢️ Step 7: ULTIMATE RELOAD with cache busting...');
const currentUrl = window.location.href;
const separator = currentUrl.includes('?') ? '&' : '?';
const ultimateUrl = currentUrl + separator + 
  'ultimate=' + ultimateId + 
  '&v=' + timestamp + 
  '&cache=ultimate' + 
  '&force=new' + 
  '&noOld=true' + 
  '&t=' + Date.now() + 
  '&millForm=ULTIMATE' + 
  '&noCache=true' + 
  '&freshStart=true' + 
  '&nuclear=true';

console.log('URL:', ultimateUrl);

// Step 8: Force reload with cache bypass
console.log('☢️ ULTIMATE RELOAD INITIATED...');
setTimeout(() => {
  window.location.href = ultimateUrl;
}, 200);
