import db from '../config/db'
import type { QueryParams } from '../types/repositoryTypes';

export interface ClientNoteInput {
  client_id: string
  appointment_id?: string
  salon_id: string
  staff_id: string
  note_type?: string
  content: string
  is_pinned?: boolean
  tags?: string[]
}

export interface ClientNote extends ClientNoteInput {
  id: string
  created_at: Date
  updated_at: Date
}

export class ClientNoteRepository {

  async getById(noteId: string, salonId: string): Promise<ClientNote | null> {
    const result = await db.query(
      `SELECT * FROM client_notes 
       WHERE id = $1 AND salon_id = $2`,
      [noteId, salonId]
    )
    return result.rows[0] || null
  }

  async getByClient(
    clientId: string, 
    salonId: string, 
    options: { 
      page?: number, 
      limit?: number, 
      noteType?: string, 
      pinnedOnly?: boolean 
    } = {}
  ): Promise<{ notes: ClientNote[], total: number }> {
    const { page = 1, limit = 20, noteType, pinnedOnly = false } = options
    const offset = (page - 1) * limit
    
    let query = `SELECT * FROM client_notes WHERE client_id = $1 AND salon_id = $2`
    let countQuery = `SELECT COUNT(*) FROM client_notes WHERE client_id = $1 AND salon_id = $2`
    const params: QueryParams = [clientId, salonId]
    let paramIndex = 3

    if (noteType) {
      query += ` AND note_type = $${paramIndex}`
      countQuery += ` AND note_type = $${paramIndex}`
      params.push(noteType)
      paramIndex++
    }

    if (pinnedOnly) {
      query += ` AND is_pinned = true`
      countQuery += ` AND is_pinned = true`
    }

    query += ` ORDER BY is_pinned DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const [notesResult, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, params.slice(0, paramIndex - 1))
    ])

    return {
      notes: notesResult.rows,
      total: parseInt(countResult.rows[0].count)
    }
  }

  async createNote(data: ClientNoteInput): Promise<ClientNote> {
    const result = await db.query(
      `INSERT INTO client_notes 
       (client_id, appointment_id, salon_id, staff_id, note_type, content, is_pinned, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.client_id,
        data.appointment_id || null,
        data.salon_id,
        data.staff_id,
        data.note_type || 'general',
        data.content,
        data.is_pinned || false,
        data.tags || []
      ]
    )
    return result.rows[0]
  }

  async updateNote(
    noteId: string, 
    salonId: string, 
    payload: Partial<ClientNoteInput>
  ): Promise<ClientNote | null> {
    const setClauses: string[] = []
    const params: QueryParams = []
    let paramIndex = 1

    if (payload.content !== undefined) {
      setClauses.push(`content = $${paramIndex}`)
      params.push(payload.content)
      paramIndex++
    }

    if (payload.note_type !== undefined) {
      setClauses.push(`note_type = $${paramIndex}`)
      params.push(payload.note_type)
      paramIndex++
    }

    if (payload.is_pinned !== undefined) {
      setClauses.push(`is_pinned = $${paramIndex}`)
      params.push(payload.is_pinned)
      paramIndex++
    }

    if (payload.tags !== undefined) {
      setClauses.push(`tags = $${paramIndex}`)
      params.push(payload.tags)
      paramIndex++
    }

    if (payload.appointment_id !== undefined) {
      setClauses.push(`appointment_id = $${paramIndex}`)
      params.push(payload.appointment_id)
      paramIndex++
    }

    if (setClauses.length === 0) {
      return this.getById(noteId, salonId)
    }

    setClauses.push(`updated_at = NOW()`)
    
    const query = `
      UPDATE client_notes 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex} AND salon_id = $${paramIndex + 1}
      RETURNING *
    `
    params.push(noteId, salonId)

    const result = await db.query(query, params)
    return result.rows[0] || null
  }

  async deleteNote(noteId: string, salonId: string): Promise<boolean> {
    const result = await db.query(
      `DELETE FROM client_notes WHERE id = $1 AND salon_id = $2`,
      [noteId, salonId]
    )
    return (result.rowCount ?? 0) > 0
  }

  async searchNotes(
    clientId: string, 
    salonId: string, 
    searchTerm: string,
    options: { limit?: number } = {}
  ): Promise<ClientNote[]> {
    const { limit = 20 } = options
    
    const result = await db.query(
      `SELECT * FROM client_notes 
       WHERE client_id = $1 AND salon_id = $2 
       AND search_vector @@ to_tsquery('english', $3)
       ORDER BY ts_rank(search_vector, to_tsquery('english', $3)) DESC
       LIMIT $4`,
      [clientId, salonId, searchTerm.split(' ').join(' & '), limit]
    )
    
    return result.rows
  }

  async getNotesByAppointment(appointmentId: string, salonId: string): Promise<ClientNote[]> {
    const result = await db.query(
      `SELECT * FROM client_notes 
       WHERE appointment_id = $1 AND salon_id = $2
       ORDER BY created_at DESC`,
      [appointmentId, salonId]
    )
    return result.rows
  }

  async getRecentNotes(salonId: string, limit: number = 10): Promise<ClientNote[]> {
    const result = await db.query(
      `SELECT cn.*, c.name as client_name, c.phone as client_phone
       FROM client_notes cn
       JOIN clients c ON cn.client_id = c.id
       WHERE cn.salon_id = $1
       ORDER BY cn.created_at DESC
       LIMIT $2`,
      [salonId, limit]
    )
    return result.rows
  }
}

export default new ClientNoteRepository()
