import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import serverless from 'serverless-http';

// Import your existing server
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the main server file
import('../../dist/index.js').then(({ default: app }) => {
  // Export the serverless handler
  export const handler = serverless(app);
}).catch(console.error);

// Temporary handler while the main app loads
export const handler = (event, context) => {
  return {
    statusCode: 503,
    body: JSON.stringify({ message: 'Server starting...' })
  };
};