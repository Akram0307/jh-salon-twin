import { Router } from 'express';
import { z } from 'zod';
import { ServiceRepository } from '../repositories/ServiceRepository';
import { SlotGenerator } from '../services/SlotGenerator';
import { BookingOrchestrator } from '../services/BookingOrchestrator';
import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { validateUUID } from '../middleware/validateUUID';
import { query } from '../config/db';

const router = Router();
const SALON_ID = process.env.SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';

// Apply UUID validation middleware
router.use(validateUUID);

// Helper function for consistent response format
const ok = (data: unknown, meta: Record<string, unknown> = {}) => ({
  success: true,
  data,
  meta: {
    salon_id: SALON_ID,
    ...meta,
  },
});

const fail = (message: string, details?: unknown, error?: string) => ({
  success: false,
  data: null,
  error: error || message,
  message,
  ...(details !== undefined ? { details } : {}),
});

// 1. GET /api/client/services - List all services with categories, prices, durations
router.get('/services', async (req, res) => {
  try {
    const services = await ServiceRepository.findAll(SALON_ID);
    // Group by category
    const grouped = services.reduce((acc, service) => {
      const category = service.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        id: service.id,
        name: service.name,
        description: service.description,
        duration_minutes: service.duration_minutes,
        price: service.price,
        category: category,
      });
      return acc;
    }, {} as Record<string, any[]>);
    
    res.json(ok(grouped, { count: services.length }));
  } catch (err) {
    console.error(err);
    res.status(500).json(fail('Failed to fetch services'));
  }
});

// 2. GET /api/client/availability - Get available time slots
router.get('/availability', async (req, res) => {
  try {
    const { serviceId, stylistId, date } = req.query as {
      serviceId: string;
      stylistId?: string;
      date: string;
    };
    
    if (!serviceId || !date) {
      return res.status(400).json(fail('serviceId and date are required'));
    }
    
    // Use existing SlotGenerator service - note: it only takes 3 arguments
    const slots = await SlotGenerator.getAvailableSlots(
      SALON_ID,
      serviceId,
      date
    );
    
    // If stylistId is provided, filter the slots by that stylist
    let filteredSlots = slots;
    if (stylistId) {
      filteredSlots = slots.filter(slot => slot.staff_id === stylistId);
    }
    
    res.json(ok({
      date,
      service_id: serviceId,
      stylist_id: stylistId || null,
      slots: filteredSlots,
      count: filteredSlots.length,
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json(fail('Failed to fetch availability'));
  }
});

// Validation schema for booking
const bookingSchema = z.object({
  serviceId: z.string().uuid(),
  stylistId: z.string().uuid().optional(),
  slotTime: z.string().datetime(),
  clientId: z.string().uuid(),
});

// 3. POST /api/client/book - Create a new booking
router.post('/book', async (req, res) => {
  try {
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(fail('Invalid booking data', parsed.error.flatten()));
    }
    
    const { serviceId, stylistId, slotTime, clientId } = parsed.data;
    
    // Use BookingOrchestrator to create appointment
    const result = await BookingOrchestrator.createAppointment({
      salonId: SALON_ID,
      clientId,
      serviceId,
      staffId: stylistId || 'any',
      slotTime,
    });
    
    if (!result.success) {
      // Check if it's a conflict error
      if (result.error?.includes('conflict') || result.error?.includes('unavailable')) {
        // Get waitlist options
        const waitlistResult = await query(
          `SELECT id, position, estimated_time FROM waitlist
           WHERE salon_id = $1 AND service_id = $2 AND status = 'waiting'
           ORDER BY position LIMIT 5`,
          [SALON_ID, serviceId]
        );
        
        return res.status(409).json(fail(
          'Time slot unavailable',
          { waitlist_options: waitlistResult.rows },
          'SLOT_UNAVAILABLE'
        ));
      }
      return res.status(400).json(fail(result.error || 'Failed to create booking'));
    }
    
    res.status(201).json(ok({
      booking_id: result.appointmentId,
      confirmation: result.confirmation,
    }, { message: 'Booking created successfully' }));
  } catch (err) {
    console.error(err);
    res.status(500).json(fail('Failed to create booking'));
  }
});

// 4. GET /api/client/bookings - Get client's booking history
router.get('/bookings', async (req, res) => {
  try {
    const clientId = req.query.clientId as string;
    if (!clientId) {
      return res.status(400).json(fail('clientId is required'));
    }
    
    const result = await query(
      `SELECT
        a.id,
        a.appointment_time,
        a.status,
        a.created_at,
        s.name as service_name,
        s.duration_minutes,
        s.price,
        st.full_name as stylist_name,
        c.full_name as client_name,
        c.phone_number
       FROM appointments a
       JOIN clients c ON a.client_id = c.id
       LEFT JOIN staff st ON a.staff_id = st.id
       LEFT JOIN appointment_services aps ON a.id = aps.appointment_id
       LEFT JOIN services s ON aps.service_id = s.id
       WHERE a.client_id = $1 AND a.salon_id = $2
       ORDER BY a.appointment_time DESC`,
      [clientId, SALON_ID]
    );
    
    res.json(ok(result.rows, { count: result.rows.length }));
  } catch (err) {
    console.error(err);
    res.status(500).json(fail('Failed to fetch bookings'));
  }
});

// 5. PUT /api/client/bookings/:id/cancel - Cancel a booking
router.put('/bookings/:id/cancel', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    
    // First check if appointment exists and belongs to client
    const appointment = await AppointmentRepository.findById(appointmentId, SALON_ID);
    if (!appointment) {
      return res.status(404).json(fail('Appointment not found'));
    }
    
    // Update status to cancelled
    const updated = await AppointmentRepository.updateStatus(appointmentId, 'cancelled');
    
    // Trigger waitlist processing for the cancelled slot
    if (appointment.appointment_time) {
      // Dynamic import with .js extension
      const { WaitlistService } = await import('../services/WaitlistService.js');
      WaitlistService.processCancellation(appointment.appointment_time);
    }
    
    res.json(ok(updated, { message: 'Booking cancelled successfully' }));
  } catch (err) {
    console.error(err);
    res.status(500).json(fail('Failed to cancel booking'));
  }
});

// Validation schema for reschedule
const rescheduleSchema = z.object({
  newSlotTime: z.string().datetime(),
});

// 6. PUT /api/client/bookings/:id/reschedule - Reschedule a booking
router.put('/bookings/:id/reschedule', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const parsed = rescheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(fail('Invalid reschedule data', parsed.error.flatten()));
    }
    
    const { newSlotTime } = parsed.data;
    
    // Check if appointment exists
    const appointment = await AppointmentRepository.findById(appointmentId, SALON_ID);
    if (!appointment) {
      return res.status(404).json(fail('Appointment not found'));
    }
    
    // Reschedule appointment
    const updated = await AppointmentRepository.rescheduleAppointment(appointmentId, newSlotTime);
    
    res.json(ok(updated, { message: 'Booking rescheduled successfully' }));
  } catch (err) {
    console.error(err);
    res.status(500).json(fail('Failed to reschedule booking'));
  }
});

export default router;
