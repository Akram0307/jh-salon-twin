import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // limit each IP to 100 requests per windowMs

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  if (!store[ip] || now > store[ip].resetTime) {
    store[ip] = {
      count: 1,
      resetTime: now + WINDOW_MS
    };
  } else {
    store[ip].count++;
    
    if (store[ip].count > MAX_REQUESTS) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((store[ip].resetTime - now) / 1000)
      });
    }
  }
  
  next();
};
