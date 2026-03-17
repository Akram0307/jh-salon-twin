
import logger from '../config/logger';
import { WebSocket } from 'ws'
import { ConversationContextStore, PWAConversationContext, ConversationMessage } from './ConversationContextStore'
import { AIConciergeBookingService, BookingIntent } from './AIConciergeBookingService'
import { BookingOrchestrator } from './BookingOrchestrator'
import { RichMediaFormatter, RichMediaResponse } from './RichMediaFormatter'
import { ServiceRepository } from '../repositories/ServiceRepository'
import { StaffRepository } from '../repositories/StaffRepository'

export type ConciergeState = 
  | 'GREETING' 
  | 'SERVICE_DISCOVERY' 
  | 'SERVICE_RECOMMENDATION' 
  | 'STYLIST_PREFERENCE' 
  | 'TIME_SLOT_SUGGESTION' 
  | 'BOOKING_CONFIRMATION' 
  | 'POST_BOOKING'

export interface ConciergeMessage {
  type: 'ai_concierge_message' | 'ai_concierge_response' | 'typing_indicator' | 'error'
  payload: any
  timestamp: string
}

export interface PWAConciergeConfig {
  sessionTimeoutMinutes: number
  maxHistoryLength: number
  enableRichMedia: boolean
}

export class PWAConciergeService {
  private config: PWAConciergeConfig
  private activeSessions: Map<string, WebSocket> = new Map()
  private sessionTimeouts: Map<string, NodeJS.Timeout> = new Map()

  constructor(config?: Partial<PWAConciergeConfig>) {
    this.config = {
      sessionTimeoutMinutes: 30,
      maxHistoryLength: 50,
      enableRichMedia: true,
      ...config
    }
  }

  async handleMessage(clientId: string, message: ConciergeMessage, ws: WebSocket): Promise<void> {
    try {
      // Store WebSocket connection for this client
      this.activeSessions.set(clientId, ws)
      
      // Reset session timeout
      this.resetSessionTimeout(clientId)

      switch (message.type) {
        case 'ai_concierge_message':
          await this.handleUserMessage(clientId, message.payload, ws)
          break
        
        case 'typing_indicator':
          // Forward typing indicator to other participants if needed
          break
        
        default:
          logger.warn(`Unknown message type: ${message.type}`)
      }
    } catch (error) {
      logger.error({ err: error }, 'Error handling concierge message:')
      this.sendErrorResponse(clientId, 'An error occurred processing your message', ws)
    }
  }

  private async handleUserMessage(clientId: string, payload: any, ws: WebSocket): Promise<void> {
    const { sessionId, message, context: clientContext } = payload
    
    // Get or create conversation context
    let context = await ConversationContextStore.getPWAContext(sessionId)
    
    if (!context) {
      context = await this.createNewContext(sessionId, clientId, clientContext?.salonId)
    }

    // Add user message to history
    const userMessage: ConversationMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    }
    await ConversationContextStore.addMessageToHistory(sessionId, userMessage)

    // Send typing indicator
    this.sendTypingIndicator(clientId, ws)

    // Process message based on current state
    const response = await this.processState(context, message)

    // Add assistant response to history
    const assistantMessage: ConversationMessage = {
      role: 'assistant',
      content: response.text,
      timestamp: new Date(),
      metadata: { richMedia: response.richMedia }
    }
    await ConversationContextStore.addMessageToHistory(sessionId, assistantMessage)

    // Send response
    this.sendResponse(clientId, response, ws)
  }

  private async createNewContext(sessionId: string, clientId: string, salonId?: string): Promise<PWAConversationContext> {
    const context: PWAConversationContext = {
      sessionId,
      clientId,
      salonId: salonId || 'default',
      currentState: 'GREETING',
      preferences: {
        servicePreferences: [],
        stylistPreferences: [],
        timePreferences: []
      },
      conversationHistory: [],
      lastActivity: new Date(),
      sessionData: {}
    }

    await ConversationContextStore.updatePWAContext(sessionId, context)
    return context
  }

  private async processState(context: PWAConversationContext, userMessage: string): Promise<{ text: string; richMedia?: RichMediaResponse; actions?: any[] }> {
    const { currentState, salonId } = context

    switch (currentState) {
      case 'GREETING':
        return await this.handleGreetingState(context, userMessage)
      
      case 'SERVICE_DISCOVERY':
        return await this.handleServiceDiscoveryState(context, userMessage)
      
      case 'SERVICE_RECOMMENDATION':
        return await this.handleServiceRecommendationState(context, userMessage)
      
      case 'STYLIST_PREFERENCE':
        return await this.handleStylistPreferenceState(context, userMessage)
      
      case 'TIME_SLOT_SUGGESTION':
        return await this.handleTimeSlotSuggestionState(context, userMessage)
      
      case 'BOOKING_CONFIRMATION':
        return await this.handleBookingConfirmationState(context, userMessage)
      
      case 'POST_BOOKING':
        return await this.handlePostBookingState(context, userMessage)
      
      default:
        return { text: 'I apologize, but I seem to be lost. Let me start over. How can I help you today?' }
    }
  }

  private async handleGreetingState(context: PWAConversationContext, userMessage: string): Promise<{ text: string; richMedia?: RichMediaResponse }> {
    // Check if user is asking for something specific
    const intent = await AIConciergeBookingService.interpretRequest(userMessage, context.salonId, context.clientId)
    
    if (intent.intent === 'BOOK_SERVICE' && intent.serviceId) {
      // User already knows what they want
      context.bookingIntent = {
        serviceId: intent.serviceId,
        serviceName: intent.serviceName,
        staffId: intent.staffId,
        staffName: intent.staffName,
        preferredDate: intent.preferredDate,
        preferredTime: intent.preferredTime,
        duration: intent.duration
      }
      
      // Move to appropriate state based on what's missing
      if (!intent.preferredDate) {
        context.currentState = 'SERVICE_RECOMMENDATION'
      } else if (!intent.staffId || intent.staffId === 'any') {
        context.currentState = 'STYLIST_PREFERENCE'
      } else {
        context.currentState = 'TIME_SLOT_SUGGESTION'
      }
      
      await ConversationContextStore.updatePWAContext(context.sessionId, context)
      return await this.processState(context, userMessage)
    }
    
    // Default greeting
    const greetingText = `Hello! Welcome to SalonOS. I'm your personal concierge. I can help you book an appointment, explore our services, or answer any questions. How can I assist you today?`
    
    const richMedia = this.config.enableRichMedia 
      ? await RichMediaFormatter.formatContextualResponse(context.salonId, context, greetingText)
      : undefined
    
    // Move to service discovery
    context.currentState = 'SERVICE_DISCOVERY'
    await ConversationContextStore.updatePWAContext(context.sessionId, context)
    
    return { text: greetingText, richMedia }
  }

  private async handleServiceDiscoveryState(context: PWAConversationContext, userMessage: string): Promise<{ text: string; richMedia?: RichMediaResponse }> {
    const intent = await AIConciergeBookingService.interpretRequest(userMessage, context.salonId, context.clientId)
    
    if (intent.intent === 'BOOK_SERVICE' && intent.serviceId) {
      // User selected a service
      context.bookingIntent = {
        serviceId: intent.serviceId,
        serviceName: intent.serviceName,
        staffId: intent.staffId,
        staffName: intent.staffName,
        preferredDate: intent.preferredDate,
        preferredTime: intent.preferredTime,
        duration: intent.duration
      }
      
      context.currentState = 'SERVICE_RECOMMENDATION'
      await ConversationContextStore.updatePWAContext(context.sessionId, context)
      return await this.processState(context, userMessage)
    }
    
    // Show available services
    const services = await ServiceRepository.findAll(context.salonId)
    const serviceList = services.map(s => `• ${s.name} (${s.duration_minutes} min, $${s.price})`).join('\n')
    
    const text = `Here are our available services:\n\n${serviceList}\n\nWhich service would you like to book?`
    
    const richMedia = this.config.enableRichMedia
      ? await RichMediaFormatter.formatContextualResponse(context.salonId, context, text)
      : undefined
    
    return { text, richMedia }
  }

  private async handleServiceRecommendationState(context: PWAConversationContext, userMessage: string): Promise<{ text: string; richMedia?: RichMediaResponse }> {
    if (!context.bookingIntent?.serviceId) {
      context.currentState = 'SERVICE_DISCOVERY'
      await ConversationContextStore.updatePWAContext(context.sessionId, context)
      return await this.processState(context, userMessage)
    }
    
    const service = await ServiceRepository.findById(context.bookingIntent.serviceId, context.salonId)
    if (!service) {
      return { text: 'I apologize, but I couldn\'t find that service. Let me show you our available services again.' }
    }
    
    const text = `Great choice! ${service.name} is ${service.duration_minutes} minutes and costs $${service.price}. ${service.description || ''}\n\nWould you like to proceed with booking this service?`
    
    const richMedia = this.config.enableRichMedia
      ? await RichMediaFormatter.formatContextualResponse(context.salonId, context, text)
      : undefined
    
    // Check if user confirms
    if (/^\s*(yes|yeah|yep|confirm|book it|sounds good)\s*$/i.test(userMessage.trim())) {
      context.currentState = 'STYLIST_PREFERENCE'
      await ConversationContextStore.updatePWAContext(context.sessionId, context)
    }
    
    return { text, richMedia }
  }

  private async handleStylistPreferenceState(context: PWAConversationContext, userMessage: string): Promise<{ text: string; richMedia?: RichMediaResponse }> {
    const intent = await AIConciergeBookingService.interpretRequest(userMessage, context.salonId, context.clientId)
    
    if (intent.staffId && intent.staffId !== 'any') {
      // User selected a specific stylist
      if (!context.bookingIntent) context.bookingIntent = {}
      context.bookingIntent.staffId = intent.staffId
      context.bookingIntent.staffName = intent.staffName
      
      context.currentState = 'TIME_SLOT_SUGGESTION'
      await ConversationContextStore.updatePWAContext(context.sessionId, context)
      return await this.processState(context, userMessage)
    }
    
    // Show available stylists
    const stylists = await StaffRepository.findAll(context.salonId)
    const activeStylists = stylists.filter(s => s.is_active)
    
    if (activeStylists.length === 0) {
      return { text: 'We currently don\'t have any available stylists. Please try again later.' }
    }
    
    const stylistList = activeStylists.map(s => `• ${s.full_name}`).join('\n')
    const text = `Our talented stylists:\n\n${stylistList}\n\nDo you have a preference, or would you like to be matched with any available stylist?`
    
    const richMedia = this.config.enableRichMedia
      ? await RichMediaFormatter.formatContextualResponse(context.salonId, context, text)
      : undefined
    
    // If user says "any" or similar
    if (/^\s*(any|anyone|no preference|doesn't matter|any available)\s*$/i.test(userMessage.trim())) {
      if (!context.bookingIntent) context.bookingIntent = {}
      context.bookingIntent.staffId = 'any'
      context.bookingIntent.staffName = 'Any available stylist'
      
      context.currentState = 'TIME_SLOT_SUGGESTION'
      await ConversationContextStore.updatePWAContext(context.sessionId, context)
    }
    
    return { text, richMedia }
  }

  private async handleTimeSlotSuggestionState(context: PWAConversationContext, userMessage: string): Promise<{ text: string; richMedia?: RichMediaResponse }> {
    if (!context.bookingIntent?.serviceId) {
      context.currentState = 'SERVICE_DISCOVERY'
      await ConversationContextStore.updatePWAContext(context.sessionId, context)
      return await this.processState(context, userMessage)
    }
    
    const intent = await AIConciergeBookingService.interpretRequest(userMessage, context.salonId, context.clientId)
    
    if (intent.preferredDate && intent.preferredTime) {
      // User provided date and time
      if (!context.bookingIntent) context.bookingIntent = {}
      context.bookingIntent.preferredDate = intent.preferredDate
      context.bookingIntent.preferredTime = intent.preferredTime
      
      context.currentState = 'BOOKING_CONFIRMATION'
      await ConversationContextStore.updatePWAContext(context.sessionId, context)
      return await this.processState(context, userMessage)
    }
    
    // Show available time slots
    const text = `When would you like to schedule your appointment? Please provide a date and time, or let me know your preferences (e.g., "tomorrow afternoon", "next week").`
    
    const richMedia = this.config.enableRichMedia
      ? await RichMediaFormatter.formatContextualResponse(context.salonId, context, text)
      : undefined
    
    return { text, richMedia }
  }

  private async handleBookingConfirmationState(context: PWAConversationContext, userMessage: string): Promise<{ text: string; richMedia?: RichMediaResponse }> {
    if (!context.bookingIntent?.serviceId || !context.bookingIntent?.preferredDate || !context.bookingIntent?.preferredTime) {
      context.currentState = 'TIME_SLOT_SUGGESTION'
      await ConversationContextStore.updatePWAContext(context.sessionId, context)
      return await this.processState(context, userMessage)
    }
    
    // Check if user confirms booking
    if (/^\s*(yes|yeah|yep|confirm|book it|sounds good)\s*$/i.test(userMessage.trim())) {
      // Create the booking
      const bookingResult = await BookingOrchestrator.createAppointment({
        salonId: context.salonId,
        clientId: context.clientId || 'anonymous',
        serviceId: context.bookingIntent.serviceId,
        staffId: context.bookingIntent.staffId !== 'any' ? context.bookingIntent.staffId : undefined,
        slotTime: `${context.bookingIntent.preferredDate}T${context.bookingIntent.preferredTime}`
      })
      
      if (bookingResult.success) {
        // Update context with booking confirmation
        context.bookingIntent.confirmationCode = bookingResult.appointmentId
        context.currentState = 'POST_BOOKING'
        await ConversationContextStore.updatePWAContext(context.sessionId, context)
        
        const text = `Excellent! Your appointment has been booked successfully. Your confirmation code is: ${bookingResult.appointmentId}. We've sent a confirmation to your phone. Is there anything else I can help you with?`
        
        const bookingSummary = this.config.enableRichMedia
          ? await RichMediaFormatter.formatBookingSummary(context.salonId, context.bookingIntent, bookingResult.appointmentId)
          : undefined
        
        const richMedia = bookingSummary ? { type: 'booking_summary' as const, data: bookingSummary } : undefined
        
        return { text, richMedia }
      } else {
        return { text: `I apologize, but there was an issue booking your appointment: ${bookingResult.error}. Please try again or choose a different time.` }
      }
    }
    
    // Show booking summary for confirmation
    const text = `Let me confirm your booking details:\n\n` +
      `Service: ${context.bookingIntent.serviceName}\n` +
      `Date: ${context.bookingIntent.preferredDate}\n` +
      `Time: ${context.bookingIntent.preferredTime}\n` +
      `Stylist: ${context.bookingIntent.staffName || 'Any available stylist'}\n\n` +
      `Does everything look correct?`
    
    const bookingSummary = this.config.enableRichMedia
      ? await RichMediaFormatter.formatBookingSummary(context.salonId, context.bookingIntent)
      : undefined
    
    const richMedia = bookingSummary ? { type: 'booking_summary' as const, data: bookingSummary } : undefined
    
    return { text, richMedia }
  }

  private async handlePostBookingState(context: PWAConversationContext, userMessage: string): Promise<{ text: string; richMedia?: RichMediaResponse }> {
    // Handle follow-up questions or new bookings
    const intent = await AIConciergeBookingService.interpretRequest(userMessage, context.salonId, context.clientId)
    
    if (intent.intent === 'BOOK_SERVICE') {
      // Start a new booking flow
      context.bookingIntent = {
        serviceId: intent.serviceId,
        serviceName: intent.serviceName,
        staffId: intent.staffId,
        staffName: intent.staffName,
        preferredDate: intent.preferredDate,
        preferredTime: intent.preferredTime,
        duration: intent.duration
      }
      
      context.currentState = 'SERVICE_RECOMMENDATION'
      await ConversationContextStore.updatePWAContext(context.sessionId, context)
      return await this.processState(context, userMessage)
    }
    
    // Default post-booking response
    const text = `Your appointment is all set! Remember to arrive 10 minutes early. If you need to reschedule or have any questions, just let me know. Is there anything else I can help you with today?`
    
    return { text }
  }

  private sendTypingIndicator(clientId: string, ws: WebSocket): void {
    const message: ConciergeMessage = {
      type: 'typing_indicator',
      payload: { isTyping: true },
      timestamp: new Date().toISOString()
    }
    this.sendToClient(clientId, message, ws)
  }

  private sendResponse(clientId: string, response: { text: string; richMedia?: RichMediaResponse; actions?: any[] }, ws: WebSocket): void {
    const message: ConciergeMessage = {
      type: 'ai_concierge_response',
      payload: {
        message: response.text,
        richMedia: response.richMedia,
        actions: response.actions
      },
      timestamp: new Date().toISOString()
    }
    this.sendToClient(clientId, message, ws)
  }

  private sendErrorResponse(clientId: string, errorText: string, ws: WebSocket): void {
    const message: ConciergeMessage = {
      type: 'error',
      payload: { error: errorText },
      timestamp: new Date().toISOString()
    }
    this.sendToClient(clientId, message, ws)
  }

  private sendToClient(clientId: string, message: ConciergeMessage, ws: WebSocket): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  private resetSessionTimeout(clientId: string): void {
    // Clear existing timeout
    const existingTimeout = this.sessionTimeouts.get(clientId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }
    
    // Set new timeout
    const timeout = setTimeout(async () => {
      await this.handleSessionTimeout(clientId)
    }, this.config.sessionTimeoutMinutes * 60 * 1000)
    
    this.sessionTimeouts.set(clientId, timeout)
  }

  private async handleSessionTimeout(clientId: string): Promise<void> {
    const ws = this.activeSessions.get(clientId)
    if (ws) {
      const message: ConciergeMessage = {
        type: 'ai_concierge_response',
        payload: {
          message: 'Your session has timed out due to inactivity. Please start a new conversation.',
          richMedia: { type: 'text', data: { text: 'Session timeout' } }
        },
        timestamp: new Date().toISOString()
      }
      this.sendToClient(clientId, message, ws)
      
      // Clean up
      this.activeSessions.delete(clientId)
      this.sessionTimeouts.delete(clientId)
    }
  }

  async cleanupExpiredSessions(): Promise<number> {
    return await ConversationContextStore.cleanupExpiredSessions(this.config.sessionTimeoutMinutes)
  }

  getActiveSessionsCount(): number {
    return this.activeSessions.size
  }
}

// Singleton instance
export const pwaConciergeService = new PWAConciergeService()
