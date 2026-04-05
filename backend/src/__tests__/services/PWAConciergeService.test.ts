import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PWAConciergeService } from '../../services/PWAConciergeService'
import { ConversationContextStore } from '../../services/ConversationContextStore'
import { AIConciergeBookingService } from '../../services/AIConciergeBookingService'
import { BookingOrchestrator } from '../../services/BookingOrchestrator'
import { RichMediaFormatter } from '../../services/RichMediaFormatter'
import { ServiceRepository } from '../../repositories/ServiceRepository'
import { StaffRepository } from '../../repositories/StaffRepository'
import { WebSocket } from 'ws'

// Mock the dependencies
vi.mock('../../services/ConversationContextStore')
vi.mock('../../services/AIConciergeBookingService')
vi.mock('../../services/BookingOrchestrator')
vi.mock('../../services/RichMediaFormatter')
vi.mock('../../repositories/ServiceRepository')
vi.mock('../../repositories/StaffRepository')

// Mock WebSocket
const mockWebSocket = {
  readyState: WebSocket.OPEN,
  send: vi.fn(),
  on: vi.fn(),
  close: vi.fn()
} as unknown as WebSocket

describe('PWAConciergeService', () => {
  let pwaConciergeService: PWAConciergeService
  const salonId = 'test-salon'
  const clientId = 'test-client'
  const sessionId = 'test-session'

  beforeEach(() => {
    vi.clearAllMocks()
    pwaConciergeService = new PWAConciergeService()
    
    // Mock ConversationContextStore methods
    vi.mocked(ConversationContextStore.getPWAContext).mockResolvedValue(null)
    vi.mocked(ConversationContextStore.updatePWAContext).mockResolvedValue(undefined)
    vi.mocked(ConversationContextStore.addMessageToHistory).mockResolvedValue(undefined)
    vi.mocked(ConversationContextStore.cleanupExpiredSessions).mockResolvedValue(0)
    
    // Mock AIConciergeBookingService
    vi.mocked(AIConciergeBookingService.interpretRequest).mockResolvedValue({
      intent: 'BOOK_SERVICE',
      serviceId: 'service-1',
      serviceName: 'Test Service',
      confidence: 0.9
    })
    
    // Mock ServiceRepository
    vi.mocked(ServiceRepository.findAll).mockResolvedValue([
      {
        id: 'service-1',
        name: 'Test Service',
        description: 'A test service',
        duration_minutes: 60,
        price: 100,
        category: 'test'
      }
    ])
    
    // Mock StaffRepository
    vi.mocked(StaffRepository.findAll).mockResolvedValue([
      {
        id: 'staff-1',
        full_name: 'Test Stylist',
        is_active: true
      }
    ])
    
    // Mock RichMediaFormatter
    vi.mocked(RichMediaFormatter.formatContextualResponse).mockResolvedValue({
      type: 'text',
      data: { text: 'Mock response' }
    })
    vi.mocked(RichMediaFormatter.formatServiceCards).mockResolvedValue([])
    vi.mocked(RichMediaFormatter.formatSlotSelector).mockResolvedValue({
      date: '2026-03-15',
      slots: []
    })
    vi.mocked(RichMediaFormatter.formatBookingSummary).mockResolvedValue({
      serviceName: 'Test Service',
      servicePrice: 100,
      serviceDuration: 60,
      dateTime: '2026-03-15T10:00',
      totalPrice: 100
    })
  })

  it('should handle greeting state and transition to SERVICE_RECOMMENDATION when intent has serviceId', async () => {
    const message = {
      type: 'ai_concierge_message',
      payload: {
        sessionId,
        message: 'I want to book a haircut',
        context: { salonId }
      },
      timestamp: new Date().toISOString()
    }

    // Mock the context to be in GREETING state
    vi.mocked(ConversationContextStore.getPWAContext).mockResolvedValue({
      sessionId,
      clientId,
      salonId,
      currentState: 'GREETING',
      preferences: {},
      conversationHistory: [],
      lastActivity: new Date(),
      sessionData: {}
    })

    await pwaConciergeService.handleMessage(clientId, message, mockWebSocket)

    // Verify that the context was updated to SERVICE_RECOMMENDATION
    expect(ConversationContextStore.updatePWAContext).toHaveBeenCalledWith(
      sessionId,
      expect.objectContaining({
        currentState: 'SERVICE_RECOMMENDATION'
      })
    )

    // Verify that a response was sent
    expect(mockWebSocket.send).toHaveBeenCalled()
  })

  it('should handle greeting state and transition to SERVICE_DISCOVERY for default greeting', async () => {
    // Mock AIConciergeBookingService to return a non-booking intent
    vi.mocked(AIConciergeBookingService.interpretRequest).mockResolvedValue({
      intent: 'GENERAL_INQUIRY',
      confidence: 0.8
    })

    const message = {
      type: 'ai_concierge_message',
      payload: {
        sessionId,
        message: 'Hello',
        context: { salonId }
      },
      timestamp: new Date().toISOString()
    }

    // Mock the context to be in GREETING state
    vi.mocked(ConversationContextStore.getPWAContext).mockResolvedValue({
      sessionId,
      clientId,
      salonId,
      currentState: 'GREETING',
      preferences: {},
      conversationHistory: [],
      lastActivity: new Date(),
      sessionData: {}
    })

    await pwaConciergeService.handleMessage(clientId, message, mockWebSocket)

    // Verify that the context was updated to SERVICE_DISCOVERY
    expect(ConversationContextStore.updatePWAContext).toHaveBeenCalledWith(
      sessionId,
      expect.objectContaining({
        currentState: 'SERVICE_DISCOVERY'
      })
    )

    // Verify that a response was sent
    expect(mockWebSocket.send).toHaveBeenCalled()
  })

  it('should handle session timeout', async () => {
    // This test verifies that the session timeout is handled
    // We can't easily test the timeout without waiting, but we can verify the cleanup
    const cleanedCount = await pwaConciergeService.cleanupExpiredSessions()
    expect(ConversationContextStore.cleanupExpiredSessions).toHaveBeenCalled()
    expect(cleanedCount).toBe(0)
  })

  it('should send typing indicator when processing message', async () => {
    const message = {
      type: 'ai_concierge_message',
      payload: {
        sessionId,
        message: 'Hello',
        context: { salonId }
      },
      timestamp: new Date().toISOString()
    }

    // Mock the context to be in GREETING state
    vi.mocked(ConversationContextStore.getPWAContext).mockResolvedValue({
      sessionId,
      clientId,
      salonId,
      currentState: 'GREETING',
      preferences: {},
      conversationHistory: [],
      lastActivity: new Date(),
      sessionData: {}
    })

    await pwaConciergeService.handleMessage(clientId, message, mockWebSocket)

    // Check that typing indicator was sent (first call)
    const calls = vi.mocked(mockWebSocket.send).mock.calls
    expect(calls.length).toBeGreaterThan(0)
    const firstCall = JSON.parse(calls[0][0] as string)
    expect(firstCall.type).toBe('typing_indicator')
  })
})
