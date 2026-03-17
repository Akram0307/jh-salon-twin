import { pool } from '../config/db';

import logger from '../config/logger';
import type { QueryParams } from '../types/repositoryTypes';
const log = logger.child({ module: 'salon_settings_service' });

export interface SalonBranding {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  tagline?: string;
  description?: string;
  social_links?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
  };
}

export interface BusinessHours {
  day_of_week: number; // 0=Sunday, 6=Saturday
  open_time: string; // HH:MM format
  close_time: string;
  is_closed: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  display_order: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  category_id?: string;
  is_active: boolean;
  display_order: number;
}

export class SalonSettingsService {
  /**
   * Get salon branding settings
   */
  async getBranding(salonId: string): Promise<SalonBranding> {
    try {
      const result = await pool.query(
        `SELECT logo_url, primary_color, secondary_color, tagline, description, social_links 
         FROM salons WHERE id = $1`,
        [salonId]
      );
      
      if (!result.rows[0]) {
        throw new Error('Salon not found');
      }
      
      const salon = result.rows[0];
      return {
        logo_url: salon.logo_url,
        primary_color: salon.primary_color,
        secondary_color: salon.secondary_color,
        tagline: salon.tagline,
        description: salon.description,
        social_links: salon.social_links || {}
      };
    } catch (error) {
      log.error({ err: error }, 'Error getting salon branding:');
      throw error;
    }
  }

  /**
   * Update salon branding
   */
  async updateBranding(salonId: string, branding: Partial<SalonBranding>): Promise<boolean> {
    try {
      const { logo_url, primary_color, secondary_color, tagline, description, social_links } = branding;
      
      await pool.query(
        `UPDATE salons SET 
          logo_url = COALESCE($1, logo_url),
          primary_color = COALESCE($2, primary_color),
          secondary_color = COALESCE($3, secondary_color),
          tagline = COALESCE($4, tagline),
          description = COALESCE($5, description),
          social_links = COALESCE($6, social_links),
          updated_at = NOW()
         WHERE id = $7`,
        [logo_url, primary_color, secondary_color, tagline, description, 
         social_links ? JSON.stringify(social_links) : null, salonId]
      );
      
      return true;
    } catch (error) {
      log.error({ err: error }, 'Error updating salon branding:');
      throw error;
    }
  }

  /**
   * Get business hours for salon
   */
  async getBusinessHours(salonId: string): Promise<BusinessHours[]> {
    try {
      const result = await pool.query(
        `SELECT day_of_week, open_time, close_time, is_closed 
         FROM business_hours 
         WHERE salon_id = $1 
         ORDER BY day_of_week`,
        [salonId]
      );
      
      // If no hours set, return default (Mon-Sat 9-6, Sun closed)
      if (result.rows.length === 0) {
        return this.getDefaultBusinessHours();
      }
      
      return result.rows.map(row => ({
        day_of_week: row.day_of_week,
        open_time: row.open_time,
        close_time: row.close_time,
        is_closed: row.is_closed
      }));
    } catch (error) {
      log.error({ err: error }, 'Error getting business hours:');
      throw error;
    }
  }

  /**
   * Update business hours
   */
  async updateBusinessHours(salonId: string, hours: BusinessHours[]): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete existing hours
      await client.query('DELETE FROM business_hours WHERE salon_id = $1', [salonId]);
      
      // Insert new hours
      for (const hour of hours) {
        await client.query(
          `INSERT INTO business_hours (salon_id, day_of_week, open_time, close_time, is_closed, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [salonId, hour.day_of_week, hour.open_time, hour.close_time, hour.is_closed]
        );
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      log.error({ err: error }, 'Error updating business hours:');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get service categories
   */
  async getServiceCategories(salonId: string): Promise<ServiceCategory[]> {
    try {
      const result = await pool.query(
        `SELECT id, name, description, display_order 
         FROM service_categories 
         WHERE salon_id = $1 AND is_active = true
         ORDER BY display_order`,
        [salonId]
      );
      
      return result.rows;
    } catch (error) {
      log.error({ err: error }, 'Error getting service categories:');
      throw error;
    }
  }

  /**
   * Get services catalog
   */
  async getServicesCatalog(salonId: string, categoryId?: string): Promise<ServiceItem[]> {
    try {
      let query: string;
      let params: QueryParams;
      
      if (categoryId) {
        query = `SELECT id, name, description, duration_minutes, price, category_id, is_active, display_order
                 FROM services 
                 WHERE salon_id = $1 AND category_id = $2 AND is_active = true
                 ORDER BY display_order`;
        params = [salonId, categoryId];
      } else {
        query = `SELECT id, name, description, duration_minutes, price, category_id, is_active, display_order
                 FROM services 
                 WHERE salon_id = $1 AND is_active = true
                 ORDER BY display_order`;
        params = [salonId];
      }
      
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      log.error({ err: error }, 'Error getting services catalog:');
      throw error;
    }
  }

  /**
   * Update service
   */
  async updateService(serviceId: string, updates: Partial<ServiceItem>): Promise<boolean> {
    try {
      const { name, description, duration_minutes, price, category_id, is_active, display_order } = updates;
      
      await pool.query(
        `UPDATE services SET 
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          duration_minutes = COALESCE($3, duration_minutes),
          price = COALESCE($4, price),
          category_id = COALESCE($5, category_id),
          is_active = COALESCE($6, is_active),
          display_order = COALESCE($7, display_order),
          updated_at = NOW()
         WHERE id = $8`,
        [name, description, duration_minutes, price, category_id, is_active, display_order, serviceId]
      );
      
      return true;
    } catch (error) {
      log.error({ err: error }, 'Error updating service:');
      throw error;
    }
  }

  private getDefaultBusinessHours(): BusinessHours[] {
    return [
      { day_of_week: 0, open_time: '00:00', close_time: '00:00', is_closed: true }, // Sunday
      { day_of_week: 1, open_time: '09:00', close_time: '18:00', is_closed: false }, // Monday
      { day_of_week: 2, open_time: '09:00', close_time: '18:00', is_closed: false },
      { day_of_week: 3, open_time: '09:00', close_time: '18:00', is_closed: false },
      { day_of_week: 4, open_time: '09:00', close_time: '18:00', is_closed: false },
      { day_of_week: 5, open_time: '09:00', close_time: '18:00', is_closed: false },
      { day_of_week: 6, open_time: '09:00', close_time: '18:00', is_closed: false },
    ];
  }
}
