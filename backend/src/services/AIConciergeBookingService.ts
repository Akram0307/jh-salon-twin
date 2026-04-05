import { ServiceRepository } from '../repositories/ServiceRepository'
import { StaffRepository } from '../repositories/StaffRepository'
import { SlotGenerator } from './SlotGenerator'
import { ConversationContextStore } from './ConversationContextStore'
import { BookingOrchestrator, BookingOrchestratorResult } from './BookingOrchestrator'

type ServiceRecord = {
  id: string
  salon_id: string
  name: string
  duration_minutes: number
  price: number
}

type StaffRecord = {
  id: string
  salon_id: string
  full_name: string
  role?: string
  is_active?: boolean
}

export type SuggestedSlot = {
  staff_id: string
  staff_name: string
  time: string
}

export type BookingIntent = {
  intent: 'BOOK_SERVICE' | 'CONFIRM_BOOKING' | 'CANCEL_BOOKING' | 'UNKNOWN' | 'NEEDS_MORE_INFO'
  serviceId?: string
  serviceName?: string
  serviceMatchType?: 'exact' | 'alias' | 'keyword' | 'fuzzy'
  staffId?: string | 'any'
  staffName?: string
  staffMatchType?: 'exact' | 'with_pattern' | 'mention' | 'any'
  preferredDate?: string
  preferredTime?: string
  duration?: number
  clientId?: string
  salonId?: string
  confidence: number
  missingFields: string[]
  suggestedSlots?: SuggestedSlot[]
  bookingPayload?: {
    salon_id: string
    client_id?: string
    service_id: string
    staff_id?: string
    requested_date?: string
    requested_time?: string
    appointment_time?: string
  }
  message?: string
}

export type BookingResult = BookingOrchestratorResult

type ServiceMatch = { record: ServiceRecord; matchType: BookingIntent['serviceMatchType']; score: number }
type StaffMatch = { record: StaffRecord | { id: 'any'; full_name: 'Any available stylist' }; matchType: BookingIntent['staffMatchType']; score: number }

const SERVICE_ALIASES: Record<string, string[]> = {
  haircut: ['hair cut', 'cut', 'trim', 'womens haircut', "women haircut", "women's haircut", 'mens haircut', "men's haircut"],
  'women s haircut': ['hair cut', 'cut', 'trim', 'womens haircut', "women haircut", "women's haircut", 'haircut'],
  'mens haircut': ['mens haircut', "men's haircut", 'men haircut', 'haircut', 'hair cut', 'cut', 'trim'],
  balayage: ['balayage', 'highlights', 'hair color', 'hair colour', 'colour', 'color'],
  'blow dry': ['blow dry', 'blowdry', 'blow out', 'blowout', 'styling'],
  manicure: ['manicure', 'nails', 'nail polish'],
  pedicure: ['pedicure', 'feet', 'foot spa']
}

export class AIConciergeBookingService {
  static async interpretRequest(text: string, salonId: string, clientId?: string): Promise<BookingIntent> {
    const normalizedText = text.toLowerCase().trim()

    if (/^\s*(yes|yeah|yep|confirm|book it|sounds good)\s*$/i.test(normalizedText)) {
      return { intent: 'CONFIRM_BOOKING', confidence: 0.95, missingFields: [] }
    }

    if (/^\s*(no|nope|cancel|nevermind|stop)\s*$/i.test(normalizedText)) {
      return { intent: 'CANCEL_BOOKING', confidence: 0.95, missingFields: [] }
    }

    const extractedService = await this.extractService(normalizedText, salonId)
    const extractedStylist = await this.extractStylist(normalizedText, salonId)
    const extractedDateTime = this.extractDateTime(normalizedText)

    const staffId = extractedStylist?.record.id === 'any' ? 'any' : extractedStylist?.record.id
    const staffName = extractedStylist?.record.id === 'any' ? 'Any available stylist' : (extractedStylist?.record as StaffRecord | undefined)?.full_name

    const intent: BookingIntent = {
      intent: 'BOOK_SERVICE',
      serviceId: extractedService?.record.id,
      serviceName: extractedService?.record.name,
      serviceMatchType: extractedService?.matchType,
      staffId: staffId || 'any',
      staffName,
      staffMatchType: extractedStylist?.matchType,
      preferredDate: extractedDateTime?.date,
      preferredTime: extractedDateTime?.time,
      duration: extractedService?.record.duration_minutes,
      clientId,
      salonId,
      confidence: this.calculateConfidence(extractedService, extractedStylist, extractedDateTime),
      missingFields: []
    }

    if (!intent.serviceId) intent.missingFields.push('service')
    if (!intent.preferredDate) intent.missingFields.push('date')
    if (!intent.preferredTime) intent.missingFields.push('time')

    if (intent.serviceId && intent.preferredDate) {
      intent.suggestedSlots = await this.findAvailableSlots(
        salonId,
        intent.serviceId,
        intent.preferredDate,
        intent.staffId !== 'any' ? intent.staffId : undefined
      )
      intent.bookingPayload = this.buildBookingPayload(intent)
    }

    if (intent.missingFields.length > 0) {
      intent.intent = 'NEEDS_MORE_INFO'
      intent.message = this.generateClarificationMessage(intent)
    } else if (intent.serviceId && intent.preferredDate && intent.preferredTime && (!intent.suggestedSlots || intent.suggestedSlots.length === 0)) {
      intent.intent = 'NEEDS_MORE_INFO'
      intent.message = `I found ${intent.serviceName}, but there are no available slots on ${intent.preferredDate}${intent.staffId && intent.staffId !== 'any' ? ` with ${intent.staffName}` : ''}. Would you like to try another time?`
    }

    return intent
  }

  private static async extractService(text: string, salonId: string): Promise<ServiceMatch | null> {
    const services = (await ServiceRepository.findAll(salonId)) as ServiceRecord[]
    if (!services.length) return null

    const normalizedText = ServiceRepository.normalizeServiceName(text)

    for (const service of services) {
      const normalizedServiceName = ServiceRepository.normalizeServiceName(service.name)
      if (normalizedText.includes(normalizedServiceName)) {
        return { record: service, matchType: 'exact', score: 1 }
      }
    }

    const aliasCandidates: ServiceMatch[] = []

    for (const service of services) {
      const normalizedServiceName = ServiceRepository.normalizeServiceName(service.name)
      const canonicalTerms = new Set<string>([normalizedServiceName])

      for (const [canonicalName, aliases] of Object.entries(SERVICE_ALIASES)) {
        const normalizedCanonical = ServiceRepository.normalizeServiceName(canonicalName)
        const normalizedAliases = aliases.map((alias) => ServiceRepository.normalizeServiceName(alias))
        if (normalizedCanonical === normalizedServiceName || normalizedAliases.includes(normalizedServiceName)) {
          canonicalTerms.add(normalizedCanonical)
          normalizedAliases.forEach((alias) => canonicalTerms.add(alias))
        }
      }

      const aliasTerms = Array.from(canonicalTerms)
      const matchedAlias = aliasTerms.find((alias) => normalizedText.includes(alias))
      if (!matchedAlias) continue

      let score = matchedAlias === normalizedServiceName ? 0.9 : 0.88
      if (normalizedServiceName.includes('women')) score += 0.03
      if (normalizedServiceName.includes('men')) score -= 0.02
      if (matchedAlias.replace(/\s+/g, '') === 'haircut' && normalizedServiceName.includes('women')) score += 0.04

      aliasCandidates.push({
        record: service,
        matchType: matchedAlias === normalizedServiceName ? 'keyword' : 'alias',
        score
      })
    }

    aliasCandidates.sort((a, b) => b.score - a.score)

    if (aliasCandidates.length > 0) {
      return aliasCandidates[0]
    }

    const scored = services
      .map((service) => {
        const serviceWords = ServiceRepository.normalizeServiceName(service.name).split(/\s+/).filter((word) => word.length > 2)
        const hits = serviceWords.filter((word) => normalizedText.includes(word)).length
        return { service, score: serviceWords.length ? hits / serviceWords.length : 0 }
      })
      .filter((entry) => entry.score >= 0.5)
      .sort((a, b) => b.score - a.score)

    if (scored.length > 0) {
      return { record: scored[0].service, matchType: 'fuzzy', score: scored[0].score }
    }

    return null
  }

  private static async extractStylist(text: string, salonId: string): Promise<StaffMatch | null> {
    if (/\b(any|anyone|whoever|no preference|doesn.t matter|you choose)\b/i.test(text)) {
      return {
        record: { id: 'any', full_name: 'Any available stylist' },
        matchType: 'any',
        score: 0.9
      }
    }

    const staff = (await StaffRepository.findAll(salonId, { is_active: true })) as StaffRecord[]
    if (!staff.length) return null

    const withPattern = /\bwith\s+([a-z]+(?:\s+[a-z]+)?)\b/i
    const withMatch = text.match(withPattern)
    if (withMatch?.[1]) {
      const stylistName = withMatch[1].trim().toLowerCase()
      const exact = staff.find((member) => member.full_name.toLowerCase() === stylistName)
      if (exact) return { record: exact, matchType: 'with_pattern', score: 1 }
      const partial = staff.find((member) => member.full_name.toLowerCase().includes(stylistName))
      if (partial) return { record: partial, matchType: 'with_pattern', score: 0.9 }
    }

    const lowerText = text.toLowerCase()
    for (const member of staff) {
      const nameTokens = member.full_name.toLowerCase().split(/\s+/).filter((token) => token.length > 2)
      if (nameTokens.some((token) => lowerText.includes(token))) {
        return { record: member, matchType: 'mention', score: 0.8 }
      }
    }

    return null
  }

  private static extractDateTime(text: string): { date?: string; time?: string } | null {
    const result: { date?: string; time?: string } = {}
    const textLower = text.toLowerCase()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const datePatterns = [
      { pattern: /\btoday\b/, offset: 0 },
      { pattern: /\btomorrow\b/, offset: 1 },
      { pattern: /\bnext week\b/, offset: 7 },
      { pattern: /\bmonday\b/, dayOfWeek: 1 },
      { pattern: /\btuesday\b/, dayOfWeek: 2 },
      { pattern: /\bwednesday\b/, dayOfWeek: 3 },
      { pattern: /\bthursday\b/, dayOfWeek: 4 },
      { pattern: /\bfriday\b/, dayOfWeek: 5 },
      { pattern: /\bsaturday\b/, dayOfWeek: 6 },
      { pattern: /\bsunday\b/, dayOfWeek: 0 }
    ]

    for (const { pattern, offset, dayOfWeek } of datePatterns) {
      if (!pattern.test(textLower)) continue
      const targetDate = new Date(today)
      if (typeof offset === 'number') {
        targetDate.setDate(today.getDate() + offset)
      } else if (typeof dayOfWeek === 'number') {
        const currentDay = today.getDay()
        let daysUntil = dayOfWeek - currentDay
        if (daysUntil <= 0) daysUntil += 7
        targetDate.setDate(today.getDate() + daysUntil)
      }
      result.date = targetDate.toISOString().split('T')[0]
      break
    }

    const specificDatePattern = /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
    const specificDateMatch = textLower.match(specificDatePattern)
    if (specificDateMatch) {
      const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december']
      const month = monthNames.indexOf(specificDateMatch[1])
      const day = Number.parseInt(specificDateMatch[2], 10)
      if (month >= 0 && day > 0 && day <= 31) {
        const targetDate = new Date(now.getFullYear(), month, day)
        if (targetDate < today) targetDate.setFullYear(now.getFullYear() + 1)
        result.date = targetDate.toISOString().split('T')[0]
      }
    }

    const hhmm = textLower.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i)
    const hourAmPm = textLower.match(/\b(\d{1,2})\s*(am|pm)\b/i)
    const daytime = textLower.match(/\b(morning|afternoon|evening)\b/i)

    if (daytime?.[1]) {
      result.time = daytime[1].toLowerCase() === 'morning' ? '10:00' : daytime[1].toLowerCase() === 'afternoon' ? '14:00' : '17:00'
    } else if (hhmm) {
      let hour = Number.parseInt(hhmm[1], 10)
      const minute = hhmm[2]
      const ampm = hhmm[3]?.toLowerCase()
      if (ampm === 'pm' && hour < 12) hour += 12
      if (ampm === 'am' && hour === 12) hour = 0
      result.time = `${String(hour).padStart(2, '0')}:${minute}`
    } else if (hourAmPm) {
      let hour = Number.parseInt(hourAmPm[1], 10)
      const ampm = hourAmPm[2]?.toLowerCase()
      if (ampm === 'pm' && hour < 12) hour += 12
      if (ampm === 'am' && hour === 12) hour = 0
      result.time = `${String(hour).padStart(2, '0')}:00`
    }

    return Object.keys(result).length ? result : null
  }

  private static async findAvailableSlots(salonId: string, serviceId: string, date: string, staffId?: string): Promise<SuggestedSlot[]> {
    const slots = (await SlotGenerator.getAvailableSlots(salonId, serviceId, date)) as SuggestedSlot[]
    const filtered = staffId ? slots.filter((slot) => slot.staff_id === staffId) : slots
    return filtered.slice(0, 5)
  }

  private static calculateConfidence(service: ServiceMatch | null, stylist: StaffMatch | null, dateTime: { date?: string; time?: string } | null): number {
    let score = 0
    if (service) score += 0.45
    if (stylist) score += 0.2
    if (dateTime?.date) score += 0.2
    if (dateTime?.time) score += 0.15
    return Math.min(Number(score.toFixed(2)), 1)
  }

  private static generateClarificationMessage(intent: BookingIntent): string {
    if (intent.missingFields.includes('service')) return "I'd be happy to help you book. What service are you looking for?"
    if (intent.missingFields.includes('date')) return `Great, I found ${intent.serviceName}. What day would you like?`
    if (intent.missingFields.includes('time')) return `Perfect, I found ${intent.serviceName} on ${intent.preferredDate}. What time works best?`
    return 'I am ready to book your appointment. Please confirm the details.'
  }

  private static buildBookingPayload(intent: BookingIntent): BookingIntent['bookingPayload'] | undefined {
    if (!intent.salonId || !intent.serviceId) return undefined
    const topSlot = intent.suggestedSlots?.[0]
    return {
      salon_id: intent.salonId,
      client_id: intent.clientId,
      service_id: intent.serviceId,
      staff_id: topSlot?.staff_id || (intent.staffId && intent.staffId !== 'any' ? intent.staffId : undefined),
      requested_date: intent.preferredDate,
      requested_time: intent.preferredTime,
      appointment_time: topSlot?.time
    }
  }

  static async createBooking(intent: BookingIntent, selectedSlot?: { staff_id?: string; time: string }): Promise<BookingResult> {
    if (!intent.serviceId || !intent.salonId) return { success: false, error: 'Missing required booking information' }
    if (!intent.clientId) return { success: false, error: 'Client ID is required to create booking' }

    const slotToBook = selectedSlot || (intent.suggestedSlots?.[0] ? { staff_id: intent.suggestedSlots[0].staff_id, time: intent.suggestedSlots[0].time } : undefined)
    if (!slotToBook) return { success: false, error: 'No available slots found' }

    return BookingOrchestrator.createAppointment({
      salonId: intent.salonId,
      clientId: intent.clientId,
      serviceId: intent.serviceId,
      staffId: slotToBook.staff_id || intent.staffId,
      slotTime: slotToBook.time
    })
  }

  static async saveContext(clientId: string, intent: BookingIntent, state: 'gathering_info' | 'awaiting_confirmation' | 'completed' | 'cancelled'): Promise<void> {
    await ConversationContextStore.updateContext(clientId, {
      salon_id: intent.salonId,
      last_intent: intent.intent,
      pending_action: state === 'awaiting_confirmation' ? 'confirm_booking' : null,
      last_service_id: intent.serviceId,
      last_staff_id: intent.staffId !== 'any' ? intent.staffId : null,
      conversation_state: state
    })
  }

  static async getContext(clientId: string): Promise<unknown> {
    return ConversationContextStore.getContext(clientId)
  }

  static async findAvailableSlot(serviceId: string, salonId: string): Promise<{ appointment_date: string } | null> {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    const slots = await SlotGenerator.getAvailableSlots(salonId, serviceId, dateStr)
    return slots.length > 0 ? { appointment_date: slots[0].time } : null
  }
}
