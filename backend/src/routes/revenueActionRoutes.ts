import logger from '../config/logger';
import express from 'express';
import { ClientRevenueOrchestrator } from '../services/ClientRevenueOrchestrator';
import { validate } from '../middleware/validate';
import { revenueActionSchema } from '../schemas/revenueAction';
import { getErrorMessage } from '../types/routeTypes';

const router = express.Router();

router.post('/', validate(revenueActionSchema), async (req, res) => {
  try {
    const { salonId, action } = req.body;

    const orchestrator = new ClientRevenueOrchestrator();

    if (action === 'scan_opportunities') {
      const result = await orchestrator.runDailyRevenueCycle(salonId);
      return res.json({ status: 'ok', result });
    }

    return res.status(400).json({ error: 'UNKNOWN_ACTION' });
  } catch (err: unknown) {
    logger.error({ err: err }, '[RevenueAction]');
    res.status(500).json({ error: 'REVENUE_AUTOMATION_FAILED', message: getErrorMessage(err) });
  }
});

export default router;
