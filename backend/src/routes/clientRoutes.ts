import beautyProfileService from '../services/ClientBeautyProfileService';
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

// Client Beauty Profile
router.get('/:id/profile', async (req, res) => {
  try {
    const salonId = req.query.salon_id as string
    const clientId = req.params.id

    const profile = await beautyProfileService.getClientProfile(clientId, salonId)
    res.json(profile || {})
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch client profile' })
  }
})

router.post('/:id/profile', async (req, res) => {
  try {
    const salonId = req.body.salon_id
    const clientId = req.params.id

    const profile = await beautyProfileService.createProfile(clientId, salonId, req.body)
    res.status(201).json(profile)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create client profile' })
  }
})

router.patch('/:id/profile', async (req, res) => {
  try {
    const salonId = req.body.salon_id
    const clientId = req.params.id

    const profile = await beautyProfileService.updateProfile(clientId, salonId, req.body)
    res.json(profile)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update client profile' })
  }
})
