import { query } from '../config/db';

export type MessageState =
  | 'PENDING_REPLY'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'FAILED';

export class MessageStateManager {
  async createMessageState(
    salon_id: string,
    client_id: string,
    message_type: string,
    engine_context: unknown
  ) {
    const result = await query(
      `INSERT INTO message_states (salon_id, client_id, message_type, engine_context, state)
       VALUES ($1,$2,$3,$4,'PENDING_REPLY') RETURNING *`,
      [salon_id, client_id, message_type, engine_context]
    );

    return result.rows[0];
  }

  async markCompleted(id: string) {
    await query(
      `UPDATE message_states SET state='COMPLETED', updated_at=NOW() WHERE id=$1`,
      [id]
    );
  }

  async markExpired(id: string) {
    await query(
      `UPDATE message_states SET state='EXPIRED', updated_at=NOW() WHERE id=$1`,
      [id]
    );
  }

  async getPendingByClient(client_id: string) {
    const res = await query(
      `SELECT * FROM message_states WHERE client_id=$1 AND state='PENDING_REPLY'`,
      [client_id]
    );

    return res.rows;
  }
}

export const messageStateManager = new MessageStateManager();
