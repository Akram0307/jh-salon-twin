import rateLimit from 'express-rate-limit';

// Rate limiter for auth routes: 10 requests per 15 minutes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: true,
  message: {
    error: 'Too many authentication attempts. Please try again later.',
  },
});

// Rate limiter for general API: 100 requests per 15 minutes
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: true,
  message: {
    error: 'Too many requests. Please slow down.',
  },
});
