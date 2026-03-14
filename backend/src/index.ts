// Load .env only for local development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}


import express from 'express';
import http from 'http';
import cors from 'cors';

// Now import modules that depend on env vars
import pool from './config/db';
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
import diagnostics from './routes/diagnostics';
import posRoutes from './routes/posRoutes';
import revenueRoutes from './routes/revenueRoutes';
import aiRoutes from './routes/aiRoutes';
import activityRoutes from './routes/activityRoutes';
import authRoutes from './routes/authRoutes';
import upsellRoutes from './routes/upsellRoutes';
import aiConciergeRoutes from './routes/aiConciergeRoutes';
import revenueActionRoutes from './routes/revenueActionRoutes';
import settingsRoutes from './routes/settingsRoutes';
import notificationRoutes from './routes/notificationRoutes';
import clientBookingRoutes from './routes/clientBookingRoutes';
import staffWorkspaceRoutes from './routes/staffWorkspaceRoutes';
import { webSocketService } from './services/WebSocketService';
import { twilioWebhook } from './webhooks/twilio';
import { loadSecrets } from './config/secrets';
import { startTelemetry } from './config/telemetry';
import redis from './config/redis';
import { RevenueScheduler } from './services/RevenueScheduler';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/clients', clientRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/products', productRoutes);
app.use('/api/salon', salonRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/diagnostics', diagnostics);
app.use('/api/pos', posRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upsell', upsellRoutes);
app.use('/api/ai-concierge', aiConciergeRoutes);
app.use('/api/revenue-actions', revenueActionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/client', clientBookingRoutes);
app.use('/api/staff', staffWorkspaceRoutes);
app.use('/webhooks/twilio', twilioWebhook);

// Initialize services
async function startServer() {
  try {
    console.log('🔐 Loading secrets from Secret Manager...');
    await loadSecrets();
    
    console.log('📊 Starting OpenTelemetry...');
    startTelemetry();
    console.log('✅ OpenTelemetry started');
    
    console.log('⚡ Connecting Redis...');
    await redis.ping();
    console.log('✅ Redis connected');
    
    // Test database connection (non-fatal for Cloud Run startup)
    try {
      const client = await pool.connect();
      console.log('✅ PostgreSQL connected');
    } catch (dbErr: any) {
      console.warn('⚠️ PostgreSQL connection deferred:', dbErr.message);
      console.log('Server will start and retry DB connection on first request');
    }
    
    const server = http.createServer(app);

    // Initialize WebSocket server
    webSocketService.initialize(server);

    server.listen(PORT, () => {
      console.log(`🚀 JH Salon Twin Backend running on port ${PORT}`);
      console.log(`🔌 WebSocket server available at ws://localhost:${PORT}/ws`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
