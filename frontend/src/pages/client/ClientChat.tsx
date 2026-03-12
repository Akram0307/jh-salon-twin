import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getSlots } from '../../services/api'
import { getTodayDate } from './bookingConfig'

interface SlotChip {
  label: string
  value: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function ClientChat() {
  const { salonId } = useParams<{ salonId: string }>()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [selectedService, setSelectedService] = useState<{ id: string; name: string } | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (userInput: string) => {
    setMessages(prev => [...prev, { role: 'user', content: userInput }])
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I can help you book an appointment. What service are you looking for?' }])
      setIsTyping(false)
    }, 1000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    const userInput = input
    setInput('')
    await sendMessage(userInput)
  }

  const handleServiceSelect = async (serviceId: string) => {
    if (!salonId) return
    
    setSelectedService({ id: serviceId, name: 'Service' })
    
    try {
      const res = await getSlots(salonId, serviceId, getTodayDate())
      const rawSlots = (res as { slots?: unknown[] })?.slots || ((res as { data?: { slots?: unknown[] } })?.data?.slots) || []

      const slots: SlotChip[] = rawSlots.slice(0, 6).map((slot: unknown, index: number) => {
        if (typeof slot === 'string') {
          return { label: slot, value: slot }
        }

        const slotObj = slot as { start?: string; time?: string; staff_name?: string }
        const value = slotObj?.start || slotObj?.time || `slot-${index}`
        const time = slotObj?.start ? new Date(slotObj.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : slotObj?.time
        const stylist = slotObj?.staff_name || 'Any stylist'

        return { 
          label: time ? `${time} with ${stylist}` : value, 
          value 
        }
      })

      if (slots.length > 0) {
        setSelectedSlot(slots[0].value)
        await sendMessage(`I want to book ${slots[0].value}`)
      }
    } catch (error) {
      console.error('Failed to load slots:', error)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-zinc-400 py-8">
            <p className="text-lg mb-2">👋 Hi! I'm your AI stylist</p>
            <p className="text-sm">Tell me what you're looking for today</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
              msg.role === 'user' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-zinc-800 text-zinc-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="text-zinc-400 text-sm">Typing...</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-4 py-2 font-medium"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
