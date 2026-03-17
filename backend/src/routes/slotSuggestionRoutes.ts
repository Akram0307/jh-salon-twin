import { Router, Request, Response } from 'express';
import { SlotSuggestionService, SlotSuggestionRequest, NaturalLanguageQuery, WaitlistFitRequest } from '../services/SlotSuggestionService';
import { SmartSlotRanker } from '../services/SmartSlotRanker';
import { authenticate } from '../middleware/auth';

import logger from '../config/logger';
const log = logger.child({ module: 'slot_suggestion_routes' });

const router = Router();
const slotSuggestionService = SlotSuggestionService.getInstance();

/**
 * GET /api/slots/smart-suggestions
 * Get AI-ranked slot suggestions based on client preferences, schedule optimization, and context
 */
router.get('/smart-suggestions', authenticate, async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const {
      clientId,
      salonId,
      serviceId,
      serviceDurationMinutes,
      servicePrice,
      preferredDate,
      startDate,
      endDate,
      weatherCondition,
      isHoliday,
      localEvents,
      waitlistId,
      timeOfDay,
      urgency,
      limit
    } = req.query;

    // Validate required fields
    if (!clientId || !salonId || !serviceId || !serviceDurationMinutes || !servicePrice) {
      return res.status(400).json({
        error: 'Missing required fields: clientId, salonId, serviceId, serviceDurationMinutes, servicePrice'
      });
    }

    const request: SlotSuggestionRequest = {
      clientId: clientId as string,
      salonId: salonId as string,
      serviceId: serviceId as string,
      serviceDurationMinutes: parseInt(serviceDurationMinutes as string),
      servicePrice: parseFloat(servicePrice as string),
      preferredDate: preferredDate as string,
      dateRange: startDate && endDate ? {
        start: startDate as string,
        end: endDate as string
      } : undefined,
      context: {
        weatherCondition: weatherCondition as string,
        isHoliday: isHoliday === 'true',
        localEvents: localEvents ? (localEvents as string).split(',') : undefined,
        waitlistId: waitlistId as string,
        timeOfDay: timeOfDay as 'morning' | 'afternoon' | 'evening',
        urgency: urgency as 'low' | 'medium' | 'high'
      },
      limit: limit ? parseInt(limit as string) : 5
    };

    const suggestions = await slotSuggestionService.getSmartSuggestions(request);

    const responseTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        suggestions,
        metadata: {
          responseTimeMs,
          algorithmVersion: '2.0',
          factorsConsidered: 8,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error: any) {
    log.error({ err: error }, 'Error getting smart suggestions:');
    res.status(500).json({
      error: 'Failed to get smart suggestions',
      message: error.message
    });
  }
});

/**
 * POST /api/slots/rank
 * Rank a custom list of slots using the AI ranking algorithm
 */
router.post('/rank', authenticate, async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const {
      clientId,
      salonId,
      serviceId,
      serviceDurationMinutes,
      servicePrice,
      date,
      slots,
      context
    } = req.body;

    // Validate required fields
    if (!clientId || !salonId || !serviceId || !serviceDurationMinutes || !servicePrice || !date || !slots) {
      return res.status(400).json({
        error: 'Missing required fields: clientId, salonId, serviceId, serviceDurationMinutes, servicePrice, date, slots'
      });
    }

    // Validate slots format
    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({
        error: 'slots must be a non-empty array'
      });
    }

    const customSlots = slots.map((slot: any) => ({
      time: new Date(slot.time),
      staffId: slot.staffId,
      staffName: slot.staffName
    }));

    const rankedSlots = await slotSuggestionService.rankCustomSlots(
      clientId,
      salonId,
      serviceId,
      serviceDurationMinutes,
      servicePrice,
      date,
      customSlots
    );

    const responseTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        rankedSlots,
        metadata: {
          responseTimeMs,
          algorithmVersion: '2.0',
          slotsRanked: rankedSlots.length,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error: any) {
    log.error({ err: error }, 'Error ranking slots:');
    res.status(500).json({
      error: 'Failed to rank slots',
      message: error.message
    });
  }
});

/**
 * GET /api/slots/optimal-times
 * Get optimal booking times for a service across a date range
 */
router.get('/optimal-times', authenticate, async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const {
      salonId,
      serviceId,
      serviceDurationMinutes,
      servicePrice,
      startDate,
      endDate
    } = req.query;

    // Validate required fields
    if (!salonId || !serviceId || !serviceDurationMinutes || !servicePrice || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required fields: salonId, serviceId, serviceDurationMinutes, servicePrice, startDate, endDate'
      });
    }

    const optimalTimes = await slotSuggestionService.getOptimalTimes(
      salonId as string,
      serviceId as string,
      parseInt(serviceDurationMinutes as string),
      parseFloat(servicePrice as string),
      {
        start: startDate as string,
        end: endDate as string
      }
    );

    const responseTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        optimalTimes,
        metadata: {
          responseTimeMs,
          dateRange: { start: startDate, end: endDate },
          daysAnalyzed: optimalTimes.length,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error: any) {
    log.error({ err: error }, 'Error getting optimal times:');
    res.status(500).json({
      error: 'Failed to get optimal times',
      message: error.message
    });
  }
});

/**
 * GET /api/slots/waitlist-fit
 * Find slots that fit waitlist preferences
 */
router.get('/waitlist-fit', authenticate, async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const {
      salonId,
      serviceId,
      serviceDurationMinutes,
      servicePrice,
      preferredDates,
      preferredTimes,
      preferredStaffIds,
      clientId
    } = req.query;

    // Validate required fields
    if (!salonId || !serviceId || !serviceDurationMinutes || !servicePrice || !preferredDates || !preferredTimes || !clientId) {
      return res.status(400).json({
        error: 'Missing required fields: salonId, serviceId, serviceDurationMinutes, servicePrice, preferredDates, preferredTimes, clientId'
      });
    }

    const request: WaitlistFitRequest = {
      salonId: salonId as string,
      serviceId: serviceId as string,
      serviceDurationMinutes: parseInt(serviceDurationMinutes as string),
      servicePrice: parseFloat(servicePrice as string),
      preferredDates: (preferredDates as string).split(','),
      preferredTimes: (preferredTimes as string).split(','),
      preferredStaffIds: preferredStaffIds ? (preferredStaffIds as string).split(',') : undefined,
      clientId: clientId as string
    };

    const waitlistSlots = await slotSuggestionService.getWaitlistFitSlots(request);

    const responseTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        slots: waitlistSlots,
        metadata: {
          responseTimeMs,
          slotsFound: waitlistSlots.length,
          preferencesMatched: {
            dates: request.preferredDates.length,
            times: request.preferredTimes.length,
            staff: request.preferredStaffIds?.length || 0
          },
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error: any) {
    log.error({ err: error }, 'Error getting waitlist fit slots:');
    res.status(500).json({
      error: 'Failed to get waitlist fit slots',
      message: error.message
    });
  }
});

/**
 * POST /api/slots/natural-language
 * Parse natural language query and return matching slots
 */
router.post('/natural-language', authenticate, async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { query, clientId, salonId, serviceId } = req.body;

    // Validate required fields
    if (!query || !clientId || !salonId) {
      return res.status(400).json({
        error: 'Missing required fields: query, clientId, salonId'
      });
    }

    const naturalLanguageQuery: NaturalLanguageQuery = {
      query,
      clientId,
      salonId,
      serviceId
    };

    const slots = await slotSuggestionService.getSlotsFromNaturalLanguage(naturalLanguageQuery);

    const responseTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        slots,
        metadata: {
          responseTimeMs,
          originalQuery: query,
          slotsFound: slots.length,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error: any) {
    log.error({ err: error }, 'Error processing natural language query:');
    res.status(500).json({
      error: 'Failed to process natural language query',
      message: error.message
    });
  }
});

/**
 * POST /api/slots/compare
 * Compare slots across multiple dates
 */
router.post('/compare', authenticate, async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const {
      clientId,
      salonId,
      serviceId,
      serviceDurationMinutes,
      servicePrice,
      dates,
      slotsPerDate
    } = req.body;

    // Validate required fields
    if (!clientId || !salonId || !serviceId || !serviceDurationMinutes || !servicePrice || !dates) {
      return res.status(400).json({
        error: 'Missing required fields: clientId, salonId, serviceId, serviceDurationMinutes, servicePrice, dates'
      });
    }

    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({
        error: 'dates must be a non-empty array'
      });
    }

    const comparisons = await slotSuggestionService.getMultiSlotComparison(
      clientId,
      salonId,
      serviceId,
      serviceDurationMinutes,
      servicePrice,
      dates,
      slotsPerDate || 3
    );

    const responseTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        comparisons,
        metadata: {
          responseTimeMs,
          datesCompared: dates.length,
          totalSlots: comparisons.reduce((sum, c) => sum + c.slots.length, 0),
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error: any) {
    log.error({ err: error }, 'Error comparing slots:');
    res.status(500).json({
      error: 'Failed to compare slots',
      message: error.message
    });
  }
});

/**
 * POST /api/slots/interaction
 * Record user interaction with slot suggestion (accept/reject)
 */
router.post('/interaction', authenticate, async (req: Request, res: Response) => {
  try {
    const { clientId, salonId, slotTime, accepted } = req.body;

    // Validate required fields
    if (!clientId || !salonId || !slotTime || typeof accepted !== 'boolean') {
      return res.status(400).json({
        error: 'Missing required fields: clientId, salonId, slotTime, accepted'
      });
    }

    await slotSuggestionService.recordInteraction(
      clientId,
      salonId,
      new Date(slotTime),
      accepted
    );

    res.json({
      success: true,
      message: 'Interaction recorded successfully'
    });
  } catch (error: any) {
    log.error({ err: error }, 'Error recording interaction:');
    res.status(500).json({
      error: 'Failed to record interaction',
      message: error.message
    });
  }
});

/**
 * GET /api/slots/interaction-history
 * Get client's slot interaction history for preference learning
 */
router.get('/interaction-history', authenticate, async (req: Request, res: Response) => {
  try {
    const { clientId, salonId, limit } = req.query;

    // Validate required fields
    if (!clientId || !salonId) {
      return res.status(400).json({
        error: 'Missing required fields: clientId, salonId'
      });
    }

    const history = await slotSuggestionService.getClientInteractionHistory(
      clientId as string,
      salonId as string,
      limit ? parseInt(limit as string) : 50
    );

    res.json({
      success: true,
      data: {
        history,
        metadata: {
          totalRecords: history.length,
          acceptanceRate: history.length > 0
            ? (history.filter(h => h.accepted).length / history.length * 100).toFixed(1) + '%'
            : 'N/A'
        }
      }
    });
  } catch (error: any) {
    log.error({ err: error }, 'Error getting interaction history:');
    res.status(500).json({
      error: 'Failed to get interaction history',
      message: error.message
    });
  }
});

export default router;
