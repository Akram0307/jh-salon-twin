import { Router, Request, Response } from 'express';
import pool from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas/auth';

import logger from '../config/logger';
import { JwtTokenPayload, getErrorMessage } from '../types/routeTypes'
const log = logger.child({ module: 'auth_routes' });

const router = Router();
// Lazy secret validation - checked at request time, not import time
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(`JWT_SECRET must be set and >= 32 chars (got ${secret?.length ?? 0})`);
  }
  return secret;
};
const getRefreshSecret = () => {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(`REFRESH_TOKEN_SECRET must be set and >= 32 chars (got ${secret?.length ?? 0})`);
  }
  return secret;
};

// Token generation helpers
const generateAccessToken = (payload: object) => 
  jwt.sign(payload, getJwtSecret(), { expiresIn: '1h' });

const generateRefreshToken = (payload: object) => 
  jwt.sign(payload, getRefreshSecret(), { expiresIn: '7d' });

// POST /api/auth/login - Owner login
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find owner by email
    const result = await pool.query(
      'SELECT id, name, email, phone, password_hash FROM owners WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const owner = result.rows[0];

    if (!owner.password_hash) {
      return res.status(401).json({ error: 'Account not set up for password login' });
    }

    const validPassword = await bcrypt.compare(password, owner.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const tokenPayload = { id: owner.id, email: owner.email, role: 'owner', user_type: 'owner' };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, user_type, token, expires_at)
       VALUES ($1, 'owner', $2, NOW() + INTERVAL '7 days')
       ON CONFLICT (user_id, user_type) DO UPDATE SET token = $2, expires_at = NOW() + INTERVAL '7 days'`,
      [owner.id, refreshToken]
    );

    res.json({
      token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        role: 'owner',
        user_type: 'owner'
      }
    });
  } catch (err: unknown) {
    log.error({ err: getErrorMessage(err) }, 'Login error:');
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/staff-login - Staff login
router.post('/staff-login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find staff by email
    const result = await pool.query(
      'SELECT id, name, email, phone, role, salon_id, password_hash FROM staff WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const staff = result.rows[0];

    if (!staff.password_hash) {
      return res.status(401).json({ error: 'Account not set up for password login' });
    }

    const validPassword = await bcrypt.compare(password, staff.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const tokenPayload = { 
      id: staff.id, 
      email: staff.email, 
      role: staff.role || 'stylist', 
      user_type: 'staff',
      salon_id: staff.salon_id
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, user_type, token, expires_at)
       VALUES ($1, 'staff', $2, NOW() + INTERVAL '7 days')
       ON CONFLICT (user_id, user_type) DO UPDATE SET token = $2, expires_at = NOW() + INTERVAL '7 days'`,
      [staff.id, refreshToken]
    );

    res.json({
      token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role || 'stylist',
        user_type: 'staff',
        salon_id: staff.salon_id
      }
    });
  } catch (err: unknown) {
    log.error({ err: getErrorMessage(err) }, 'Staff login error:');
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', validate(refreshTokenSchema), async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refresh_token, getRefreshSecret()) as JwtTokenPayload;

    // Check if refresh token exists in database
    const stored = await pool.query(
      'SELECT token FROM refresh_tokens WHERE user_id = $1 AND user_type = $2 AND expires_at > NOW()',
      [decoded.id, decoded.user_type]
    );

    if (stored.rows.length === 0 || stored.rows[0].token !== refresh_token) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const tokenPayload = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      user_type: decoded.user_type,
      salon_id: decoded.salon_id
    };
    const newAccessToken = generateAccessToken(tokenPayload);

    res.json({ token: newAccessToken });
  } catch (err: unknown) {
    log.error({ err: getErrorMessage(err) }, 'Token refresh error:');
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', validate(forgotPasswordSchema), async (req: Request, res: Response) => {
  try {
    const { email, user_type = 'owner' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const table = user_type === 'staff' ? 'staff' : 'owners';
    const result = await pool.query(
      `SELECT id, email FROM ${table} WHERE email = $1`,
      [email]
    );

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({ message: 'If an account exists, a reset link has been sent' });
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store reset token
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, user_type, token, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '1 hour')`,
      [user.id, user_type, hashedToken]
    );

    // TODO: Send email with reset link containing resetToken
    log.info({ email, user_type }, 'Password reset token generated');

    res.json({ message: 'If an account exists, a reset link has been sent' });
  } catch (err: unknown) {
    log.error({ err: getErrorMessage(err) }, 'Forgot password error:');
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', validate(resetPasswordSchema), async (req: Request, res: Response) => {
  try {
    const { token, password, user_type = 'owner' } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const result = await pool.query(
      `SELECT id, user_id FROM password_reset_tokens 
       WHERE token = $1 AND user_type = $2 AND used = false AND expires_at > NOW()`,
      [hashedToken, user_type]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const resetRecord = result.rows[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password
    const table = user_type === 'staff' ? 'staff' : 'owners';
    await pool.query(
      `UPDATE ${table} SET password_hash = $1 WHERE id = $2`,
      [passwordHash, resetRecord.user_id]
    );

    // Mark token as used
    await pool.query(
      'UPDATE password_reset_tokens SET used = true WHERE id = $1',
      [resetRecord.id]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (err: unknown) {
    log.error({ err: getErrorMessage(err) }, 'Reset password error:');
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id, user_type } = req.user!;

    const table = user_type === 'staff' ? 'staff' : 'owners';
    const result = await pool.query(
      `SELECT id, name, email, phone FROM ${table} WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ...result.rows[0],
      role: req.user!.role,
      user_type: req.user!.user_type
    });
  } catch (err: unknown) {
    log.error({ err: getErrorMessage(err) }, 'Auth me error:');
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// POST /api/auth/logout - Logout and invalidate refresh token
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id, user_type } = req.user!;

    // Delete refresh token
    await pool.query(
      'DELETE FROM refresh_tokens WHERE user_id = $1 AND user_type = $2',
      [id, user_type]
    );

    res.json({ message: 'Logged out successfully' });
  } catch (err: unknown) {
    log.error({ err: getErrorMessage(err) }, 'Logout error:');
    res.json({ message: 'Logged out successfully' });
  }
});

export default router;
