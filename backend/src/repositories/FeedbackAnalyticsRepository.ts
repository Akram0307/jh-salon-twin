import pool from '../config/db';
import { v4 as uuidv4 } from 'uuid';

export interface Feedback {
  id: string;
  salon_id: string;
  user_id: string;
  feedback_type: 'bug_report' | 'feature_request' | 'general_feedback';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  page_url?: string;
  browser_info?: any;
  attachments?: string[];
  admin_notes?: string;
  resolved_by?: string;
  resolved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UsageAnalyticsEvent {
  id: string;
  salon_id: string;
  user_id?: string;
  event_name: string;
  event_category: string;
  event_data?: any;
  page_url?: string;
  session_id?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface FeedbackFilters {
  salon_id: string;
  feedback_type?: string;
  status?: string;
  priority?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface AnalyticsFilters {
  salon_id: string;
  event_name?: string;
  event_category?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface FeedbackStats {
  total_count: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  recent_feedback: Feedback[];
}

export interface AnalyticsSummary {
  total_events: number;
  unique_users: number;
  unique_sessions: number;
  by_category: Record<string, { count: number; unique_users: number }>;
  by_event: Record<string, { count: number; unique_users: number }>;
  top_pages: Array<{ page_url: string; count: number }>;
}

export class FeedbackAnalyticsRepository {
  // Feedback methods
  async createFeedback(data: Omit<Feedback, 'id' | 'created_at' | 'updated_at'>): Promise<Feedback> {
    const query = `
      INSERT INTO feedback (
        salon_id, user_id, feedback_type, title, description, priority, status,
        page_url, browser_info, attachments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      data.salon_id,
      data.user_id,
      data.feedback_type,
      data.title,
      data.description,
      data.priority || 'medium',
      data.status || 'open',
      data.page_url || null,
      data.browser_info ? JSON.stringify(data.browser_info) : null,
      data.attachments || null
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getFeedbackById(id: string, salon_id: string): Promise<Feedback | null> {
    const query = 'SELECT * FROM feedback WHERE id = $1 AND salon_id = $2';
    const result = await pool.query(query, [id, salon_id]);
    return result.rows[0] || null;
  }

  async getFeedbackByFilters(filters: FeedbackFilters): Promise<{ feedback: Feedback[]; total: number }> {
    const conditions: string[] = ['salon_id = $1'];
    const values: any[] = [filters.salon_id];
    let paramIndex = 2;

    if (filters.feedback_type) {
      conditions.push(`feedback_type = $${paramIndex}`);
      values.push(filters.feedback_type);
      paramIndex++;
    }

    if (filters.status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.priority) {
      conditions.push(`priority = $${paramIndex}`);
      values.push(filters.priority);
      paramIndex++;
    }

    if (filters.user_id) {
      conditions.push(`user_id = $${paramIndex}`);
      values.push(filters.user_id);
      paramIndex++;
    }

    if (filters.start_date) {
      conditions.push(`created_at >= $${paramIndex}`);
      values.push(new Date(filters.start_date));
      paramIndex++;
    }

    if (filters.end_date) {
      conditions.push(`created_at <= $${paramIndex}`);
      values.push(new Date(filters.end_date));
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const limit = filters.limit || 20;
    const offset = ((filters.page || 1) - 1) * limit;

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM feedback WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const dataQuery = `
      SELECT * FROM feedback 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    values.push(limit, offset);
    
    const dataResult = await pool.query(dataQuery, values);
    
    return {
      feedback: dataResult.rows,
      total
    };
  }

  async updateFeedback(id: string, salon_id: string, updates: Partial<Feedback>): Promise<Feedback | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'salon_id' && key !== 'created_at') {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (setClauses.length === 0) {
      return this.getFeedbackById(id, salon_id);
    }

    setClauses.push(`updated_at = NOW()`);
    
    const query = `
      UPDATE feedback 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex} AND salon_id = $${paramIndex + 1}
      RETURNING *
    `;
    values.push(id, salon_id);
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteFeedback(id: string, salon_id: string): Promise<boolean> {
    const query = 'DELETE FROM feedback WHERE id = $1 AND salon_id = $2';
    const result = await pool.query(query, [id, salon_id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getFeedbackStats(salon_id: string, start_date?: string, end_date?: string): Promise<FeedbackStats> {
    const conditions: string[] = ['salon_id = $1'];
    const values: any[] = [salon_id];
    let paramIndex = 2;

    if (start_date) {
      conditions.push(`created_at >= $${paramIndex}`);
      values.push(new Date(start_date));
      paramIndex++;
    }

    if (end_date) {
      conditions.push(`created_at <= $${paramIndex}`);
      values.push(new Date(end_date));
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const totalQuery = `SELECT COUNT(*) FROM feedback WHERE ${whereClause}`;
    const totalResult = await pool.query(totalQuery, values);
    const total_count = parseInt(totalResult.rows[0].count);

    // Get counts by type
    const typeQuery = `
      SELECT feedback_type, COUNT(*) as count
      FROM feedback
      WHERE ${whereClause}
      GROUP BY feedback_type
    `;
    const typeResult = await pool.query(typeQuery, values);
    const by_type: Record<string, number> = {};
    typeResult.rows.forEach(row => {
      by_type[row.feedback_type] = parseInt(row.count);
    });

    // Get counts by status
    const statusQuery = `
      SELECT status, COUNT(*) as count
      FROM feedback
      WHERE ${whereClause}
      GROUP BY status
    `;
    const statusResult = await pool.query(statusQuery, values);
    const by_status: Record<string, number> = {};
    statusResult.rows.forEach(row => {
      by_status[row.status] = parseInt(row.count);
    });

    // Get counts by priority
    const priorityQuery = `
      SELECT priority, COUNT(*) as count
      FROM feedback
      WHERE ${whereClause}
      GROUP BY priority
    `;
    const priorityResult = await pool.query(priorityQuery, values);
    const by_priority: Record<string, number> = {};
    priorityResult.rows.forEach(row => {
      by_priority[row.priority] = parseInt(row.count);
    });

    // Get recent feedback (last 5)
    const recentQuery = `
      SELECT * FROM feedback
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT 5
    `;
    const recentResult = await pool.query(recentQuery, values);
    const recent_feedback = recentResult.rows;

    return {
      total_count,
      by_type,
      by_status,
      by_priority,
      recent_feedback
    };
  }

  // Analytics methods
  async trackEvent(data: Omit<UsageAnalyticsEvent, 'id' | 'created_at'>): Promise<UsageAnalyticsEvent> {
    const query = `
      INSERT INTO usage_analytics (
        salon_id, user_id, event_name, event_category, event_data,
        page_url, session_id, device_type, browser, os, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      data.salon_id,
      data.user_id || null,
      data.event_name,
      data.event_category,
      data.event_data ? JSON.stringify(data.event_data) : null,
      data.page_url || null,
      data.session_id || null,
      data.device_type || null,
      data.browser || null,
      data.os || null,
      data.ip_address || null,
      data.user_agent || null
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getAnalyticsByFilters(filters: AnalyticsFilters): Promise<{ events: UsageAnalyticsEvent[]; total: number }> {
    const conditions: string[] = ['salon_id = $1'];
    const values: any[] = [filters.salon_id];
    let paramIndex = 2;

    if (filters.event_name) {
      conditions.push(`event_name = $${paramIndex}`);
      values.push(filters.event_name);
      paramIndex++;
    }

    if (filters.event_category) {
      conditions.push(`event_category = $${paramIndex}`);
      values.push(filters.event_category);
      paramIndex++;
    }

    if (filters.user_id) {
      conditions.push(`user_id = $${paramIndex}`);
      values.push(filters.user_id);
      paramIndex++;
    }

    if (filters.start_date) {
      conditions.push(`created_at >= $${paramIndex}`);
      values.push(new Date(filters.start_date));
      paramIndex++;
    }

    if (filters.end_date) {
      conditions.push(`created_at <= $${paramIndex}`);
      values.push(new Date(filters.end_date));
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const limit = filters.limit || 100;
    const offset = ((filters.page || 1) - 1) * limit;

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM usage_analytics WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const dataQuery = `
      SELECT * FROM usage_analytics 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    values.push(limit, offset);
    
    const dataResult = await pool.query(dataQuery, values);
    
    return {
      events: dataResult.rows,
      total
    };
  }

  async getAnalyticsSummary(salon_id: string, start_date?: string, end_date?: string): Promise<AnalyticsSummary> {
    const conditions: string[] = ['salon_id = $1'];
    const values: any[] = [salon_id];
    let paramIndex = 2;

    if (start_date) {
      conditions.push(`created_at >= $${paramIndex}`);
      values.push(new Date(start_date));
      paramIndex++;
    }

    if (end_date) {
      conditions.push(`created_at <= $${paramIndex}`);
      values.push(new Date(end_date));
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total events
    const totalQuery = `SELECT COUNT(*) FROM usage_analytics WHERE ${whereClause}`;
    const totalResult = await pool.query(totalQuery, values);
    const total_events = parseInt(totalResult.rows[0].count);

    // Get unique users
    const usersQuery = `SELECT COUNT(DISTINCT user_id) FROM usage_analytics WHERE ${whereClause} AND user_id IS NOT NULL`;
    const usersResult = await pool.query(usersQuery, values);
    const unique_users = parseInt(usersResult.rows[0].count);

    // Get unique sessions
    const sessionsQuery = `SELECT COUNT(DISTINCT session_id) FROM usage_analytics WHERE ${whereClause} AND session_id IS NOT NULL`;
    const sessionsResult = await pool.query(sessionsQuery, values);
    const unique_sessions = parseInt(sessionsResult.rows[0].count);

    // Get counts by category
    const categoryQuery = `
      SELECT event_category, COUNT(*) as count, COUNT(DISTINCT user_id) as unique_users
      FROM usage_analytics
      WHERE ${whereClause}
      GROUP BY event_category
    `;
    const categoryResult = await pool.query(categoryQuery, values);
    const by_category: Record<string, { count: number; unique_users: number }> = {};
    categoryResult.rows.forEach(row => {
      by_category[row.event_category] = {
        count: parseInt(row.count),
        unique_users: parseInt(row.unique_users)
      };
    });

    // Get counts by event
    const eventQuery = `
      SELECT event_name, COUNT(*) as count, COUNT(DISTINCT user_id) as unique_users
      FROM usage_analytics
      WHERE ${whereClause}
      GROUP BY event_name
      ORDER BY count DESC
      LIMIT 10
    `;
    const eventResult = await pool.query(eventQuery, values);
    const by_event: Record<string, { count: number; unique_users: number }> = {};
    eventResult.rows.forEach(row => {
      by_event[row.event_name] = {
        count: parseInt(row.count),
        unique_users: parseInt(row.unique_users)
      };
    });

    // Get top pages
    const pagesQuery = `
      SELECT page_url, COUNT(*) as count
      FROM usage_analytics
      WHERE ${whereClause} AND page_url IS NOT NULL
      GROUP BY page_url
      ORDER BY count DESC
      LIMIT 10
    `;
    const pagesResult = await pool.query(pagesQuery, values);
    const top_pages = pagesResult.rows.map(row => ({
      page_url: row.page_url,
      count: parseInt(row.count)
    }));

    return {
      total_events,
      unique_users,
      unique_sessions,
      by_category,
      by_event,
      top_pages
    };
  }

  async getDailyAnalyticsSummary(salon_id: string, start_date: string, end_date: string): Promise<any[]> {
    const query = `
      SELECT * FROM daily_usage_summary
      WHERE salon_id = $1 AND event_date >= $2 AND event_date <= $3
      ORDER BY event_date DESC
    `;
    const result = await pool.query(query, [salon_id, start_date, end_date]);
    return result.rows;
  }
}

export default new FeedbackAnalyticsRepository();
