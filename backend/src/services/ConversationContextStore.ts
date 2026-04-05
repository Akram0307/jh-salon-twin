import { query } from '../config/db'
import type { ConversationContextUpdateData } from '../types/serviceTypes';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface BookingIntent {
  serviceId?: string
  serviceName?: string
  staffId?: string
  staffName?: string
  preferredDate?: string
  preferredTime?: string
  duration?: number
  price?: number
  confirmationCode?: string
}

export interface PWAConversationContext {
  sessionId: string
  clientId?: string
  salonId: string
  currentState: 'GREETING' | 'SERVICE_DISCOVERY' | 'SERVICE_RECOMMENDATION' | 'STYLIST_PREFERENCE' | 'TIME_SLOT_SUGGESTION' | 'BOOKING_CONFIRMATION' | 'POST_BOOKING'
  preferences: {
    servicePreferences: string[]
    stylistPreferences: string[]
    timePreferences: string[]
    priceRange?: { min: number; max: number }
  }
  conversationHistory: ConversationMessage[]
  bookingIntent?: BookingIntent
  lastActivity: Date
  sessionData: Record<string, any>
}

export class ConversationContextStore {
  // Legacy methods for backward compatibility
  static async getContext(clientId: string) {
    const res = await query(
      `SELECT * FROM client_chat_context WHERE client_id=$1`,
      [clientId]
    )
    return res.rows[0] || null
  }

  static async updateContext(clientId: string, data: ConversationContextUpdateData) {
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

  // PWA-specific methods
  static async getPWAContext(sessionId: string): Promise<PWAConversationContext | null> {
    const res = await query(
      `SELECT * FROM pwa_conversation_sessions WHERE session_id=$1`,
      [sessionId]
    )
    
    if (!res.rows[0]) return null
    
    const row = res.rows[0]
    return {
      sessionId: row.session_id,
      clientId: row.client_id,
      salonId: row.salon_id,
      currentState: row.current_state,
      preferences: row.preferences || {
        servicePreferences: [],
        stylistPreferences: [],
        timePreferences: []
      },
      conversationHistory: row.conversation_history || [],
      bookingIntent: row.booking_intent,
      lastActivity: new Date(row.last_activity),
      sessionData: row.session_data || {}
    }
  }

  static async updatePWAContext(sessionId: string, data: Partial<PWAConversationContext>): Promise<void> {
    const existing = await this.getPWAContext(sessionId)
    
    if (!existing) {
      // Create new session
      await query(
        `INSERT INTO pwa_conversation_sessions 
        (session_id, client_id, salon_id, current_state, preferences, conversation_history, booking_intent, last_activity, session_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)`,
        [
          sessionId,
          data.clientId || null,
          data.salonId || 'default',
          data.currentState || 'GREETING',
          JSON.stringify(data.preferences || {}),
          JSON.stringify(data.conversationHistory || []),
          data.bookingIntent ? JSON.stringify(data.bookingIntent) : null,
          JSON.stringify(data.sessionData || {})
        ]
      )
    } else {
      // Update existing session
      const updated = { ...existing, ...data }
      await query(
        `UPDATE pwa_conversation_sessions SET
          client_id = $2,
          salon_id = $3,
          current_state = $4,
          preferences = $5,
          conversation_history = $6,
          booking_intent = $7,
          last_activity = NOW(),
          session_data = $8,
          updated_at = NOW()
        WHERE session_id = $1`,
        [
          sessionId,
          updated.clientId,
          updated.salonId,
          updated.currentState,
          JSON.stringify(updated.preferences),
          JSON.stringify(updated.conversationHistory),
          updated.bookingIntent ? JSON.stringify(updated.bookingIntent) : null,
          JSON.stringify(updated.sessionData)
        ]
      )
    }
  }

  static async clearPWAContext(sessionId: string): Promise<void> {
    await query(`DELETE FROM pwa_conversation_sessions WHERE session_id=$1`, [sessionId])
  }

  static async cleanupExpiredSessions(timeoutMinutes: number = 30): Promise<number> {
    const result = await query(
      `DELETE FROM pwa_conversation_sessions 
       WHERE last_activity < NOW() - INTERVAL '${timeoutMinutes} minutes'
       RETURNING session_id`
    )
    return result.rowCount || 0
  }

  static async addMessageToHistory(sessionId: string, message: ConversationMessage): Promise<void> {
    const context = await this.getPWAContext(sessionId)
    if (!context) return
    
    context.conversationHistory.push(message)
    // Keep only last 50 messages to prevent unbounded growth
    if (context.conversationHistory.length > 50) {
      context.conversationHistory = context.conversationHistory.slice(-50)
    }
    
    await this.updatePWAContext(sessionId, {
      conversationHistory: context.conversationHistory,
      lastActivity: new Date()
    })
  }
}
