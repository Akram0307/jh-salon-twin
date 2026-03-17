import { validateUUID } from '../middleware/validateUUID'
import { SlotGenerator } from '../services/SlotGenerator';
import { Router } from 'express';
import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { WaitlistService } from '../services/WaitlistService';
import { dispatchReminderForAppointment } from '../services/NotificationOrchestrator';
import { validate } from '../middleware/validate';
import { createAppointmentSchema, updateAppointmentStatusSchema, addAppointmentServiceSchema, updateServicePriceSchema, rescheduleAppointmentSchema } from '../schemas/appointment';

import logger from '../config/logger';
const log = logger.child({ module: 'appointment_routes' });

const router = Router()
router.use(validateUUID);

router.get('/', async (req, res) => {
    try {
        const appointments = await AppointmentRepository.findAll();
        res.json(appointments);
    } catch (err) {
        log.error(err);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

router.post('/', validate(createAppointmentSchema), async (req, res) => {
    try {
        const appointment = await AppointmentRepository.create(req.body);
        res.status(201).json(appointment);
    } catch (err) {
        log.error(err);
        res.status(500).json({ error: 'Failed to create appointment' });
    }
});

router.patch('/:id/status', validate(updateAppointmentStatusSchema), async (req, res) => {
    try {
        const allowedStatuses = ["SCHEDULED","ARRIVED","IN_PROGRESS","COMPLETED","CANCELLED","NO_SHOW"];
        const status = String(req.body.status || "").toUpperCase();

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid appointment status" });
        }

        const appointment = await AppointmentRepository.updateStatus(req.params.id as string, status.toLowerCase());
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        // Smart Gap Filling: Trigger waitlist check if cancelled
        if (status === 'CANCELLED' && appointment.appointment_time) {
            WaitlistService.processCancellation(appointment.appointment_time);
        }
        
        res.json(appointment);
    } catch (err) {
        log.error(err);
        res.status(500).json({ error: 'Failed to update appointment status' });
    }
});

router.get('/qr/:token', async (req, res) => {
    try {
        const appointment = await AppointmentRepository.findByQrToken(req.params.token);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        res.json(appointment);
    } catch (err) {
        log.error(err);
        res.status(500).json({ error: 'Failed to fetch appointment by QR token' });
    }
});

router.post('/:id/services', validate(addAppointmentServiceSchema), async (req, res) => {
    try {
        const { service_id, base_price, charged_price } = req.body;
        const service = await AppointmentRepository.addService(req.params.id as string, service_id, base_price, charged_price || base_price);
        res.status(201).json(service);
    } catch (err) {
        log.error(err);
        res.status(500).json({ error: 'Failed to add service to appointment' });
    }
});

router.patch('/:id/services/:serviceId', validate(updateServicePriceSchema), async (req, res) => {
    try {
        const { charged_price } = req.body;
        const service = await AppointmentRepository.updateServicePrice(req.params.id as string, req.params.serviceId as string, charged_price);
        if (!service) {
            return res.status(404).json({ error: 'Service not found on appointment' });
        }
        res.json(service);
    } catch (err) {
        log.error(err);
        res.status(500).json({ error: 'Failed to update service price' });
    }
});



router.post('/:id/send-reminder', async (req, res) => {
    try {
        const result = await dispatchReminderForAppointment(req.params.id as string);
        if ((result as any)?.error === 'appointment_not_found') {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        res.json({ ok: true, notification: result });
    } catch (error: any) {
        log.error({ err: error }, '[appointmentRoutes] reminder send failed');
        res.status(500).json({ error: 'Failed to send reminder' });
    }
});

router.patch('/:id/reschedule', validate(rescheduleAppointmentSchema), async (req, res) => {
    try {
        const { newDate, newStartTime, newEndTime } = req.body;
        const updated = await AppointmentRepository.rescheduleAppointment(req.params.id as string, newStartTime);
        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});


// Mission Control: Today's appointments
router.get('/today', async (req, res) => {
    try {
        const { query } = require('../config/db');
        const result = await query(`
            SELECT
                a.id,
                c.full_name AS client_name,
                COALESCE(sv.name, 'Service') AS service_name,
                st.full_name AS staff_name,
                a.appointment_time AS start_time,
                UPPER(a.status) AS status
            FROM appointments a
            JOIN clients c ON a.client_id = c.id
            LEFT JOIN staff st ON a.staff_id = st.id
            LEFT JOIN appointment_services aps ON a.id = aps.appointment_id
            LEFT JOIN services sv ON aps.service_id = sv.id
            WHERE DATE(a.appointment_time) = CURRENT_DATE
            ORDER BY a.appointment_time ASC
        `);

        res.json(result.rows);
    } catch (err) {
        log.error(err);
        res.status(500).json({ error: 'Failed to fetch today appointments' });
    }
});

// Smart Slot Generator
router.get('/slots', async (req, res) => {
    try {
        const { salon_id, service_id, date } = req.query as any;

        if (!salon_id || !service_id || !date) {
            return res.status(400).json({ error: 'salon_id, service_id and date are required' });
        }

        const slots = await SlotGenerator.getAvailableSlots(salon_id, service_id, date);

        res.json({
            date,
            service_id,
            slots
        });

    } catch (err) {
        log.error(err);
        res.status(500).json({ error: 'Failed to generate slots' });
    }
});

export default router;
