import assert from 'assert'
import { AIConciergeBookingService } from './src/services/AIConciergeBookingService'
import { ServiceRepository } from './src/repositories/ServiceRepository'
import { StaffRepository } from './src/repositories/StaffRepository'
import { SlotGenerator } from './src/services/SlotGenerator'
import { AppointmentRepository } from './src/repositories/AppointmentRepository'

async function run() {
  const salonId = 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4'
  const clientId = 'client-123'
  const serviceId = 'service-abc'
  const staffId = 'staff-xyz'
  const slotTime = '2026-03-18T14:00:00.000Z'

  const originalFindAllServices = ServiceRepository.findAll
  const originalFindAllStaff = StaffRepository.findAll
  const originalFindServiceById = ServiceRepository.findById
  const originalFindStaffById = StaffRepository.findById
  const originalGetSlots = SlotGenerator.getAvailableSlots
  const originalCreateAppointment = AppointmentRepository.create

  ServiceRepository.findAll = async () => ([
    { id: serviceId, salon_id: salonId, name: "Women's Haircut", duration_minutes: 60, price: 95 }
  ]) as never
  StaffRepository.findAll = async () => ([
    { id: staffId, salon_id: salonId, full_name: 'Mia Johnson', is_active: true }
  ]) as never
  ServiceRepository.findById = async () => ({ id: serviceId, salon_id: salonId, name: "Women's Haircut", duration_minutes: 60, price: 95 }) as never
  StaffRepository.findById = async () => ({ id: staffId, salon_id: salonId, full_name: 'Mia Johnson' }) as never
  SlotGenerator.getAvailableSlots = async () => ([
    { staff_id: staffId, staff_name: 'Mia Johnson', time: slotTime }
  ]) as never
  AppointmentRepository.create = async () => ({ id: 'appt-789', qr_token: 'qr-456' }) as never

  try {
    const intent = await AIConciergeBookingService.interpretRequest("I'd like a women's haircut with Mia next Wednesday at 2pm", salonId, clientId)
    assert.equal(intent.intent, 'BOOK_SERVICE')
    assert.equal(intent.serviceId, serviceId)
    assert.equal(intent.staffId, staffId)
    assert.equal(intent.bookingPayload?.service_id, serviceId)
    assert.equal(intent.bookingPayload?.staff_id, staffId)
    assert.equal(intent.suggestedSlots?.[0].time, slotTime)

    const result = await AIConciergeBookingService.createBooking(intent)
    assert.equal(result.success, true)
    assert.equal(result.appointmentId, 'appt-789')
    assert.equal(result.confirmation?.staffName, 'Mia Johnson')

    console.log('PASS ai concierge e2e', JSON.stringify({ intent, result }, null, 2))
  } finally {
    ServiceRepository.findAll = originalFindAllServices
    StaffRepository.findAll = originalFindAllStaff
    ServiceRepository.findById = originalFindServiceById
    StaffRepository.findById = originalFindStaffById
    SlotGenerator.getAvailableSlots = originalGetSlots
    AppointmentRepository.create = originalCreateAppointment
  }
}

run().catch((error) => {
  console.error('FAIL ai concierge e2e', error)
  process.exit(1)
})
