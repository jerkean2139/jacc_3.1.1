#!/usr/bin/env node

// Comprehensive server startup script that bypasses dependency issues
process.env.NODE_ENV = 'development';

console.log('🚀 Starting JACC server with all dependencies resolved...');

import { spawn } from 'child_process';
import path from 'path';

// Start the server with tsx directly
const serverProcess = spawn(
  'npx',
  ['--yes', 'tsx', 'server/index.ts'],
  {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  }
);

// Handle server process events
serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Handle termination signals
process.on('SIGTERM', () => {
  console.log('Terminating server...');
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Interrupting server...');
  serverProcess.kill('SIGINT');
});