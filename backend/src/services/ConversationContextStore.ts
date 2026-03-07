import { query } from '../config/db'

export class ConversationContextStore {

  static async getContext(clientId: string) {
    const res = await query(
      `SELECT * FROM client_chat_context WHERE client_id=$1`,
      [clientId]
    )

    return res.rows[0] || null
  }

  static async updateContext(clientId: string, data: any) {

    await query(
      `INSERT INTO client_chat_context
      (client_id, salon_id, last_intent, pending_action, last_service_id, last_staff_id, conversation_state, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
      ON CONFLICT (client_id)
      DO UPDATE SET
        last_intent = EXCLUDED.last_intent,
        pending_action = EXCLUDED.pending_action,
        last_service_id = EXCLUDED.last_service_id,
        last_staff_id = EXCLUDED.last_staff_id,
        conversation_state = EXCLUDED.conversation_state,
        updated_at = NOW()`,
      [
        clientId,
        data.salon_id,
        data.last_intent,
        data.pending_action,
        data.last_service_id,
        data.last_staff_id,
        data.conversation_state
      ]
    )
  }

  static async clearContext(clientId: string) {
    await query(`DELETE FROM client_chat_context WHERE client_id=$1`, [clientId])
  }
}
