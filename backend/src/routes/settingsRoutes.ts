import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { UserSettingsRepository } from '../repositories/UserSettingsRepository';
import { TwoFactorAuthRepository } from '../repositories/TwoFactorAuthRepository';
import { BillingInfoRepository } from '../repositories/BillingInfoRepository';
import { pool } from '../config/db';
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { validate } from '../middleware/validate';
import { updateProfileSchema, updateNotificationPrefsSchema, verify2FASchema } from '../schemas/settings';
import { changePasswordAltSchema } from '../schemas/auth';

import logger from '../config/logger';
const log = logger.child({ module: 'settings_routes' });

const router = Router();
router.use(authenticate);

// Helper to get salon_id from user
const getSalonId = async (userId: string, userType: string): Promise<string | null> => {
  if (userType === 'owner') {
    const res = await pool.query('SELECT id FROM salons WHERE owner_id = $1 LIMIT 1', [userId]);
    return res.rows[0]?.id || null;
  } else if (userType === 'staff') {
    const res = await pool.query('SELECT salon_id FROM staff WHERE id = $1', [userId]);
    return res.rows[0]?.salon_id || null;
  }
  return null;
};

// GET /api/settings/profile
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let profileData = {};
    if (userType === 'owner') {
      const ownerRes = await pool.query('SELECT id, name, email, phone FROM owners WHERE id = $1', [userId]);
      if (ownerRes.rows[0]) {
        profileData = ownerRes.rows[0];
      }
    } else if (userType === 'staff') {
      const staffRes = await pool.query('SELECT id, full_name, email, phone, role FROM staff WHERE id = $1', [userId]);
      if (staffRes.rows[0]) {
        profileData = staffRes.rows[0];
      }
    }

    const settings = await UserSettingsRepository.findByUserId(userId, userType);
    const mergedProfile = {
      ...profileData,
      ...(settings?.profile_data || {})
    };

    res.json({ success: true, data: mergedProfile });
  } catch (err) {
    log.error({ err: err }, 'Error fetching profile:');
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/settings/profile
router.put('/profile', validate(updateProfileSchema), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, email, phone, ...additionalData } = req.body;

    // Update base table
    if (userType === 'owner') {
      await pool.query(
        'UPDATE owners SET name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone) WHERE id = $4',
        [name, email, phone, userId]
      );
    } else if (userType === 'staff') {
      await pool.query(
        'UPDATE staff SET full_name = COALESCE($1, full_name), email = COALESCE($2, email), phone = COALESCE($3, phone) WHERE id = $4',
        [name, email, phone, userId]
      );
    }

    // Update settings profile_data
    const salonId = await getSalonId(userId, userType);
    const settings = await UserSettingsRepository.upsert({
      user_id: userId,
      user_type: userType,
      salon_id: salonId || undefined,
      profile_data: additionalData
    });

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    log.error({ err: err }, 'Error updating profile:');
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/settings/notifications
router.get('/notifications', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const settings = await UserSettingsRepository.findByUserId(userId, userType);
    const preferences = settings?.notification_preferences || { email: true, sms: true, push: true };

    res.json({ success: true, data: preferences });
  } catch (err) {
    log.error({ err: err }, 'Error fetching notification preferences:');
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

// PUT /api/settings/notifications
router.put('/notifications', validate(updateNotificationPrefsSchema), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = req.body;
    const salonId = await getSalonId(userId, userType);
    
    // Ensure settings exist
    await UserSettingsRepository.upsert({
      user_id: userId,
      user_type: userType,
      salon_id: salonId || undefined,
      notification_preferences: preferences
    });

    const updated = await UserSettingsRepository.updateNotificationPreferences(userId, userType, preferences);

    res.json({ success: true, message: 'Notification preferences updated', data: updated?.notification_preferences });
  } catch (err) {
    log.error({ err: err }, 'Error updating notification preferences:');
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// POST /api/settings/security/2fa/enable
router.post('/security/2fa/enable', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate a secret
    const secret = speakeasy.generateSecret({
      name: `SalonOS:${userType}:${userId}`,
      length: 20
    });

    // Store the secret (not enabled yet)
    await TwoFactorAuthRepository.enable(userId, userType, secret.base32);

    // Generate QR code URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCodeUrl,
        message: 'Scan the QR code with your authenticator app'
      }
    });
  } catch (err) {
    log.error({ err: err }, 'Error enabling 2FA:');
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

// POST /api/settings/security/2fa/verify
router.post('/security/2fa/verify', validate(verify2FASchema), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const twoFactorAuth = await TwoFactorAuthRepository.findByUserId(userId, userType);
    if (!twoFactorAuth || !twoFactorAuth.secret) {
      return res.status(400).json({ error: '2FA not initiated' });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: twoFactorAuth.secret,
      encoding: 'base32',
      token: token,
      window: 1 // Allow 30 seconds before/after
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    // Mark as verified
    await TwoFactorAuthRepository.verify(userId, userType);

    res.json({ success: true, message: '2FA verified and enabled successfully' });
  } catch (err) {
    log.error({ err: err }, 'Error verifying 2FA:');
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
});

// GET /api/settings/billing
router.get('/billing', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (userType !== 'owner') {
      return res.status(403).json({ error: 'Only owners can access billing information' });
    }

    const salonId = await getSalonId(userId, userType);
    if (!salonId) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    let billing = await BillingInfoRepository.findBySalonId(salonId);
    if (!billing) {
      // Create default billing record
      billing = await BillingInfoRepository.create({
        salon_id: salonId,
        owner_id: userId
      });
    }

    res.json({ success: true, data: billing });
  } catch (err) {
    log.error({ err: err }, 'Error fetching billing info:');
    res.status(500).json({ error: 'Failed to fetch billing information' });
  }
});

// POST /api/settings/security/password
router.post('/security/password', validate(changePasswordAltSchema), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // Get current password hash
    let currentHash: string | null = null;
    if (userType === 'owner') {
      const res = await pool.query('SELECT password_hash FROM owners WHERE id = $1', [userId]);
      currentHash = res.rows[0]?.password_hash;
    } else if (userType === 'staff') {
      const res = await pool.query('SELECT password_hash FROM staff WHERE id = $1', [userId]);
      currentHash = res.rows[0]?.password_hash;
    }

    if (!currentHash) {
      return res.status(400).json({ error: 'No password set for this account' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, currentHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // Update password
    if (userType === 'owner') {
      await pool.query('UPDATE owners SET password_hash = $1 WHERE id = $2', [newHash, userId]);
    } else if (userType === 'staff') {
      await pool.query('UPDATE staff SET password_hash = $1 WHERE id = $2', [newHash, userId]);
    }

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    log.error({ err: err }, 'Error updating password:');
    res.status(500).json({ error: 'Failed to update password' });
  }
});

export default router;
