const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing server-side cache...');

// Clear Next.js build cache
const nextCacheDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextCacheDir)) {
  console.log('🗑️ Removing .next directory...');
  fs.rmSync(nextCacheDir, { recursive: true, force: true });
  console.log('✅ Cleared Next.js build cache');
}

// Clear TypeScript build cache
const tsBuildInfo = path.join(process.cwd(), 'tsconfig.tsbuildinfo');
if (fs.existsSync(tsBuildInfo)) {
  console.log('🗑️ Removing TypeScript build info...');
  fs.unlinkSync(tsBuildInfo);
  console.log('✅ Cleared TypeScript build cache');
}

// Clear node_modules cache (optional - uncomment if needed)
// const nodeModules = path.join(process.cwd(), 'node_modules');
// if (fs.existsSync(nodeModules)) {
//   console.log('🗑️ Removing node_modules...');
//   fs.rmSync(nodeModules, { recursive: true, force: true });
//   console.log('✅ Cleared node_modules');
// }

console.log('✅ Server cache cleared successfully!');
console.log('💡 Run "npm install" and "npm run dev" to restart the server');
