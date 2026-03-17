import { validateUUID } from '../middleware/validateUUID';
import { Router } from 'express';
import { z } from 'zod';
import { ServiceConflictError, ServiceRepository } from '../repositories/ServiceRepository';

import logger from '../config/logger';

const router = Router();
const SALON_ID = process.env.SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';
router.use(validateUUID);

const envelope = (data: unknown, meta: Record<string, unknown> = {}, message?: string) => ({
  success: true,
  data,
  message,
  error: null,
  meta: {
    salon_id: SALON_ID,
    ...meta,
  },
});

const serviceSchema = z.object({
  name: z.string().trim().min(2, 'Service name must be at least 2 characters').max(120, 'Service name must be at most 120 characters'),
  description: z.string().trim().max(1000, 'Description must be at most 1000 characters').optional().nullable(),
  duration_minutes: z.coerce.number().int('Duration must be a whole number').min(5, 'Duration must be at least 5 minutes').max(480, 'Duration must be 480 minutes or less'),
  price: z.coerce.number().min(0, 'Price cannot be negative').max(100000, 'Price is too high'),
  category: z.string().trim().min(2, 'Category must be at least 2 characters').max(80, 'Category must be at most 80 characters').optional().nullable(),
  is_active: z.boolean().optional(),
});

const serviceUpdateSchema = serviceSchema.partial().refine((payload) => Object.keys(payload).length > 0, {
  message: 'At least one field is required to update a service',
});

function errorResponse(error: string, message?: string, details?: unknown) {
  return {
    success: false,
    data: null,
    error,
    message: message || error,
    details,
  };
}

function getZodDetails(err: z.ZodError) {
  return err.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}

router.get('/', async (_req, res) => {
  try {
    const services = await ServiceRepository.findAll(SALON_ID);
    res.json(envelope(services, { count: services.length }, 'Services loaded successfully'));
  } catch (err) {
    logger.error(err);
    res.status(500).json(errorResponse('Failed to fetch services', 'Unable to load services right now.'));
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = serviceSchema.parse(req.body);
    const duplicate = await ServiceRepository.findActiveByName(payload.name, SALON_ID);

    if (duplicate) {
      return res
        .status(409)
        .json(errorResponse('SERVICE_NAME_CONFLICT', 'Service name already exists', { duplicateName: duplicate.name }));
    }

    const service = await ServiceRepository.create({ ...payload, salon_id: SALON_ID });
    res.status(201).json(envelope(service, {}, `Created service "${service.name}" successfully.`));
  } catch (err) {
    logger.error(err);
    if (err instanceof z.ZodError) {
      return res.status(400).json(errorResponse('Validation failed', 'Please correct the highlighted service fields.', getZodDetails(err)));
    }
    if (err instanceof ServiceConflictError) {
      return res.status(409).json(errorResponse(err.code, err.message, { duplicateName: err.duplicateName }));
    }
    res.status(500).json(errorResponse('Failed to create service', 'Unable to create service right now.'));
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payload = serviceUpdateSchema.parse(req.body);
    const service = await ServiceRepository.update(req.params.id, payload, SALON_ID);
    if (!service) {
      return res.status(404).json(errorResponse('Service not found', 'The requested service could not be found.'));
    }
    const lifecycleMessage = service.is_active
      ? `Updated service "${service.name}" successfully.`
      : `Archived service "${service.name}" successfully.`;
    res.json(envelope(service, {}, lifecycleMessage));
  } catch (err) {
    logger.error(err);
    if (err instanceof z.ZodError) {
      return res.status(400).json(errorResponse('Validation failed', 'Please correct the highlighted service fields.', getZodDetails(err)));
    }
    if (err instanceof ServiceConflictError) {
      return res.status(409).json(errorResponse(err.code, err.message, { duplicateName: err.duplicateName }));
    }
    res.status(500).json(errorResponse('Failed to update service', 'Unable to update service right now.'));
  }
});

export default router;
