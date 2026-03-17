
import logger from '../config/logger';
import { sendConfirmationSMS } from './NotificationOrchestrator'
import { AppointmentRepository } from '../repositories/AppointmentRepository'
import { ServiceRepository } from '../repositories/ServiceRepository'
import { StaffRepository } from '../repositories/StaffRepository'

export type BookingCommand = {
  salonId: string
  clientId: string
  serviceId: string
  staffId?: string | 'any'
  slotTime: string
}

export type BookingOrchestratorResult = {
  success: boolean
  appointmentId?: string
  error?: string
  confirmation?: {
    serviceName: string
    staffName: string
    dateTime: string
    qrToken?: string
  }
}

export class BookingOrchestrator {
  static async createAppointment(command: BookingCommand): Promise<BookingOrchestratorResult> {
    const service = await ServiceRepository.findById(command.serviceId, command.salonId)
    if (!service) {
      return { success: false, error: 'Service not found' }
    }

    const normalizedStaffId = command.staffId && command.staffId !== 'any' ? command.staffId : undefined
    const appointment = await AppointmentRepository.create({
      salon_id: command.salonId,
      client_id: command.clientId,
      staff_id: normalizedStaffId,
      appointment_time: command.slotTime,
      status: 'SCHEDULED',
      services: [
        {
          service_id: command.serviceId,
          base_price: service.price,
          charged_price: service.price
        }
      ]
    })

    const staff = normalizedStaffId
      ? await StaffRepository.findById(normalizedStaffId, command.salonId)
      : null

    const confirmation = {
      serviceName: service.name,
      staffName: staff?.full_name || 'Any available stylist',
      dateTime: command.slotTime,
      qrToken: appointment.qr_token
    }

    try {
      await sendConfirmationSMS({
        appointmentId: appointment.id,
        salonId: command.salonId,
        clientId: command.clientId,
        serviceName: confirmation.serviceName,
        staffName: confirmation.staffName,
        dateTime: confirmation.dateTime
      })
    } catch (error) {
      logger.error({ appointmentId: appointment.id, error }, '[BookingOrchestrator] confirmation SMS failed')
    }

    return {
      success: true,
      appointmentId: appointment.id,
      confirmation
    }
  }
}
