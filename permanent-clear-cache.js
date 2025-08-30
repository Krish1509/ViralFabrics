// Permanent Cache Clear Script - Run this in browser console
console.log('🧹 PERMANENTLY clearing all cache to force new Mill Input Form...');

// Clear all localStorage
localStorage.clear();
console.log('✅ Cleared localStorage');

// Clear all sessionStorage
sessionStorage.clear();
console.log('✅ Cleared sessionStorage');

// Set permanent version flags
const timestamp = Date.now();
localStorage.setItem('millInputFormVersion', '2.0');
localStorage.setItem('millInputFormTimestamp', timestamp.toString());
localStorage.setItem('millInputFormForceNew', 'true');
localStorage.setItem('millInputFormV2Active', 'true');
localStorage.setItem('millInputFormPermanent', 'true');
localStorage.setItem('millInputFormNoOldVersion', 'true');

console.log('✅ Set permanent version flags');

// Force reload with cache busting
const currentUrl = window.location.href;
const separator = currentUrl.includes('?') ? '&' : '?';
const newUrl = currentUrl + separator + 'v=' + timestamp + '&cache=bust&permanent=true&noOld=true';

console.log('🔄 Reloading page with permanent cache busting...');
window.location.href = newUrl;
