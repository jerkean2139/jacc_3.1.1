import { Request, Response, NextFunction } from 'express';

// SECURITY FIX: Generic error messages in production
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log full error details server-side for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : 'Hidden in production',
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Determine response based on environment
  if (process.env.NODE_ENV === 'production') {
    // Generic error message for production
    res.status(500).json({
      error: 'Internal server error',
      message: 'Something went wrong. Please try again later.',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  } else {
    // Detailed error for development
    res.status(err.statusCode || 500).json({
      error: err.name || 'Error',
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
  }
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  console.log(`404 - Route not found: ${req.method} ${req.url} from ${req.ip}`);
  
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.url,
    timestamp: new Date().toISOString()
  });
};

// Security event logger
export const logSecurityEvent = (event: string, req: Request, details?: any) => {
  console.warn(`🚨 SECURITY EVENT: ${event}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    details
  });
};