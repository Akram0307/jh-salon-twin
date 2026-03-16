import { Router, Request, Response } from 'express';
import { DataExportService } from '../services/DataExportService';
import { authenticate } from '../middleware/auth';

const router = Router();
const exportService = new DataExportService();

// Middleware to require authentication for all export routes
router.use(authenticate);

/**
 * GET /api/exports/clients
 * Export clients data in CSV or JSON format
 * Query params: format (csv|json), salon_id (optional)
 */
router.get('/clients', async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as 'csv' | 'json' | 'excel') || 'csv';
    const salonId = req.query.salon_id as string;

    const exportResult = await exportService.exportClients(format, salonId);

    // Set appropriate headers for download
    const contentType = format === 'json' ? 'application/json' : 'text/csv';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);

    res.send(exportResult.data);
  } catch (error) {
    console.error('Error exporting clients:', error);
    res.status(500).json({ error: 'Failed to export clients data' });
  }
});

/**
 * GET /api/exports/appointments
 * Export appointments data in CSV or JSON format
 * Query params: format (csv|json), salon_id (optional), start_date (optional), end_date (optional)
 */
router.get('/appointments', async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as 'csv' | 'json' | 'excel') || 'csv';
    const salonId = req.query.salon_id as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    const exportResult = await exportService.exportAppointments(format, salonId, startDate, endDate);

    const contentType = format === 'json' ? 'application/json' : 'text/csv';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);

    res.send(exportResult.data);
  } catch (error) {
    console.error('Error exporting appointments:', error);
    res.status(500).json({ error: 'Failed to export appointments data' });
  }
});

/**
 * GET /api/exports/services
 * Export services data in CSV or JSON format
 * Query params: format (csv|json), salon_id (optional)
 */
router.get('/services', async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as 'csv' | 'json' | 'excel') || 'csv';
    const salonId = req.query.salon_id as string;

    const exportResult = await exportService.exportServices(format, salonId);

    const contentType = format === 'json' ? 'application/json' : 'text/csv';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);

    res.send(exportResult.data);
  } catch (error) {
    console.error('Error exporting services:', error);
    res.status(500).json({ error: 'Failed to export services data' });
  }
});

/**
 * GET /api/exports/revenue
 * Export revenue data in CSV, JSON, or Excel format
 * Query params: format (csv|json|excel), salon_id (optional), start_date (optional), end_date (optional)
 */
router.get('/revenue', async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as 'csv' | 'json' | 'excel') || 'csv';
    const salonId = req.query.salon_id as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    const exportResult = await exportService.exportRevenue(format, salonId, startDate, endDate);

    const contentType = format === 'json' ? 'application/json' : format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);

    res.send(exportResult.data);
  } catch (error) {
    console.error('Error exporting revenue:', error);
    res.status(500).json({ error: 'Failed to export revenue data' });
  }
});

/**
 * GET /api/exports/staff-performance
 * Export staff performance data in CSV, JSON, or Excel format
 * Query params: format (csv|json|excel), salon_id (optional), start_date (optional), end_date (optional)
 */
router.get('/staff-performance', async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as 'csv' | 'json' | 'excel') || 'csv';
    const salonId = req.query.salon_id as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    const exportResult = await exportService.exportStaffPerformance(format, salonId, startDate, endDate);

    const contentType = format === 'json' ? 'application/json' : format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);

    res.send(exportResult.data);
  } catch (error) {
    console.error('Error exporting staff performance:', error);
    res.status(500).json({ error: 'Failed to export staff performance data' });
  }
});

/**
 * POST /api/exports/upload
 * Export data and upload to Cloud Storage, returning public URL
 * Body: { type: 'clients'|'appointments'|'services', format: 'csv'|'json', salon_id (optional), start_date (optional), end_date (optional) }
 */
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { type, format = 'csv', salon_id, start_date, end_date } = req.body;

    if (!['clients', 'appointments', 'services', 'revenue', 'staff-performance'].includes(type)) {
      return res.status(400).json({ error: 'Invalid export type. Must be clients, appointments, or services' });
    }

    const exportResult = await exportService.exportAndUpload(
      format as 'csv' | 'json',
      type as 'clients' | 'appointments' | 'services' | 'revenue' | 'staff-performance',
      salon_id,
      start_date,
      end_date
    );

    res.json({
      success: true,
      filename: exportResult.filename,
      publicUrl: exportResult.publicUrl,
      message: `Export uploaded successfully. Download from: ${exportResult.publicUrl}`
    });
  } catch (error) {
    console.error('Error uploading export:', error);
    res.status(500).json({ error: 'Failed to upload export to Cloud Storage' });
  }
});

/**
 * GET /api/exports/scheduled
 * Get list of scheduled exports
 */
router.get('/scheduled', async (req: Request, res: Response) => {
  try {
    // In a real implementation, this would fetch from a database
    // For now, return a mock list of scheduled exports
    const scheduledExports = [
      {
        id: '1',
        name: 'Daily Revenue Report',
        type: 'revenue',
        format: 'excel',
        schedule: '0 8 * * *', // Every day at 8 AM
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      },
      {
        id: '2',
        name: 'Weekly Staff Performance',
        type: 'staff-performance',
        format: 'csv',
        schedule: '0 9 * * 1', // Every Monday at 9 AM
        lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      }
    ];

    res.json({
      success: true,
      scheduledExports
    });
  } catch (error) {
    console.error('Error fetching scheduled exports:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled exports' });
  }
});

export default router;
