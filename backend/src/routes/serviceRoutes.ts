import { validateUUID } from '../middleware/validateUUID';
import { Router } from 'express';
import { ServiceRepository } from '../repositories/ServiceRepository';

const router = Router();
const SALON_ID = process.env.SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';
router.use(validateUUID);

const envelope = (data: unknown, meta: Record<string, unknown> = {}) => ({
  success: true,
  data,
  meta: {
    salon_id: SALON_ID,
    ...meta,
  },
});

router.get('/', async (_req, res) => {
  try {
    const services = await ServiceRepository.findAll(SALON_ID);
    res.json(envelope(services, { count: services.length }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch services' });
  }
});

router.post('/', async (req, res) => {
  try {
    const service = await ServiceRepository.create({ ...req.body, salon_id: SALON_ID });
    res.status(201).json(envelope(service));
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create service' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const service = await ServiceRepository.update(req.params.id, req.body, SALON_ID);
    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }
    res.json(envelope(service));
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update service' });
  }
});

export default router;
