import { query } from '../config/db'
import type { JsonData } from '../types/repositoryTypes';

export class ConversationRepository {

  static async get(session_id: string) {
    const res = await query(
      `SELECT session_id, context
       FROM conversation_context
       WHERE session_id = $1`,
      [session_id]
    )

    return res.rows[0] || null
  }

  static async save(session_id: string, context: JsonData) {
    await query(
      `INSERT INTO conversation_context (session_id, context)
       VALUES ($1,$2)
       ON CONFLICT (session_id)
       DO UPDATE SET context = EXCLUDED.context`,
      [session_id, context]
    )
  }

  static async clear(session_id: string) {
    await query(
      `DELETE FROM conversation_context WHERE session_id = $1`,
      [session_id]
    )
  }
}
