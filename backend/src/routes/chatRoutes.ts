import { Request, Response, Router } from 'express'
import { handleIncomingMessage } from '../agents/receptionist'
import { AIConciergeBookingService } from '../services/AIConciergeBookingService'

type ChatRequestBody = {
  message?: string
  sender?: string
  sessionId?: string
  salonId?: string
  clientId?: string
}

const router = Router()

const isLikelyBookingMessage = (message: string): boolean => /(book|appointment|haircut|cut|balayage|color|colour|blow dry|manicure|pedicure|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|am|pm)/i.test(message)

const handleChatRequest = async (req: Request<unknown, unknown, ChatRequestBody>, res: Response) => {
  try {
    const { message, sender, sessionId, salonId, clientId } = req.body
    const senderId = sender || sessionId

    if (!message || !senderId) {
      return res.status(400).json({ success: false, error: 'Message and sender/sessionId are required' })
    }

    if (salonId && isLikelyBookingMessage(message)) {
      const intent = await AIConciergeBookingService.interpretRequest(message, salonId, clientId)
      return res.json({
        success: true,
        message: intent.message || 'Intent parsed',
        data: {
          intent: intent.intent,
          bookingIntent: intent
        },
        ui: { type: 'booking_intent' }
      })
    }

    const text = await handleIncomingMessage(senderId, message)
    return res.json({ success: true, message: text, ui: { type: 'text' } })
  } catch (error) {
    console.error('Chat API Error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

router.post('/', handleChatRequest)
router.post('/message', handleChatRequest)

export default router
