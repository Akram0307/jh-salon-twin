import appointmentStatusRepo from '../repositories/AppointmentStatusRepository'
import { StatusChangeInput } from '../repositories/AppointmentStatusRepository'

class AppointmentStatusService {

  // Valid status transitions
  private readonly validTransitions: Record<string, string[]> = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['arrived', 'cancelled', 'no_show'],
    'arrived': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': [],
    'no_show': []
  }

  async getAppointmentStatus(appointmentId: string, salonId: string) {
    return appointmentStatusRepo.getAppointmentStatus(appointmentId, salonId)
  }

  async updateStatus(
    appointmentId: string, 
    salonId: string, 
    newStatus: string,
    changedByStaffId?: string,
    changeReason?: string
  ) {
    // Validate status transition
    const currentStatus = await appointmentStatusRepo.getAppointmentStatus(appointmentId, salonId)
    if (!currentStatus) {
      throw new Error('Appointment not found')
    }

    if (!this.isValidTransition(currentStatus, newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`)
    }

    const success = await appointmentStatusRepo.updateAppointmentStatus(
      appointmentId, 
      salonId, 
      newStatus, 
      changedByStaffId, 
      changeReason
    )

    if (!success) {
      throw new Error('Failed to update appointment status')
    }

    return { 
      success: true, 
      previousStatus: currentStatus, 
      newStatus 
    }
  }

  async bulkUpdateStatus(
    appointmentIds: string[], 
    salonId: string, 
    newStatus: string,
    changedByStaffId?: string,
    changeReason?: string
  ) {
    // Validate that all appointments exist and can transition
    const validationResults = await Promise.all(
      appointmentIds.map(async (id) => {
        const currentStatus = await appointmentStatusRepo.getAppointmentStatus(id, salonId)
        if (!currentStatus) {
          return { id, valid: false, error: 'Appointment not found' }
        }
        if (!this.isValidTransition(currentStatus, newStatus)) {
          return { id, valid: false, error: `Invalid transition from ${currentStatus} to ${newStatus}` }
        }
        return { id, valid: true, currentStatus }
      })
    )

    const validAppointments = validationResults.filter(r => r.valid).map(r => r.id)
    const invalidAppointments = validationResults.filter(r => !r.valid)

    if (validAppointments.length === 0) {
      throw new Error('No valid appointments to update')
    }

    const result = await appointmentStatusRepo.bulkUpdateStatus(
      validAppointments, 
      salonId, 
      newStatus, 
      changedByStaffId, 
      changeReason
    )

    return {
      updated: result.updated,
      failed: [...result.failed, ...invalidAppointments.map(i => i.id)],
      invalidAppointments
    }
  }

  async getStatusHistory(appointmentId: string, salonId: string) {
    return appointmentStatusRepo.getStatusHistory(appointmentId, salonId)
  }

  async getStatusHistoryBySalon(
    salonId: string, 
    options: { 
      startDate?: Date, 
      endDate?: Date, 
      limit?: number 
    } = {}
  ) {
    return appointmentStatusRepo.getStatusHistoryBySalon(salonId, options)
  }

  private isValidTransition(currentStatus: string, newStatus: string): boolean {
    const allowedTransitions = this.validTransitions[currentStatus.toLowerCase()]
    if (!allowedTransitions) {
      return false
    }
    return allowedTransitions.includes(newStatus.toLowerCase())
  }

  async getAppointmentStatusCounts(salonId: string) {
    // This would require a more complex query, but for now we can implement it later
    // or use the existing repository methods to get counts by status
    return {
      pending: 0,
      confirmed: 0,
      arrived: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0
    }
  }

  async getRecentStatusChanges(salonId: string, limit: number = 10) {
    return appointmentStatusRepo.getStatusHistoryBySalon(salonId, { limit })
  }
}

export default new AppointmentStatusService()
