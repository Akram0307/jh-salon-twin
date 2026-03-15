import { Router } from 'express';
import appointmentStatusService from '../services/AppointmentStatusService';
import { validateUUID } from '../middleware/validateUUID';

const router = Router();
router.use(validateUUID);

// PATCH /api/appointments/:id/status - Update status with validation
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.body.salon_id;
    const newStatus = req.body.status;
    const changedByStaffId = req.body.staff_id;
    const changeReason = req.body.reason;

    if (!salonId || !newStatus) {
      return res.status(400).json({ error: 'salon_id and status are required' });
    }

    const result = await appointmentStatusService.updateStatus(
      id, 
      salonId, 
      newStatus, 
      changedByStaffId, 
      changeReason
    );

    res.json(result);
  } catch (err) {
    console.error('Error updating appointment status:', err);
    if (err instanceof Error) {
      if (err.message === 'Appointment not found') {
        return res.status(404).json({ error: err.message });
      }
      if (err.message.includes('Invalid status transition')) {
        return res.status(400).json({ error: err.message });
      }
    }
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
});

// POST /api/appointments/bulk-status - Bulk update
router.post('/bulk-status', async (req, res) => {
  try {
    const salonId = req.body.salon_id;
    const appointmentIds = req.body.appointment_ids;
    const newStatus = req.body.status;
    const changedByStaffId = req.body.staff_id;
    const changeReason = req.body.reason;

    if (!salonId || !appointmentIds || !Array.isArray(appointmentIds) || !newStatus) {
      return res.status(400).json({ 
        error: 'salon_id, appointment_ids array, and status are required' 
      });
    }

    if (appointmentIds.length === 0) {
      return res.status(400).json({ error: 'appointment_ids array cannot be empty' });
    }

    if (appointmentIds.length > 100) {
      return res.status(400).json({ error: 'Cannot update more than 100 appointments at once' });
    }

    const result = await appointmentStatusService.bulkUpdateStatus(
      appointmentIds, 
      salonId, 
      newStatus, 
      changedByStaffId, 
      changeReason
    );

    res.json(result);
  } catch (err) {
    console.error('Error bulk updating appointment status:', err);
    if (err instanceof Error && err.message === 'No valid appointments to update') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to bulk update appointment status' });
  }
});

// GET /api/appointments/:id/status-history - Get history
router.get('/:id/status-history', async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.query.salon_id as string;

    if (!salonId) {
      return res.status(400).json({ error: 'salon_id is required' });
    }

    const history = await appointmentStatusService.getStatusHistory(id, salonId);
    res.json(history);
  } catch (err) {
    console.error('Error fetching appointment status history:', err);
    res.status(500).json({ error: 'Failed to fetch appointment status history' });
  }
});

// Additional endpoints for convenience

// GET /api/appointments/:id/status - Get current status
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.query.salon_id as string;

    if (!salonId) {
      return res.status(400).json({ error: 'salon_id is required' });
    }

    const status = await appointmentStatusService.getAppointmentStatus(id, salonId);
    if (!status) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json({ status });
  } catch (err) {
    console.error('Error fetching appointment status:', err);
    res.status(500).json({ error: 'Failed to fetch appointment status' });
  }
});

// GET /api/appointments/status-history/recent - Get recent status changes for salon
router.get('/status-history/recent', async (req, res) => {
  try {
    const salonId = req.query.salon_id as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!salonId) {
      return res.status(400).json({ error: 'salon_id is required' });
    }

    const history = await appointmentStatusService.getRecentStatusChanges(salonId, limit);
    res.json(history);
  } catch (err) {
    console.error('Error fetching recent status changes:', err);
    res.status(500).json({ error: 'Failed to fetch recent status changes' });
  }
});

export default router;
