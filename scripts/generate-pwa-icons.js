const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, '../public/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Create a simple SVG icon for the app
const createSVGIcon = (size) => {
  const padding = size * 0.1;
  const innerSize = size - (padding * 2);
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1D4ED8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad1)"/>
  <rect x="${padding}" y="${padding}" width="${innerSize}" height="${innerSize * 0.6}" rx="${innerSize * 0.1}" fill="white" opacity="0.9"/>
  <rect x="${padding + innerSize * 0.1}" y="${padding + innerSize * 0.7}" width="${innerSize * 0.8}" height="${innerSize * 0.2}" rx="${innerSize * 0.05}" fill="white" opacity="0.9"/>
  <circle cx="${size * 0.3}" cy="${size * 0.4}" r="${innerSize * 0.08}" fill="#3B82F6"/>
  <circle cx="${size * 0.7}" cy="${size * 0.4}" r="${innerSize * 0.08}" fill="#3B82F6"/>
</svg>`;
};

// Icon sizes for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate icons
iconSizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  
  // For now, we'll create a placeholder file
  // In a real implementation, you'd convert SVG to PNG
  fs.writeFileSync(iconPath.replace('.png', '.svg'), svgContent);
  });

// Create special icons
const specialIcons = [
  { name: 'orders-icon.svg', size: 96 },
  { name: 'parties-icon.svg', size: 96 },
  { name: 'dashboard-icon.svg', size: 96 },
  { name: 'close-icon.svg', size: 96 },
  { name: 'safari-pinned-tab.svg', size: 16 }
];

specialIcons.forEach(icon => {
  const svgContent = createSVGIcon(icon.size);
  const iconPath = path.join(iconsDir, icon.name);
  fs.writeFileSync(iconPath, svgContent);
  });

// Create browserconfig.xml for Windows
const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square150x150logo src="/icons/icon-144x144.png"/>
            <TileColor>#3B82F6</TileColor>
        </tile>
    </msapplication>
</browserconfig>`;

fs.writeFileSync(path.join(__dirname, '../public/browserconfig.xml'), browserConfig);
