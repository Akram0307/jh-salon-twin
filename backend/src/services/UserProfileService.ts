import { pool } from '../config/db';
import bcrypt from 'bcrypt';
import { UserSettingsRepository } from '../repositories/UserSettingsRepository';

import logger from '../config/logger';
const log = logger.child({ module: 'user_profile_service' });

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  user_type: 'owner' | 'staff';
}

export interface SecuritySettings {
  two_factor_enabled: boolean;
  login_notifications: boolean;
  last_password_change?: Date;
}

export class UserProfileService {
  /**
   * Get user profile with avatar
   */
  async getProfile(userId: string, userType: string): Promise<UserProfile | null> {
    try {
      let query: string;
      if (userType === 'owner') {
        query = 'SELECT id, name, email, phone, avatar_url FROM owners WHERE id = $1';
      } else {
        query = 'SELECT id, full_name as name, email, phone, avatar_url FROM staff WHERE id = $1';
      }
      
      const result = await pool.query(query, [userId]);
      if (!result.rows[0]) return null;
      
      return {
        ...result.rows[0],
        user_type: userType
      };
    } catch (error) {
      log.error({ err: error }, 'Error getting user profile:');
      throw error;
    }
  }

  /**
   * Upload/update user avatar
   */
  async updateAvatar(userId: string, userType: string, avatarUrl: string): Promise<boolean> {
    try {
      let query: string;
      if (userType === 'owner') {
        query = 'UPDATE owners SET avatar_url = $1, updated_at = NOW() WHERE id = $2';
      } else {
        query = 'UPDATE staff SET avatar_url = $1, updated_at = NOW() WHERE id = $2';
      }
      
      await pool.query(query, [avatarUrl, userId]);
      return true;
    } catch (error) {
      log.error({ err: error }, 'Error updating avatar:');
      throw error;
    }
  }

  /**
   * Get security settings for user
   */
  async getSecuritySettings(userId: string, userType: string): Promise<SecuritySettings> {
    try {
      // Check 2FA status
      const twoFactorRes = await pool.query(
        'SELECT enabled FROM two_factor_auth WHERE user_id = $1 AND user_type = $2',
        [userId, userType]
      );
      
      // Get user settings for login notifications
      const settings = await UserSettingsRepository.findByUserId(userId, userType);
      
      // Get last password change from audit log
      const passwordRes = await pool.query(
        'SELECT created_at FROM audit_logs WHERE user_id = $1 AND action = $2 ORDER BY created_at DESC LIMIT 1',
        [userId, 'password_changed']
      );
      
      return {
        two_factor_enabled: twoFactorRes.rows[0]?.enabled || false,
        login_notifications: settings?.security_data?.login_notifications ?? true,
        last_password_change: passwordRes.rows[0]?.created_at
      };
    } catch (error) {
      log.error({ err: error }, 'Error getting security settings:');
      throw error;
    }
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(
    userId: string, 
    userType: string, 
    settings: Partial<SecuritySettings>
  ): Promise<boolean> {
    try {
      const salonId = await this.getSalonId(userId, userType);
      
      await UserSettingsRepository.upsert({
        user_id: userId,
        user_type: userType,
        salon_id: salonId || undefined,
      });
      
      return true;
    } catch (error) {
      log.error({ err: error }, 'Error updating security settings:');
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string, 
    userType: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<boolean> {
    try {
      // Get current password hash
      let query: string;
      if (userType === 'owner') {
        query = 'SELECT password_hash FROM owners WHERE id = $1';
      } else {
        query = 'SELECT password_hash FROM staff WHERE id = $1';
      }
      
      const result = await pool.query(query, [userId]);
      if (!result.rows[0]) {
        throw new Error('User not found');
      }
      
      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      if (userType === 'owner') {
        await pool.query('UPDATE owners SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, userId]);
      } else {
        await pool.query('UPDATE staff SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, userId]);
      }
      
      // Log the password change
      await pool.query(
        'INSERT INTO audit_logs (user_id, user_type, action, details) VALUES ($1, $2, $3, $4)',
        [userId, userType, 'password_changed', JSON.stringify({ timestamp: new Date() })]
      );
      
      return true;
    } catch (error) {
      log.error({ err: error }, 'Error changing password:');
      throw error;
    }
  }

  /**
   * Delete user account (soft delete)
   */
  async deleteAccount(userId: string, userType: string): Promise<boolean> {
    try {
      let query: string;
      if (userType === 'owner') {
        query = 'UPDATE owners SET deleted_at = NOW(), status = $1 WHERE id = $2';
      } else {
        query = 'UPDATE staff SET deleted_at = NOW(), status = $1 WHERE id = $2';
      }
      
      await pool.query(query, ['inactive', userId]);
      
      // Log the deletion
      await pool.query(
        'INSERT INTO audit_logs (user_id, user_type, action, details) VALUES ($1, $2, $3, $4)',
        [userId, userType, 'account_deleted', JSON.stringify({ timestamp: new Date() })]
      );
      
      return true;
    } catch (error) {
      log.error({ err: error }, 'Error deleting account:');
      throw error;
    }
  }

  private async getSalonId(userId: string, userType: string): Promise<string | null> {
    if (userType === 'owner') {
      const res = await pool.query('SELECT id FROM salons WHERE owner_id = $1 LIMIT 1', [userId]);
      return res.rows[0]?.id || null;
    } else if (userType === 'staff') {
      const res = await pool.query('SELECT salon_id FROM staff WHERE id = $1', [userId]);
      return res.rows[0]?.salon_id || null;
    }
    return null;
  }
}
