import { Router } from 'express'
import { handleIncomingMessage } from '../agents/receptionist'

const router = Router()

const handleChatRequest = async (req: any, res: any) => {
  try {
    const { message, sender, sessionId } = req.body
    const senderId = sender || sessionId

    if (!message || !senderId) {
      return res.status(400).json({
        success: false,
        error: 'Message and sender/sessionId are required'
      })
    }

    const text = await handleIncomingMessage(senderId, message)

    return res.json({
      success: true,
      message: text,
      ui: {
        type: 'text'
      }
    })
  } catch (error) {
    console.error('Chat API Error:', error)

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

router.post('/', handleChatRequest)
router.post('/message', handleChatRequest)

export default router
