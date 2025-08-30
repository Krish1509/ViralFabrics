// FIX LOADING TIMEOUT - Run this in browser console
console.log('🔧 FIXING LOADING TIMEOUT ISSUES...');

// Clear any existing error messages
const errorMessages = document.querySelectorAll('[class*="error"], [class*="timeout"]');
errorMessages.forEach(msg => msg.remove());

// Clear loading states
localStorage.setItem('ordersLoadingState', 'false');
localStorage.setItem('partiesLoadingState', 'false');
localStorage.setItem('qualitiesLoadingState', 'false');

// Set longer timeout preferences
localStorage.setItem('ordersTimeout', '15000'); // 15 seconds
localStorage.setItem('partiesTimeout', '10000'); // 10 seconds
localStorage.setItem('qualitiesTimeout', '10000'); // 10 seconds

// Clear any cached data that might be causing issues
localStorage.removeItem('cachedOrders');
localStorage.removeItem('cachedParties');
localStorage.removeItem('cachedQualities');

// Force refresh with longer timeouts
const currentUrl = window.location.href;
const separator = currentUrl.includes('?') ? '&' : '?';
const refreshUrl = currentUrl + separator + 'fixTimeout=true&t=' + Date.now() + '&timeout=15s';

console.log('🔄 Refreshing page with timeout fix...');
console.log('URL:', refreshUrl);

// Force reload
setTimeout(() => {
  window.location.href = refreshUrl;
}, 500);
