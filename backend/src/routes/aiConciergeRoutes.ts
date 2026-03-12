import { Request, Response, Router } from 'express'
import { AIConciergeBookingService, BookingIntent } from '../services/AIConciergeBookingService'
import { ConversationContextStore } from '../services/ConversationContextStore'

type ConciergeChatBody = {
  message?: string
  salonId?: string
  clientId?: string
  sessionId?: string
}

type DirectBookBody = {
  salonId?: string
  clientId?: string
  serviceId?: string
  staffId?: string
  dateTime?: string
  serviceName?: string
  staffName?: string
}

const router = Router()
const ok = (res: Response, data: unknown) => res.json({ success: true, data })
const fail = (res: Response, status: number, code: string, message: string, details?: unknown) =>
  res.status(status).json({ success: false, code, message, details })

router.post('/chat', async (req: Request<unknown, unknown, ConciergeChatBody>, res: Response) => {
  try {
    const { message, salonId, clientId } = req.body
    if (!message || !salonId) return fail(res, 400, 'INVALID_REQUEST', 'message and salonId are required')

    const context = clientId ? await AIConciergeBookingService.getContext(clientId) as Record<string, unknown> | null : null
    const intent = await AIConciergeBookingService.interpretRequest(message, salonId, clientId)

    if (intent.intent === 'CONFIRM_BOOKING' && context?.pending_action === 'confirm_booking') {
      const restoredIntent: BookingIntent = {
        intent: 'BOOK_SERVICE',
        serviceId: context.last_service_id as string | undefined,
        staffId: (context.last_staff_id as string | undefined) || 'any',
        clientId,
        salonId,
        confidence: 1,
        missingFields: []
      }
      const result = await AIConciergeBookingService.createBooking(restoredIntent)
      if (clientId) await ConversationContextStore.clearContext(clientId)
      return result.success ? ok(res, { intent: 'BOOKING_CONFIRMED', ...result }) : fail(res, 400, 'BOOKING_FAILED', result.error || 'Booking failed')
    }

    if (intent.intent === 'CANCEL_BOOKING') {
      if (clientId) await ConversationContextStore.clearContext(clientId)
      return ok(res, { intent: 'BOOKING_CANCELLED', message: 'No problem! Your booking has been cancelled.' })
    }

    if (clientId && (intent.intent === 'NEEDS_MORE_INFO' || intent.intent === 'BOOK_SERVICE')) {
      await AIConciergeBookingService.saveContext(clientId, intent, intent.missingFields.length > 0 ? 'gathering_info' : 'awaiting_confirmation')
    }

    return ok(res, {
      intent: intent.intent,
      confidence: intent.confidence,
      missingFields: intent.missingFields,
      bookingIntent: intent,
      message: intent.message || null
    })
  } catch (err) {
    console.error('AI Concierge chat error:', err)
    return fail(res, 500, 'INTERNAL_ERROR', err instanceof Error ? err.message : 'Unexpected error')
  }
})

router.post('/book', async (req: Request<unknown, unknown, DirectBookBody>, res: Response) => {
  try {
    const { salonId, clientId, serviceId, staffId, dateTime, serviceName, staffName } = req.body
    if (!salonId || !clientId || !serviceId || !dateTime) {
      return fail(res, 400, 'INVALID_REQUEST', 'salonId, clientId, serviceId, and dateTime are required')
    }

    const intent: BookingIntent = {
      intent: 'BOOK_SERVICE',
      serviceId,
      serviceName,
      staffId: staffId || 'any',
      staffName,
      salonId,
      clientId,
      confidence: 1,
      missingFields: []
    }

    const result = await AIConciergeBookingService.createBooking(intent, { staff_id: staffId, time: dateTime })
    return result.success ? res.status(201).json({ success: true, data: result }) : fail(res, 400, 'BOOKING_FAILED', result.error || 'Booking failed')
  } catch (err) {
    console.error('AI Concierge booking error:', err)
    return fail(res, 500, 'INTERNAL_ERROR', err instanceof Error ? err.message : 'Unexpected error')
  }
})

router.post('/interpret', async (req: Request<unknown, unknown, ConciergeChatBody>, res: Response) => {
  try {
    const { message, salonId, clientId } = req.body
    if (!message || !salonId) return fail(res, 400, 'INVALID_REQUEST', 'message and salonId are required')
    const intent = await AIConciergeBookingService.interpretRequest(message, salonId, clientId)
    return ok(res, intent)
  } catch (err) {
    console.error('AI Concierge interpret error:', err)
    return fail(res, 500, 'INTERNAL_ERROR', err instanceof Error ? err.message : 'Unexpected error')
  }
})

export default router
