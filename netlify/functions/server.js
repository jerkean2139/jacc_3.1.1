const serverless = require('serverless-http');

// Import the built server
let app;
try {
  app = require('../../dist/index.js').default;
} catch (error) {
  console.error('Failed to import server:', error);
  // Fallback handler
  const express = require('express');
  app = express();
  app.get('*', (req, res) => {
    res.status(503).json({ error: 'Server not available', message: error.message });
  });
}

// Export the serverless handler
exports.handler = serverless(app);