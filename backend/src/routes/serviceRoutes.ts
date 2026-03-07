import { validateUUID } from '../middleware/validateUUID'
import { Router } from 'express';
import { ServiceRepository } from '../repositories/ServiceRepository';

const router = Router()
router.use(validateUUID);

router.get('/', async (req, res) => {
    try {
        const services = await ServiceRepository.findAll();
        res.json(services);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

router.post('/', async (req, res) => {
    try {
        const service = await ServiceRepository.create(req.body);
        res.status(201).json(service);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create service' });
    }
});

export default router;
