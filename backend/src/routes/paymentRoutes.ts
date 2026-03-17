import { Router, Request, Response, NextFunction } from 'express';
import PaymentRecordingService from '../services/PaymentRecordingService';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

import logger from '../config/logger';
const log = logger.child({ module: 'payment_routes' });

const router = Router();

// Validation schemas
const createPaymentSchema = z.object({
  appointment_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  staff_id: z.string().uuid().optional(),
  amount: z.number().positive(),
  payment_method: z.enum(['cash', 'phonepe', 'upi', 'card', 'other']),
  reference_number: z.string().max(100).optional(),
  notes: z.string().max(500).optional()
});

const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  payment_method: z.enum(['cash', 'phonepe', 'upi', 'card', 'other']).optional(),
  payment_status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  reference_number: z.string().max(100).optional(),
  notes: z.string().max(500).optional()
});

const paymentFiltersSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  payment_method: z.enum(['cash', 'phonepe', 'upi', 'card', 'other']).optional(),
  payment_status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  client_id: z.string().uuid().optional(),
  staff_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional()
});

const generateZReportSchema = z.object({
  report_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const updateZReportNotesSchema = z.object({
  notes: z.string().max(1000)
});

// Middleware to extract salon_id from request
const extractSalonId = (req: Request, res: Response, next: NextFunction) => {
  // In a real app, this would come from the authenticated user's session
  // For now, we'll use a header or query param
  const salon_id = req.headers['x-salon-id'] as string || req.query.salon_id as string;
  
  if (!salon_id) {
    return res.status(400).json({ error: 'Salon ID is required' });
  }
  
  req.body.salon_id = salon_id;
    next();
};

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
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    if (!salon_id) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }

    const validatedData = createPaymentSchema.parse(req.body);
    
    const payment = await PaymentRecordingService.createPayment({
      ...validatedData,
      salon_id,
      recorded_by: (req as any).user?.id || req.body.recorded_by
    });
    
    res.status(201).json({ success: true, data: payment });
  } catch (error: any) {
    log.error({ err: error }, 'Error creating payment:');
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request body', 
        details: error.errors 
      });
    }
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
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    if (!salon_id) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }

    const validatedData = updatePaymentSchema.parse(req.body);
    
    const payment = await PaymentRecordingService.updatePayment(
      String(req.params.id),
      salon_id,
      validatedData
    );
    
    res.json({ success: true, data: payment });
  } catch (error: any) {
    log.error({ err: error }, 'Error updating payment:');
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request body', 
        details: error.errors 
      });
    }
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
router.post('/:id/refund', authenticate, async (req: Request, res: Response) => {
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
router.post('/z-report/generate', authenticate, async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    if (!salon_id) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }

    const validatedData = generateZReportSchema.parse(req.body);
    
    const report = await PaymentRecordingService.generateZReport(
      salon_id,
      validatedData.report_date,
      (req as any).user?.id || req.body.generated_by
    );
    
    res.json({ success: true, data: report });
  } catch (error: any) {
    log.error({ err: error }, 'Error generating Z-Report:');
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request body', 
        details: error.errors 
      });
    }
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
router.patch('/z-report/:id/notes', authenticate, async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    if (!salon_id) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }

    const validatedData = updateZReportNotesSchema.parse(req.body);
    
    const report = await PaymentRecordingService.updateZReportNotes(
      String(req.params.id),
      salon_id,
      validatedData.notes
    );
    
    res.json({ success: true, data: report });
  } catch (error: any) {
    log.error({ err: error }, 'Error updating Z-Report notes:');
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request body', 
        details: error.errors 
      });
    }
    res.status(error.statusCode || 500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

export default router;
