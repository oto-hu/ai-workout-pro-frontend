#!/usr/bin/env node

// Simple TypeScript check script
const { spawn } = require('child_process');
const path = require('path');

console.log('Running TypeScript type check...');

const tsc = spawn('npx', ['tsc', '--noEmit'], {
  cwd: process.cwd(),
  stdio: 'inherit'
});

tsc.on('close', (code) => {
  if (code === 0) {
    console.log('✅ TypeScript check passed successfully!');
  } else {
    console.log(`❌ TypeScript check failed with exit code ${code}`);
  }
  process.exit(code);
});

tsc.on('error', (err) => {
  console.error('Error running TypeScript check:', err);
  process.exit(1);
});