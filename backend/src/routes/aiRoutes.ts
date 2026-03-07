import { Router } from 'express';
import { DemandForecastService } from '../services/DemandForecastService';
import { ServicePopularityService } from '../services/ServicePopularityService';
import { DynamicOfferGenerator } from '../services/DynamicOfferGenerator';
import { query } from '../config/db';

const router = Router();
const DEFAULT_SALON_ID = process.env.SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';

// Fetch demand forecast (for dashboard)
router.get('/forecast', async (req, res) => {
  try {
    const salonId = String(req.query.salonId || DEFAULT_SALON_ID || '');

    const result = await query(
      `
      SELECT service_id, forecast_date, predicted_demand, confidence_score
      FROM demand_forecasts
      WHERE salon_id = $1
      ORDER BY forecast_date ASC
      LIMIT 50
    `,
      [salonId]
    );

    res.json({
      success: true,
      forecast: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Forecast fetch failed' });
  }
});

router.get('/campaigns', async (req, res) => {
  const salonId = String(req.query.salonId || DEFAULT_SALON_ID);
  try {
    const result = await query(
      `
      SELECT
        id,
        salon_id,
        client_id,
        service_id,
        offer_discount,
        sent_at,
        claimed_at,
        CASE WHEN claimed_at IS NULL THEN 'active' ELSE 'completed' END AS status
      FROM ai_campaigns
      WHERE salon_id = $1
      ORDER BY sent_at DESC NULLS LAST, id DESC
      LIMIT 50
      `,
      [salonId]
    );

    res.json({ campaigns: result.rows });
  } catch (err: any) {
    console.error('AI campaigns fetch error:', err);
    res.json({ campaigns: [] });
  }
});

router.post('/campaigns/:id/pause', async (req, res) => {
  res.json({ success: true, id: req.params.id, status: 'paused' });
});

router.post('/campaigns/:id/resume', async (req, res) => {
  res.json({ success: true, id: req.params.id, status: 'active' });
});

// Generate demand forecast
router.post('/forecast', async (req, res) => {
  try {
    const salonId = req.body.salonId || process.env.SALON_ID;

    const forecastService = new DemandForecastService();
    await forecastService.generateSimpleForecast(salonId || '');

    res.json({
      success: true,
      message: 'Demand forecast generated',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Forecast generation failed' });
  }
});

// Recompute service popularity
router.post('/recompute-popularity', async (req, res) => {
  try {
    const salonId = req.body.salonId || process.env.SALON_ID;

    const popularity = new ServicePopularityService();
    await popularity.recomputePopularity(salonId);

    res.json({
      success: true,
      message: 'Service popularity updated',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Popularity recompute failed' });
  }
});

// Generate AI offer for a client
router.post('/generate-offer', async (req, res) => {
  try {
    const { salonId, clientId, serviceId } = req.body;

    const generator = new DynamicOfferGenerator();

    const offer = await generator.generateOffer(
      salonId || process.env.SALON_ID,
      clientId,
      serviceId
    );

    res.json({ offer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Offer generation failed' });
  }
});

export default router;
