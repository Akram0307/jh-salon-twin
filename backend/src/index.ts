import { loadSecrets } from './config/secrets';
import { startTelemetry } from './config/telemetry';
import redis from './config/redis';
import { RevenueScheduler } from './services/RevenueScheduler'

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import clientRoutes from './routes/clientRoutes';
import ownerRoutes from './routes/ownerRoutes';
import qrRoutes from './routes/qrRoutes';
import staffRoutes from './routes/staffRoutes';
import serviceRoutes from './routes/serviceRoutes';
import waitlistRoutes from './routes/waitlistRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import chatRoutes from './routes/chatRoutes';
import onboardingRoutes from './routes/onboardingRoutes';
import productRoutes from './routes/productRoutes';
import salonRoutes from './routes/salonRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import posRoutes from './routes/posRoutes';
import revenueRoutes from './routes/revenueRoutes';
import aiRoutes from './routes/aiRoutes';
import activityRoutes from './routes/activityRoutes';
import { twilioWebhook } from './webhooks/twilio';

dotenv.config();

async function bootstrap() {
  console.log('🔐 Loading secrets from Secret Manager...');
  await loadSecrets();

  console.log('📊 Starting OpenTelemetry...');
  await startTelemetry();

  console.log('⚡ Connecting Redis...');
  try {
    await redis.connect();
  } catch (err) {
    console.warn('Redis connection failed (continuing):', err);
  }

  const app = express();
  const port = Number(process.env.PORT) || 8080;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/clients', clientRoutes);
  app.use('/api/owners', ownerRoutes);
  app.use('/api/owner', ownerRoutes);
  app.use('/api/staff', staffRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/salons', salonRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/pos', posRoutes);
  app.use('/api/revenue', revenueRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/activity', activityRoutes);
  app.use('/api/waitlist', waitlistRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/qr', qrRoutes);
  app.use('/api/onboarding', onboardingRoutes);
  app.use('/api/products', productRoutes);

  // Webhooks
  app.use('/api/webhooks/twilio', twilioWebhook);

  // Web Chat
  app.use('/api/chat', chatRoutes);

  // Health Check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.listen(port, '0.0.0.0', () => {
    console.log('🚀 JH Salon Twin Backend running on port ' + port);

    console.log('MessagingEventBus initialized')
    console.log('ConversationManager initialized')
    console.log('TwilioWhatsAppService initialized')

    const salonId = process.env.SALON_ID;

    if (salonId) {
      const scheduler = new RevenueScheduler();
      scheduler.start(salonId);
      console.log('[RevenueScheduler] RevenueScheduler started for salon: ' + salonId);
    } else {
      console.warn('[RevenueScheduler] SALON_ID not set, scheduler not started');
    }
  });
}

bootstrap();
