import { Router } from 'express';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { validate } from '../middleware/validate';
import { createDraftSchema, completeTransactionSchema } from '../schemas/pos';

import logger from '../config/logger';
import { PosItem } from '../types/routeTypes';

const router = Router();

// Create POS draft (screen 1)
router.post('/create-draft', validate(createDraftSchema), async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items required to create draft' });
    }

    const subtotal = items.reduce((sum: number, i: PosItem) => {
      const qty = i.quantity || 1;
      return sum + Number(i.price) * qty;
    }, 0);

    const draft = {
      id: `draft_${Date.now()}`,
      items,
      subtotal,
      tip: 0,
      total: subtotal,
      status: 'draft'
    };

    res.json(draft);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Failed to create POS draft' });
  }
});

// Complete transaction (screen 2)
router.post('/complete-transaction', validate(completeTransactionSchema), async (req, res) => {
  try {
    const {
      items,
      subtotal,
      tip,
      total,
      paymentMethod,
      clientId,
      staffId,
      salonId
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Transaction must include items' });
    }

    const safeSubtotal = Number(
      subtotal ?? items.reduce((s: number, i: PosItem) => s + (Number(i.price) * (i.quantity || 1)), 0)
    );

    const safeTip = Number(tip ?? 0);
    const safeTotal = Number(total ?? safeSubtotal + safeTip);

    const transactionPayload = {
      salon_id: salonId || null,
      items,
      subtotal: safeSubtotal,
      tip: safeTip,
      total: safeTotal,
      payment_method: paymentMethod || 'card',
      client_id: clientId || null,
      staff_id: staffId || null,
      status: 'paid',
      created_at: new Date().toISOString()
    };

    const tx = await TransactionRepository.createTransaction(transactionPayload);

    res.json(tx);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'POS transaction failed' });
  }
});

// Recent sales
router.get('/recent', async (req, res) => {
  try {
    const data = await TransactionRepository.getRecent();
    res.json(data);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

export default router;
