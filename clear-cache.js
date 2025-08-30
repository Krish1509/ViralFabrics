// Clear Cache Script - Run this in browser console to force new form
console.log('🧹 Clearing all cache to force new Mill Input Form...');

// Clear all localStorage
localStorage.clear();
console.log('✅ Cleared localStorage');

// Clear all sessionStorage
sessionStorage.clear();
console.log('✅ Cleared sessionStorage');

// Clear browser cache by reloading with cache busting
const timestamp = Date.now();
const currentUrl = window.location.href;
const separator = currentUrl.includes('?') ? '&' : '?';
const newUrl = currentUrl + separator + 'v=' + timestamp + '&cache=bust&force=new';

console.log('🔄 Reloading page with cache busting...');
window.location.href = newUrl;
