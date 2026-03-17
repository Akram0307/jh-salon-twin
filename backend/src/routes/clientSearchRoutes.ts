import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import clientSearchService from '../services/ClientSearchService';
import { validateUUID } from '../middleware/validateUUID';

import logger from '../config/logger';

const router = Router();
router.use(authenticate);
router.use(validateUUID);

// GET /api/clients/search?q=term - Fuzzy search with pg_trgm
router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q as string;
    const salonId = req.query.salon_id as string;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!salonId) {
      return res.status(400).json({ error: 'salon_id is required' });
    }

    if (!searchTerm) {
      return res.status(400).json({ error: 'q (search term) is required' });
    }

    const results = await clientSearchService.searchClients({
      salonId,
      searchTerm,
      limit,
      offset,
      searchType: 'fuzzy'
    });

    res.json({
      results,
      total: results.length,
      limit,
      offset
    });
  } catch (err) {
    logger.error({ err: err }, 'Error searching clients:');
    if (err instanceof Error) {
      if (err.message.includes('required') || err.message.includes('too long')) {
        return res.status(400).json({ error: err.message });
      }
    }
    res.status(500).json({ error: 'Failed to search clients' });
  }
});

// GET /api/clients/quick-search?q=term - Autocomplete (<100ms)
router.get('/quick-search', async (req, res) => {
  try {
    const searchTerm = req.query.q as string;
    const salonId = req.query.salon_id as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!salonId) {
      return res.status(400).json({ error: 'salon_id is required' });
    }

    if (!searchTerm) {
      return res.status(400).json({ error: 'q (search term) is required' });
    }

    const results = await clientSearchService.quickSearch(salonId, searchTerm, limit);

    res.json({
      results,
      total: results.length,
      limit
    });
  } catch (err) {
    logger.error({ err: err }, 'Error in quick search:');
    if (err instanceof Error) {
      if (err.message.includes('required')) {
        return res.status(400).json({ error: err.message });
      }
    }
    res.status(500).json({ error: 'Failed to perform quick search' });
  }
});

// GET /api/clients/by-phone/:phone - Exact phone lookup
router.get('/by-phone/:phone', async (req, res) => {
  try {
    const phone = req.params.phone;
    const salonId = req.query.salon_id as string;

    if (!salonId) {
      return res.status(400).json({ error: 'salon_id is required' });
    }

    const client = await clientSearchService.findByPhone(phone, salonId);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (err) {
    logger.error({ err: err }, 'Error finding client by phone:');
    if (err instanceof Error) {
      if (err.message.includes('required') || err.message.includes('Invalid')) {
        return res.status(400).json({ error: err.message });
      }
    }
    res.status(500).json({ error: 'Failed to find client by phone' });
  }
});

// GET /api/clients/suggestions - Get search suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const salonId = req.query.salon_id as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!salonId) {
      return res.status(400).json({ error: 'salon_id is required' });
    }

    const suggestions = await clientSearchService.getSearchSuggestions(salonId, limit);

    res.json({
      suggestions,
      total: suggestions.length,
      limit
    });
  } catch (err) {
    logger.error({ err: err }, 'Error getting search suggestions:');
    if (err instanceof Error && err.message.includes('required')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to get search suggestions' });
  }
});

export default router;
