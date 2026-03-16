import pool from '../config/db';
import { v4 as uuidv4 } from 'uuid';

export interface ActionHistory {
  id: string;
  salon_id: string;
  user_id: string;
  user_type: 'owner' | 'staff' | 'manager' | 'system';
  action_type: string;
  entity_type: string;
  entity_id: string;
  action_data?: any;
  previous_state?: any;
  new_state?: any;
  is_undoable: boolean;
  is_redoable: boolean;
  undone_at?: Date;
  redone_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface LogActionParams {
  salon_id: string;
  user_id: string;
  user_type: 'owner' | 'staff' | 'manager' | 'system';
  action_type: string;
  entity_type: string;
  entity_id: string;
  action_data?: any;
  previous_state?: any;
  new_state?: any;
  is_undoable?: boolean;
}

export class ActionHistoryRepository {
  async logAction(params: LogActionParams): Promise<ActionHistory> {
    const query = `
      INSERT INTO action_history (
        salon_id, user_id, user_type, action_type, entity_type, entity_id,
        action_data, previous_state, new_state, is_undoable
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      params.salon_id,
      params.user_id,
      params.user_type,
      params.action_type,
      params.entity_type,
      params.entity_id,
      JSON.stringify(params.action_data),
      params.previous_state ? JSON.stringify(params.previous_state) : null,
      params.new_state ? JSON.stringify(params.new_state) : null,
      params.is_undoable !== undefined ? params.is_undoable : true
    ];
    
    const result = await pool.query(query, values);
    return this.mapRowToActionHistory(result.rows[0]);
  }

  async getActionHistory(
    salonId: string,
    options: {
      userId?: string;
      entityType?: string;
      entityId?: string;
      actionType?: string;
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ actions: ActionHistory[]; total: number }> {
    let whereConditions = ['salon_id = $1'];
    let queryParams: any[] = [salonId];
    let paramIndex = 2;

    if (options.userId) {
      whereConditions.push(`user_id = $${paramIndex}`);
      queryParams.push(options.userId);
      paramIndex++;
    }

    if (options.entityType) {
      whereConditions.push(`entity_type = $${paramIndex}`);
      queryParams.push(options.entityType);
      paramIndex++;
    }

    if (options.entityId) {
      whereConditions.push(`entity_id = $${paramIndex}`);
      queryParams.push(options.entityId);
      paramIndex++;
    }

    if (options.actionType) {
      whereConditions.push(`action_type = $${paramIndex}`);
      queryParams.push(options.actionType);
      paramIndex++;
    }

    if (options.startDate) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      queryParams.push(options.startDate);
      paramIndex++;
    }

    if (options.endDate) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      queryParams.push(options.endDate);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM action_history WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    
    const dataQuery = `
      SELECT * FROM action_history 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    const dataResult = await pool.query(dataQuery, queryParams);
    
    return {
      actions: dataResult.rows.map(this.mapRowToActionHistory),
      total
    };
  }

  async getActionById(actionId: string): Promise<ActionHistory | null> {
    const query = 'SELECT * FROM action_history WHERE id = $1';
    const result = await pool.query(query, [actionId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToActionHistory(result.rows[0]);
  }

  async markAsUndone(actionId: string): Promise<ActionHistory | null> {
    const query = `
      UPDATE action_history 
      SET is_undoable = false, undone_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND is_undoable = true AND undone_at IS NULL
      RETURNING *
    `;
    
    const result = await pool.query(query, [actionId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToActionHistory(result.rows[0]);
  }

  async markAsRedone(actionId: string): Promise<ActionHistory | null> {
    const query = `
      UPDATE action_history 
      SET is_redoable = true, redone_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND is_undoable = false AND undone_at IS NOT NULL AND redone_at IS NULL
      RETURNING *
    `;
    
    const result = await pool.query(query, [actionId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToActionHistory(result.rows[0]);
  }

  async getUndoableActions(salonId: string, userId?: string): Promise<ActionHistory[]> {
    let query = `
      SELECT * FROM action_history 
      WHERE salon_id = $1 AND is_undoable = true AND undone_at IS NULL
    `;
    
    const params: any[] = [salonId];
    
    if (userId) {
      query += ' AND user_id = $2';
      params.push(userId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows.map(this.mapRowToActionHistory);
  }

  async getRedoableActions(salonId: string, userId?: string): Promise<ActionHistory[]> {
    let query = `
      SELECT * FROM action_history 
      WHERE salon_id = $1 AND is_undoable = false AND undone_at IS NOT NULL AND redone_at IS NULL
    `;
    
    const params: any[] = [salonId];
    
    if (userId) {
      query += ' AND user_id = $2';
      params.push(userId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows.map(this.mapRowToActionHistory);
  }

  private mapRowToActionHistory(row: any): ActionHistory {
    return {
      id: row.id,
      salon_id: row.salon_id,
      user_id: row.user_id,
      user_type: row.user_type,
      action_type: row.action_type,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      action_data: typeof row.action_data === 'string' ? JSON.parse(row.action_data) : row.action_data,
      previous_state: row.previous_state ? (typeof row.previous_state === 'string' ? JSON.parse(row.previous_state) : row.previous_state) : undefined,
      new_state: row.new_state ? (typeof row.new_state === 'string' ? JSON.parse(row.new_state) : row.new_state) : undefined,
      is_undoable: row.is_undoable,
      is_redoable: row.is_redoable,
      undone_at: row.undone_at ? new Date(row.undone_at) : undefined,
      redone_at: row.redone_at ? new Date(row.redone_at) : undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }
}
