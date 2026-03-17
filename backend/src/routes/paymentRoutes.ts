import { Router, Request, Response, NextFunction } from 'express';
import PaymentRecordingService from '../services/PaymentRecordingService';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPaymentSchema, updatePaymentSchema, refundSchema, generateZReportSchema, updateZReportNotesSchema, paymentFiltersSchema } from '../schemas/payment';

import logger from '../config/logger';
const log = logger.child({ module: 'payment_routes' });

const router = Router();

// GET /api/payments/stats - Get payment statistics
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    if (!salon_id) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }

    const { start_date, end_date } = req.query;

    const stats = await PaymentRecordingService.getPaymentStats(
      salon_id,
      start_date as string,
      end_date as string
    );

    res.json({ success: true, data: stats });
  } catch (error: any) {
    log.error({ err: error }, 'Error getting payment stats:');
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/payments/today-summary - Get today's payment summary
router.get('/today-summary', authenticate, async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    if (!salon_id) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }

    const summary = await PaymentRecordingService.getTodaySummary(salon_id);

    res.json({ success: true, data: summary });
  } catch (error: any) {
    log.error({ err: error }, 'Error getting today summary:');
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/payments - List payments with filters
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    if (!salon_id) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }

    const filters = paymentFiltersSchema.parse({
      ...req.query,
      salon_id
    });

    const result = await PaymentRecordingService.getPaymentsByFilters({
      ...filters,
      salon_id
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    log.error({ err: error }, 'Error getting payments:');
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      });
    }
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/payments - Create a new payment
router.post('/', authenticate, validate(createPaymentSchema), async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    if (!salon_id) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }

    const payment = await PaymentRecordingService.createPayment({
      ...req.body,
      salon_id,
      recorded_by: (req as any).user?.id || req.body.recorded_by
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error: any) {
    log.error({ err: error }, 'Error creating payment:');
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/payments/:id - Get payment by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    if (!salon_id) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }

    const payment = await PaymentRecordingService.getPaymentById(
      String(req.params.id),
      salon_id
    );

    res.json({ success: true, data: payment });
  } catch (error: any) {
    log.error({ err: error }, 'Error getting payment:');
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// PATCH /api/payments/:id - Update payment
router.patch('/:id', authenticate, validate(updatePaymentSchema), async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    if (!salon_id) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }

    const payment = await PaymentRecordingService.updatePayment(
      String(req.params.id),
      salon_id,
      req.body
    );

    res.json({ success: true, data: payment });
  } catch (error: any) {
    log.error({ err: error }, 'Error updating payment:');
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// DELETE /api/payments/:id - Delete payment
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    if (!salon_id) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }

    await PaymentRecordingService.deletePayment(String(req.params.id), salon_id);

    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error: any) {
    log.error({ err: error }, 'Error deleting payment:');
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/payments/:id/refund - Refund payment
router.post('/:id/refund', authenticate, validate(refundSchema), async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    if (!salon_id) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }

    const { notes } = req.body;

    const payment = await PaymentRecordingService.refundPayment(
      String(req.params.id),
      salon_id,
      notes
    );

    res.json({ success: true, data: payment });
  } catch (error: any) {
    log.error({ err: error }, 'Error refunding payment:');
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Z-Report routes

// POST /api/payments/z-report/generate - Generate Z-Report for a date
router.post('/z-report/generate', authenticate, validate(generateZReportSchema), async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    if (!salon_id) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }

    const report = await PaymentRecordingService.generateZReport(
      salon_id,
      req.body.report_date,
      (req as any).user?.id || req.body.generated_by
    );

    res.json({ success: true, data: report });
  } catch (error: any) {
    log.error({ err: error }, 'Error generating Z-Report:');
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/payments/z-report/:date - Get Z-Report for a specific date
router.get('/z-report/:date', authenticate, async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    if (!salon_id) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }

    const report = await PaymentRecordingService.getZReport(
      salon_id,
      String(req.params.date)
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Z-Report not found for this date'
      });
    }

    res.json({ success: true, data: report });
  } catch (error: any) {
    log.error({ err: error }, 'Error getting Z-Report:');
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/payments/z-report - Get Z-Reports by date range
router.get('/z-report', authenticate, async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    if (!salon_id) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }

    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'start_date and end_date are required'
      });
    }

    const reports = await PaymentRecordingService.getZReportsByDateRange(
      salon_id,
      start_date as string,
      end_date as string
    );

    res.json({ success: true, data: reports });
  } catch (error: any) {
    log.error({ err: error }, 'Error getting Z-Reports:');
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// PATCH /api/payments/z-report/:id/notes - Update Z-Report notes
router.patch('/z-report/:id/notes', authenticate, validate(updateZReportNotesSchema), async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    if (!salon_id) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }

    const report = await PaymentRecordingService.updateZReportNotes(
      String(req.params.id),
      salon_id,
      req.body.notes
    );

    res.json({ success: true, data: report });
  } catch (error: any) {
    log.error({ err: error }, 'Error updating Z-Report notes:');
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

export default router;
