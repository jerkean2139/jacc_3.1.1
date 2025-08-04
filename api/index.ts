// Vercel serverless function entry point
import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: any;

async function getApp() {
  if (!app) {
    // Import the server application
    const serverModule = await import('../dist/index.js');
    app = serverModule.default;
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const server = await getApp();
    
    // Handle the request with Express
    server(req, res);
  } catch (error) {
    console.error('Vercel function error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}