import { query } from '../config/db';

export class UserSettingsRepository {
  static async findByUserId(userId: string, userType: string) {
    const res = await query(
      `SELECT * FROM user_settings WHERE user_id = $1 AND user_type = $2`,
      [userId, userType]
    );
    return res.rows[0] || null;
  }

  static async create(settings: {
    user_id: string;
    user_type: string;
    salon_id?: string;
    profile_data?: any;
    notification_preferences?: any;
  }) {
    const res = await query(
      `INSERT INTO user_settings (user_id, user_type, salon_id, profile_data, notification_preferences)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        settings.user_id,
        settings.user_type,
        settings.salon_id || null,
        JSON.stringify(settings.profile_data || {}),
        JSON.stringify(settings.notification_preferences || { email: true, sms: true, push: true })
      ]
    );
    return res.rows[0];
  }

  static async updateProfile(userId: string, userType: string, profileData: any) {
    const res = await query(
      `UPDATE user_settings 
       SET profile_data = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND user_type = $3
       RETURNING *`,
      [JSON.stringify(profileData), userId, userType]
    );
    return res.rows[0] || null;
  }

  static async updateNotificationPreferences(userId: string, userType: string, preferences: any) {
    const res = await query(
      `UPDATE user_settings 
       SET notification_preferences = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND user_type = $3
       RETURNING *`,
      [JSON.stringify(preferences), userId, userType]
    );
    return res.rows[0] || null;
  }

  static async upsert(settings: {
    user_id: string;
    user_type: string;
    salon_id?: string;
    profile_data?: any;
    notification_preferences?: any;
  }) {
    const existing = await this.findByUserId(settings.user_id, settings.user_type);
    if (existing) {
      return this.updateProfile(settings.user_id, settings.user_type, settings.profile_data || existing.profile_data);
    }
    return this.create(settings);
  }
}
