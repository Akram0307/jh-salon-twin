import { ServiceRepository } from '../repositories/ServiceRepository'
import { StaffRepository } from '../repositories/StaffRepository'
import { AppointmentRepository } from '../repositories/AppointmentRepository'
import { PWAConversationContext, BookingIntent } from './ConversationContextStore'

export interface ServiceCardData {
  id: string
  name: string
  description?: string
  duration: number
  price: number
  imageUrl?: string
  category?: string
  isSelected?: boolean
}

export interface SlotData {
  time: string
  available: boolean
  staffId?: string
  staffName?: string
  price?: number
}

export interface SlotSelectorData {
  date: string
  slots: SlotData[]
  selectedSlot?: string
  serviceId?: string
  staffId?: string
}

export interface BookingSummaryData {
  serviceName: string
  servicePrice: number
  serviceDuration: number
  staffName?: string
  dateTime: string
  totalPrice: number
  confirmationCode?: string
  notes?: string
}

export interface RichMediaResponse {
  type: 'service_cards' | 'slot_selector' | 'booking_summary' | 'text' | 'options'
  data: ServiceCardData[] | SlotSelectorData | BookingSummaryData | { text: string } | { options: string[] }
  metadata?: Record<string, any>
}

export class RichMediaFormatter {
  static async formatServiceCards(salonId: string, serviceIds?: string[]): Promise<ServiceCardData[]> {
    const services = serviceIds 
      ? await Promise.all(serviceIds.map(id => ServiceRepository.findById(id, salonId)))
      : await ServiceRepository.findAll(salonId)
    
    return services
      .filter((service): service is NonNullable<typeof service> => service !== null && service !== undefined)
      .map(service => ({
        id: service.id,
        name: service.name,
        description: service.description || undefined,
        duration: service.duration_minutes,
        price: service.price,
        imageUrl: service.image_url || undefined,
        category: service.category || undefined
      }))
  }

  static async formatSlotSelector(
    salonId: string,
    serviceId: string,
    date: string,
    staffId?: string
  ): Promise<SlotSelectorData> {
    // This would integrate with SlotGenerator in a real implementation
    // For now, return mock data structure
    const slots: SlotData[] = [
      { time: '09:00', available: true, staffId, staffName: 'Any available stylist' },
      { time: '10:00', available: true, staffId, staffName: 'Any available stylist' },
      { time: '11:00', available: false, staffId, staffName: 'Any available stylist' },
      { time: '14:00', available: true, staffId, staffName: 'Any available stylist' },
      { time: '15:00', available: true, staffId, staffName: 'Any available stylist' }
    ]

    return {
      date,
      slots,
      serviceId,
      staffId
    }
  }

  static async formatBookingSummary(
    salonId: string,
    bookingIntent: BookingIntent,
    appointmentId?: string
  ): Promise<BookingSummaryData> {
    const service = bookingIntent.serviceId 
      ? await ServiceRepository.findById(bookingIntent.serviceId, salonId)
      : null
    
    const staff = bookingIntent.staffId && bookingIntent.staffId !== 'any'
      ? await StaffRepository.findById(bookingIntent.staffId, salonId)
      : null

    const dateTime = bookingIntent.preferredDate && bookingIntent.preferredTime
      ? `${bookingIntent.preferredDate}T${bookingIntent.preferredTime}`
      : new Date().toISOString()

    return {
      serviceName: bookingIntent.serviceName || service?.name || 'Unknown Service',
      servicePrice: service?.price || bookingIntent.price || 0,
      serviceDuration: service?.duration_minutes || bookingIntent.duration || 0,
      staffName: staff?.full_name || bookingIntent.staffName || 'Any available stylist',
      dateTime,
      totalPrice: service?.price || bookingIntent.price || 0,
      confirmationCode: appointmentId ? `SALON-${appointmentId.substring(0, 8).toUpperCase()}` : undefined,
      notes: 'Please arrive 10 minutes before your appointment.'
    }
  }

  static formatTextResponse(text: string): RichMediaResponse {
    return {
      type: 'text',
      data: { text }
    }
  }

  static formatOptionsResponse(options: string[]): RichMediaResponse {
    return {
      type: 'options',
      data: { options }
    }
  }

  static async formatContextualResponse(
    salonId: string,
    context: PWAConversationContext,
    message: string
  ): Promise<RichMediaResponse> {
    switch (context.currentState) {
      case 'GREETING':
        return this.formatTextResponse(message)
      
      case 'SERVICE_DISCOVERY':
        const serviceCards = await this.formatServiceCards(salonId)
        return {
          type: 'service_cards',
          data: serviceCards,
          metadata: { message }
        }
      
      case 'SERVICE_RECOMMENDATION':
        if (context.bookingIntent?.serviceId) {
          const recommendedCards = await this.formatServiceCards(salonId, [context.bookingIntent.serviceId])
          return {
            type: 'service_cards',
            data: recommendedCards,
            metadata: { message, isRecommendation: true }
          }
        }
        return this.formatTextResponse(message)
      
      case 'STYLIST_PREFERENCE':
        return this.formatOptionsResponse(['Any available stylist', 'Specific stylist'])
      
      case 'TIME_SLOT_SUGGESTION':
        if (context.bookingIntent?.serviceId && context.bookingIntent?.preferredDate) {
          const slotSelector = await this.formatSlotSelector(
            salonId,
            context.bookingIntent.serviceId,
            context.bookingIntent.preferredDate,
            context.bookingIntent.staffId !== 'any' ? context.bookingIntent.staffId : undefined
          )
          return {
            type: 'slot_selector',
            data: slotSelector,
            metadata: { message }
          }
        }
        return this.formatTextResponse(message)
      
      case 'BOOKING_CONFIRMATION':
        if (context.bookingIntent) {
          const bookingSummary = await this.formatBookingSummary(salonId, context.bookingIntent)
          return {
            type: 'booking_summary',
            data: bookingSummary,
            metadata: { message }
          }
        }
        return this.formatTextResponse(message)
      
      case 'POST_BOOKING':
        return this.formatTextResponse(message)
      
      default:
        return this.formatTextResponse(message)
    }
  }
}
