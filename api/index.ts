// Vercel serverless function entry point
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Create a simple Express app for testing
const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic API endpoint for testing
app.all('/api/*', (req, res) => {
  res.json({ 
    message: 'JACC API is working on Vercel',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Handle the request with Express
    app(req as any, res as any);
  } catch (error) {
    console.error('Vercel function error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}