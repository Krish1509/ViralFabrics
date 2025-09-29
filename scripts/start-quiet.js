#!/usr/bin/env node

// Custom script to start Next.js with minimal logging
const { spawn } = require('child_process');

console.log('🚀 Starting CRM Admin Panel with minimal logging...\n');

// Start Next.js with custom environment (no --quiet flag as it's not supported)
const nextProcess = spawn('npx', ['next', 'dev'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: {
    ...process.env,
    // Reduce Next.js logging
    NEXT_TELEMETRY_DISABLED: '1',
    // Disable detailed compilation logs
    NODE_ENV: 'development'
  }
});

// Only show essential information
nextProcess.stdout.on('data', (data) => {
  const output = data.toString();
  
  // Only show important messages, hide compilation logs
  if (output.includes('Ready in') || 
      output.includes('Local:') || 
      output.includes('Network:') ||
      output.includes('Starting...') ||
      output.includes('▲ Next.js')) {
    process.stdout.write(output);
  }
  // Hide compilation logs (○ Compiling, ✓ Compiled)
  else if (!output.includes('○ Compiling') && 
           !output.includes('✓ Compiled') && 
           !output.includes('GET /') && 
           !output.includes('POST /')) {
    // Only show errors or important messages
    if (output.includes('Error') || output.includes('error') || output.includes('Failed')) {
      process.stdout.write(output);
    }
  }
});

// Show errors
nextProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// Handle process exit
nextProcess.on('close', (code) => {
  console.log(`\n🛑 Server stopped with code ${code}`);
  process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  nextProcess.kill('SIGINT');
});
