import { validateUUID } from '../middleware/validateUUID'
import { Router } from 'express';
import { WaitlistOfferRepository } from '../repositories/WaitlistOfferRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { WaitlistRepository } from '../repositories/WaitlistRepository';

const router = Router()
router.use(validateUUID);

router.post('/', async (req, res) => {
    try {
        const { clientId, preferredDate, preferredTimeRange, notes } = req.body;
        const entry = await WaitlistRepository.addEntry(clientId, preferredDate, preferredTimeRange, notes);
        res.status(201).json(entry);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
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
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const entry = await WaitlistRepository.updateStatus(req.params.id, status);
        res.json(entry);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Waitlist Recovery Monitor stats
router.get('/recovery-stats', async (_req, res) => {
  try {
    let waitingClients = 0;
    let offersSent = 0;
    let recoveredBookings = 0;
    let recoveryRevenue = 0;

    try { waitingClients = await WaitlistRepository.countPending(); } catch (e) { console.error('waitlist pending metric failed:', e); }
    try { offersSent = await WaitlistOfferRepository.countOffersSent(); } catch (e) { console.error('waitlist offersSent metric failed:', e); }
    try { recoveredBookings = await WaitlistOfferRepository.countRecoveredBookings(); } catch (e) { console.error('waitlist recoveredBookings metric failed:', e); }
    try { recoveryRevenue = await TransactionRepository.sumRecoveredRevenue(); } catch (e) { console.error('waitlist recoveryRevenue metric failed:', e); }

    res.json({ waitingClients, offersSent, recoveredBookings, recoveryRevenue });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Autonomous Waitlist Recovery Engine
router.post('/recover', async (req, res) => {
  try {
    const result = await (await import('../services/AIWaitlistRecoveryOrchestrator.js')).AIWaitlistRecoveryOrchestrator.runRecoveryCycle();
    return res.json(result);

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
