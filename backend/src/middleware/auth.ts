import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db';

import logger from '../config/logger';
import { JwtTokenPayload } from '../types/routeTypes';

// Fail-fast at module load time if JWT_SECRET is missing or too short
const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'FATAL: JWT_SECRET environment variable is required but not set. ' +
      'Refusing to start without a valid secret.'
    );
  }
  if (secret.length < 32) {
    throw new Error(
      'FATAL: JWT_SECRET must be at least 32 characters long. ' +
      `Current length: ${secret.length}. Refusing to start.`
    );
  }
  return secret;
})();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    user_type: 'owner' | 'staff';
  };
}

// JWT verification middleware
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JwtTokenPayload;

    // Get user from database to ensure they still exist and have correct role
    const result = await pool.query(
      'SELECT id, email, role, user_type FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    logger.error({ err: error }, 'Auth middleware error:');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Owner-only authorization middleware
export const requireOwner = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (req.user.role !== 'owner' && req.user.user_type !== 'owner') {
    return res.status(403).json({ error: 'Owner access required' });
  }
  next();
};

// Staff or owner authorization middleware
export const requireStaffOrOwner = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (!['owner', 'staff'].includes(req.user.role) && !['owner', 'staff'].includes(req.user.user_type)) {
    return res.status(403).json({ error: 'Staff or owner access required' });
  }
  next();
};

// Generic authorize middleware - checks if user has any of the specified roles
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = req.user.role || req.user.user_type;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
