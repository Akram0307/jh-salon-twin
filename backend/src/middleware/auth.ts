import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required but not set.');
}

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
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      user_type: decoded.user_type
    };

    next();
  } catch (err: any) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Role-based access control middleware
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Owner only middleware
export const ownerOnly = authorize('owner', 'admin');

// Manager and above middleware
export const managerAndAbove = authorize('owner', 'admin', 'manager');

// All staff middleware
export const allStaff = authorize('owner', 'admin', 'manager', 'stylist');
