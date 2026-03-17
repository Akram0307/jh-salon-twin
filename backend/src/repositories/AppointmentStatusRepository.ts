import db from '../config/db'
import type { QueryParams, JsonData } from '../types/repositoryTypes';

export interface StatusChangeInput {
  appointment_id: string
  salon_id: string
  old_status: string
  new_status: string
  changed_by_staff_id?: string
  change_reason?: string
  metadata?: JsonData
}

export interface AppointmentStatusHistory {
  id: string
  appointment_id: string
  salon_id: string
  old_status: string
  new_status: string
  changed_by_staff_id: string | null
  change_reason: string | null
  metadata: JsonData
  created_at: Date
}

export class AppointmentStatusRepository {

  async recordStatusChange(data: StatusChangeInput): Promise<AppointmentStatusHistory> {
    const result = await db.query(
      `INSERT INTO appointment_status_history 
       (appointment_id, salon_id, old_status, new_status, changed_by_staff_id, change_reason, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.appointment_id,
        data.salon_id,
        data.old_status,
        data.new_status,
        data.changed_by_staff_id || null,
        data.change_reason || null,
        data.metadata || {}
      ]
    )
    return result.rows[0]
  }

  async getStatusHistory(appointmentId: string, salonId: string): Promise<AppointmentStatusHistory[]> {
    const result = await db.query(
      `SELECT * FROM appointment_status_history 
       WHERE appointment_id = $1 AND salon_id = $2
       ORDER BY created_at DESC`,
      [appointmentId, salonId]
    )
    return result.rows
  }

  async getAppointmentStatus(appointmentId: string, salonId: string): Promise<string | null> {
    const result = await db.query(
      `SELECT status FROM appointments 
       WHERE id = $1 AND salon_id = $2`,
      [appointmentId, salonId]
    )
    return result.rows[0]?.status || null
  }

  async updateAppointmentStatus(
    appointmentId: string, 
    salonId: string, 
    newStatus: string,
    changedByStaffId?: string,
    changeReason?: string
  ): Promise<boolean> {
    // First get current status
    const currentStatus = await this.getAppointmentStatus(appointmentId, salonId)
    if (!currentStatus) {
      return false
    }

    // Update appointment status
    const updateResult = await db.query(
      `UPDATE appointments 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND salon_id = $3`,
      [newStatus, appointmentId, salonId]
    )

    if (updateResult.rowCount === 0) {
      return false
    }

    // Record status change in history
    await this.recordStatusChange({
      appointment_id: appointmentId,
      salon_id: salonId,
      old_status: currentStatus,
      new_status: newStatus,
      changed_by_staff_id: changedByStaffId,
      change_reason: changeReason
    })

    return true
  }

  async bulkUpdateStatus(
    appointmentIds: string[], 
    salonId: string, 
    newStatus: string,
    changedByStaffId?: string,
    changeReason?: string
  ): Promise<{ updated: number, failed: string[] }> {
    const client = await db.connect()
    const failed: string[] = []
    let updated = 0

    try {
      await client.query('BEGIN')

      for (const appointmentId of appointmentIds) {
        const currentStatus = await this.getAppointmentStatus(appointmentId, salonId)
        if (!currentStatus) {
          failed.push(appointmentId)
          continue
        }

        const updateResult = await client.query(
          `UPDATE appointments 
           SET status = $1, updated_at = NOW()
           WHERE id = $2 AND salon_id = $3`,
          [newStatus, appointmentId, salonId]
        )

        if (updateResult.rowCount === 0) {
          failed.push(appointmentId)
          continue
        }

        await client.query(
          `INSERT INTO appointment_status_history 
           (appointment_id, salon_id, old_status, new_status, changed_by_staff_id, change_reason)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [appointmentId, salonId, currentStatus, newStatus, changedByStaffId || null, changeReason || null]
        )

        updated++
      }

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

    return { updated, failed }
  }

  async getStatusHistoryBySalon(
    salonId: string, 
    options: { 
      startDate?: Date, 
      endDate?: Date, 
      limit?: number 
    } = {}
  ): Promise<AppointmentStatusHistory[]> {
    const { startDate, endDate, limit = 100 } = options
    let query = `
      SELECT ash.*, a.appointment_time, c.name as client_name, s.name as staff_name
      FROM appointment_status_history ash
      LEFT JOIN appointments a ON ash.appointment_id = a.id
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN staff s ON ash.changed_by_staff_id = s.id
      WHERE ash.salon_id = $1
    `
    const params: QueryParams = [salonId]
    let paramIndex = 2

    if (startDate) {
      query += ` AND ash.created_at >= $${paramIndex}`
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      query += ` AND ash.created_at <= $${paramIndex}`
      params.push(endDate)
      paramIndex++
    }

    query += ` ORDER BY ash.created_at DESC LIMIT $${paramIndex}`
    params.push(limit)

    const result = await db.query(query, params)
    return result.rows
  }
}

export default new AppointmentStatusRepository()
