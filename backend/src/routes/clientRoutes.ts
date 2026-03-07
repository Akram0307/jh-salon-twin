import { validateUUID } from '../middleware/validateUUID'
import { Router } from 'express';
import { ClientRepository } from '../repositories/ClientRepository';

const router = Router()
router.use(validateUUID);

router.get('/', async (req, res) => {
    try {
        const clients = await ClientRepository.findAll();
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

router.post('/', async (req, res) => {
    try {
        const client = await ClientRepository.create(req.body);
        res.status(201).json(client);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create client' });
    }
});

export default router;
