import { validateUUID } from '../middleware/validateUUID'
import { Router } from 'express';
import { WaitlistOfferRepository } from '../repositories/WaitlistOfferRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { WaitlistRepository } from '../repositories/WaitlistRepository';
import { validate } from '../middleware/validate';
import { createWaitlistEntrySchema, updateWaitlistStatusSchema } from '../schemas/waitlist';

import logger from '../config/logger';
import { getErrorMessage } from '../types/routeTypes'

const router = Router()
router.use(validateUUID);

router.post('/', validate(createWaitlistEntrySchema), async (req, res) => {
    try {
        const { clientId, preferredDate, preferredTimeRange, notes } = req.body;
        const entry = await WaitlistRepository.addEntry(clientId, preferredDate, preferredTimeRange, notes);
        res.status(201).json(entry);
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

router.get('/', async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            res.status(400).json({ error: 'Date query parameter is required' });
            return;
        }
        const entries = await WaitlistRepository.getPendingByDate(date as string);
        res.json(entries);
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

router.patch('/:id/status', validate(updateWaitlistStatusSchema), async (req, res) => {
    try {
        const { status } = req.body;
        const entry = await WaitlistRepository.updateStatus(req.params.id as string, status);
        res.json(entry);
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

// Waitlist Recovery Monitor stats
router.get('/recovery-stats', async (_req, res) => {
  try {
    let waitingClients = 0;
    let offersSent = 0;
    let recoveredBookings = 0;
    let recoveryRevenue = 0;

    try { waitingClients = await WaitlistRepository.countPending(); } catch (e) { logger.error({ err: e }, 'waitlist pending metric failed:'); }
    try { offersSent = await WaitlistOfferRepository.countOffersSent(); } catch (e) { logger.error({ err: e }, 'waitlist offersSent metric failed:'); }
    try { recoveredBookings = await WaitlistOfferRepository.countRecoveredBookings(); } catch (e) { logger.error({ err: e }, 'waitlist recoveredBookings metric failed:'); }
    try { recoveryRevenue = await TransactionRepository.sumRecoveredRevenue(); } catch (e) { logger.error({ err: e }, 'waitlist recoveryRevenue metric failed:'); }

    res.json({ waitingClients, offersSent, recoveredBookings, recoveryRevenue });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Autonomous Waitlist Recovery Engine
router.post('/recover', async (req, res) => {
  try {
    const result = await (await import('../services/AIWaitlistRecoveryOrchestrator.js')).AIWaitlistRecoveryOrchestrator.runRecoveryCycle();
    return res.json(result);

  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;
