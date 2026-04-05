import { validateUUID } from '../middleware/validateUUID';
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { serviceCreateRouteSchema, serviceUpdateRouteSchema } from '../schemas/service';
import { ServiceConflictError, ServiceRepository } from '../repositories/ServiceRepository';

import logger from '../config/logger';

const router = Router();
router.use(authenticate);
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

function errorResponse(error: string, message?: string, details?: unknown) {
  return {
    success: false,
    data: null,
    error,
    message: message || error,
    details,
  };
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

router.post('/', validate(serviceCreateRouteSchema), async (req, res) => {
  try {
    const duplicate = await ServiceRepository.findActiveByName(req.body.name, SALON_ID);

    if (duplicate) {
      return res
        .status(409)
        .json(errorResponse('SERVICE_NAME_CONFLICT', 'Service name already exists', { duplicateName: duplicate.name }));
    }

    const service = await ServiceRepository.create({ ...req.body, salon_id: SALON_ID });
    res.status(201).json(envelope(service, {}, `Created service "${service.name}" successfully.`));
  } catch (err) {
    logger.error(err);
    if (err instanceof ServiceConflictError) {
      return res.status(409).json(errorResponse(err.code, err.message, { duplicateName: err.duplicateName }));
    }
    res.status(500).json(errorResponse('Failed to create service', 'Unable to create service right now.'));
  }
});

router.put('/:id', validate(serviceUpdateRouteSchema), async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const service = await ServiceRepository.update(id, req.body, SALON_ID);
    if (!service) {
      return res.status(404).json(errorResponse('Service not found', 'The requested service could not be found.'));
    }
    const lifecycleMessage = service.is_active
      ? `Updated service "${service.name}" successfully.`
      : `Archived service "${service.name}" successfully.`;
    res.json(envelope(service, {}, lifecycleMessage));
  } catch (err) {
    logger.error(err);
    if (err instanceof ServiceConflictError) {
      return res.status(409).json(errorResponse(err.code, err.message, { duplicateName: err.duplicateName }));
    }
    res.status(500).json(errorResponse('Failed to update service', 'Unable to update service right now.'));
  }
});

export default router;
