import pool from '../config/db';
import { v4 as uuidv4 } from 'uuid';
import type { QueryParams } from '../types/repositoryTypes';

export interface PaymentRecord {
  id: string;
  salon_id: string;
  appointment_id?: string;
  client_id?: string;
  staff_id?: string;
  amount: number;
  payment_method: 'cash' | 'phonepe' | 'upi' | 'card' | 'other';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference_number?: string;
  notes?: string;
  recorded_by: string;
  recorded_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DailyZReport {
  id: string;
  salon_id: string;
  report_date: string;
  total_cash: number;
  total_phonepe: number;
  total_upi: number;
  total_card: number;
  total_other: number;
  total_amount: number;
  transaction_count: number;
  notes?: string;
  generated_by: string;
  generated_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentFilters {
  salon_id: string;
  start_date?: string;
  end_date?: string;
  payment_method?: string;
  payment_status?: string;
  client_id?: string;
  staff_id?: string;
  page?: number;
  limit?: number;
}

export interface PaymentStats {
  total_amount: number;
  transaction_count: number;
  by_method: Record<string, { amount: number; count: number }>;
  by_status: Record<string, { amount: number; count: number }>;
}

export class PaymentRecordingRepository {
  async createPayment(data: Omit<PaymentRecord, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentRecord> {
    const query = `
      INSERT INTO payment_records (
        salon_id, appointment_id, client_id, staff_id, amount, 
        payment_method, payment_status, reference_number, notes, 
        recorded_by, recorded_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      data.salon_id,
      data.appointment_id || null,
      data.client_id || null,
      data.staff_id || null,
      data.amount,
      data.payment_method,
      data.payment_status || 'completed',
      data.reference_number || null,
      data.notes || null,
      data.recorded_by,
      data.recorded_at || new Date()
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getPaymentById(id: string, salon_id: string): Promise<PaymentRecord | null> {
    const query = 'SELECT * FROM payment_records WHERE id = $1 AND salon_id = $2';
    const result = await pool.query(query, [id, salon_id]);
    return result.rows[0] || null;
  }

  async getPaymentsByFilters(filters: PaymentFilters): Promise<{ payments: PaymentRecord[]; total: number }> {
    const conditions: string[] = ['salon_id = $1'];
    const values: QueryParams = [filters.salon_id];
    let paramIndex = 2;

    if (filters.start_date) {
      conditions.push(`recorded_at >= $${paramIndex}`);
      values.push(new Date(filters.start_date));
      paramIndex++;
    }

    if (filters.end_date) {
      conditions.push(`recorded_at <= $${paramIndex}`);
      values.push(new Date(filters.end_date));
      paramIndex++;
    }

    if (filters.payment_method) {
      conditions.push(`payment_method = $${paramIndex}`);
      values.push(filters.payment_method);
      paramIndex++;
    }

    if (filters.payment_status) {
      conditions.push(`payment_status = $${paramIndex}`);
      values.push(filters.payment_status);
      paramIndex++;
    }

    if (filters.client_id) {
      conditions.push(`client_id = $${paramIndex}`);
      values.push(filters.client_id);
      paramIndex++;
    }

    if (filters.staff_id) {
      conditions.push(`staff_id = $${paramIndex}`);
      values.push(filters.staff_id);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const limit = filters.limit || 20;
    const offset = ((filters.page || 1) - 1) * limit;

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM payment_records WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const dataQuery = `
      SELECT * FROM payment_records 
      WHERE ${whereClause}
      ORDER BY recorded_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    values.push(limit, offset);
    
    const dataResult = await pool.query(dataQuery, values);
    
    return {
      payments: dataResult.rows,
      total
    };
  }

  async updatePayment(id: string, salon_id: string, updates: Partial<PaymentRecord>): Promise<PaymentRecord | null> {
    const setClauses: string[] = [];
    const values: QueryParams = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'salon_id' && key !== 'created_at') {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (setClauses.length === 0) {
      return this.getPaymentById(id, salon_id);
    }

    setClauses.push(`updated_at = NOW()`);
    
    const query = `
      UPDATE payment_records 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex} AND salon_id = $${paramIndex + 1}
      RETURNING *
    `;
    values.push(id, salon_id);
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async deletePayment(id: string, salon_id: string): Promise<boolean> {
    const query = 'DELETE FROM payment_records WHERE id = $1 AND salon_id = $2';
    const result = await pool.query(query, [id, salon_id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getPaymentStats(salon_id: string, start_date?: string, end_date?: string): Promise<PaymentStats> {
    const conditions: string[] = ['salon_id = $1', "payment_status = 'completed'"];
    const values: QueryParams = [salon_id];
    let paramIndex = 2;

    if (start_date) {
      conditions.push(`recorded_at >= $${paramIndex}`);
      values.push(new Date(start_date));
      paramIndex++;
    }

    if (end_date) {
      conditions.push(`recorded_at <= $${paramIndex}`);
      values.push(new Date(end_date));
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get overall stats
    const statsQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as transaction_count
      FROM payment_records
      WHERE ${whereClause}
    `;
    const statsResult = await pool.query(statsQuery, values);

    // Get stats by method
    const methodQuery = `
      SELECT 
        payment_method,
        COALESCE(SUM(amount), 0) as amount,
        COUNT(*) as count
      FROM payment_records
      WHERE ${whereClause}
      GROUP BY payment_method
    `;
    const methodResult = await pool.query(methodQuery, values);

    // Get stats by status
    const statusQuery = `
      SELECT 
        payment_status,
        COALESCE(SUM(amount), 0) as amount,
        COUNT(*) as count
      FROM payment_records
      WHERE ${whereClause.replace("payment_status = 'completed'", '1=1')}
      GROUP BY payment_status
    `;
    const statusResult = await pool.query(statusQuery, values);

    const by_method: Record<string, { amount: number; count: number }> = {};
    methodResult.rows.forEach(row => {
      by_method[row.payment_method] = {
        amount: parseFloat(row.amount),
        count: parseInt(row.count)
      };
    });

    const by_status: Record<string, { amount: number; count: number }> = {};
    statusResult.rows.forEach(row => {
      by_status[row.payment_status] = {
        amount: parseFloat(row.amount),
        count: parseInt(row.count)
      };
    });

    return {
      total_amount: parseFloat(statsResult.rows[0].total_amount),
      transaction_count: parseInt(statsResult.rows[0].transaction_count),
      by_method,
      by_status
    };
  }

  // Daily Z-Report methods
  async generateZReport(salon_id: string, report_date: string, generated_by: string): Promise<DailyZReport> {
    // First, calculate totals for the day
    const statsQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0) as total_cash,
        COALESCE(SUM(CASE WHEN payment_method = 'phonepe' THEN amount ELSE 0 END), 0) as total_phonepe,
        COALESCE(SUM(CASE WHEN payment_method = 'upi' THEN amount ELSE 0 END), 0) as total_upi,
        COALESCE(SUM(CASE WHEN payment_method = 'card' THEN amount ELSE 0 END), 0) as total_card,
        COALESCE(SUM(CASE WHEN payment_method = 'other' THEN amount ELSE 0 END), 0) as total_other,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as transaction_count
      FROM payment_records
      WHERE salon_id = $1 
        AND DATE(recorded_at) = DATE($2)
        AND payment_status = 'completed'
    `;
    
    const statsResult = await pool.query(statsQuery, [salon_id, report_date]);
    const stats = statsResult.rows[0];

    // Insert or update the Z-report
    const query = `
      INSERT INTO daily_z_reports (
        salon_id, report_date, total_cash, total_phonepe, total_upi,
        total_card, total_other, total_amount, transaction_count, generated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (salon_id, report_date) 
      DO UPDATE SET
        total_cash = EXCLUDED.total_cash,
        total_phonepe = EXCLUDED.total_phonepe,
        total_upi = EXCLUDED.total_upi,
        total_card = EXCLUDED.total_card,
        total_other = EXCLUDED.total_other,
        total_amount = EXCLUDED.total_amount,
        transaction_count = EXCLUDED.transaction_count,
        generated_by = EXCLUDED.generated_by,
        generated_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `;
    
    const values = [
      salon_id,
      report_date,
      parseFloat(stats.total_cash),
      parseFloat(stats.total_phonepe),
      parseFloat(stats.total_upi),
      parseFloat(stats.total_card),
      parseFloat(stats.total_other),
      parseFloat(stats.total_amount),
      parseInt(stats.transaction_count),
      generated_by
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getZReport(salon_id: string, report_date: string): Promise<DailyZReport | null> {
    const query = 'SELECT * FROM daily_z_reports WHERE salon_id = $1 AND report_date = $2';
    const result = await pool.query(query, [salon_id, report_date]);
    return result.rows[0] || null;
  }

  async getZReportsByDateRange(salon_id: string, start_date: string, end_date: string): Promise<DailyZReport[]> {
    const query = `
      SELECT * FROM daily_z_reports 
      WHERE salon_id = $1 AND report_date >= $2 AND report_date <= $3
      ORDER BY report_date DESC
    `;
    const result = await pool.query(query, [salon_id, start_date, end_date]);
    return result.rows;
  }

  async updateZReportNotes(id: string, salon_id: string, notes: string): Promise<DailyZReport | null> {
    const query = `
      UPDATE daily_z_reports 
      SET notes = $1, updated_at = NOW()
      WHERE id = $2 AND salon_id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [notes, id, salon_id]);
    return result.rows[0] || null;
  }
}

export default new PaymentRecordingRepository();
