import React, { useEffect, useRef, useState } from 'react'
import { Send, User, Bot, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { sendChatMessage, getSlots } from '../../services/api'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
}

const ClientChat: React.FC = () => {
  const navigate = useNavigate()

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I am the Jawed Habib digital receptionist. How can I help you today?',
      sender: 'bot'
    }
  ])

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [slotSuggestions, setSlotSuggestions] = useState<string[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const salonId = 'jawed_habib_kurnool'
  const senderPhone = '+1234567890'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const detectBookingIntent = (text: string) => {
    const t = text.toLowerCase()
    return (
      t.includes('book') ||
      t.includes('appointment') ||
      t.includes('haircut') ||
      t.includes('slot') ||
      t.includes('time')
    )
  }

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user'
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    const text = userMsg.text

    try {
      if (detectBookingIntent(text)) {
        const today = new Date().toISOString().split('T')[0]

        const slotResponse: any = await getSlots(salonId, 'default', today)

        const rawSlots = slotResponse?.data || []

        const slots = rawSlots
          .slice(0, 3)
          .map((s: any) => (typeof s === 'string' ? s : s.time || 'slot'))

        if (slots.length > 0) {
          setSlotSuggestions(slots)

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString() + 'bot',
              text: 'Here are some available slots today. Tap one to continue booking.',
              sender: 'bot'
            }
          ])

          setIsLoading(false)
          return
        }
      }

      const response = await sendChatMessage(senderPhone, text)

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message || 'Sorry, I encountered an error.',
        sender: 'bot'
      }

      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      console.error('Chat error', err)

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + 'err',
          text: 'Network error. Please try again.',
          sender: 'bot'
        }
      ])
    }

    setIsLoading(false)
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-xl overflow-hidden">
      <div className="bg-white px-4 py-3 border-b flex items-center shadow-sm">
        <div className="bg-gradient-to-tr from-pink-500 to-orange-400 p-2 rounded-full mr-3">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-800 text-lg">Jawed Habib Kurnool</h1>
          <p className="text-xs text-green-500">Online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-gray-200 mx-2">
                {msg.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div className={`px-4 py-2 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white border shadow-sm'}`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}

        {slotSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {slotSuggestions.map((slot) => (
              <button
                key={slot}
                onClick={() => navigate(`/services?slot=${slot}`)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
              >
                {slot}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center bg-gray-100 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-transparent outline-none"
        />

        <button
          type="submit"
          className="ml-2 text-blue-600"
          disabled={!input.trim() || isLoading}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  )
}

export default ClientChat
