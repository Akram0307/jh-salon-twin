// Load .env only for local development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

console.log('[STARTUP] 1. Loading modules...');

import express from 'express';
import http from 'http';
import cors from 'cors';
import { rateLimiter } from './middleware/rateLimiter';
import { securityHeaders } from './middleware/securityHeaders';
import clientRoutes from './routes/clientRoutes';
import clientNotesRoutes from './routes/clientNotesRoutes';
import clientSearchRoutes from './routes/clientSearchRoutes';
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
import feedbackRoutes from './routes/feedbackRoutes';
import aiConciergeRoutes from './routes/aiConciergeRoutes';
import revenueActionRoutes from './routes/revenueActionRoutes';
import settingsRoutes from './routes/settingsRoutes';
import userProfileRoutes from './routes/userProfileRoutes';
import salonSettingsRoutes from './routes/salonSettingsRoutes';
import staffProfileRoutes from './routes/staffProfileRoutes';
import healthRoutes from './routes/healthRoutes';
import notificationRoutes from './routes/notificationRoutes';
import clientBookingRoutes from './routes/clientBookingRoutes';
import staffWorkspaceRoutes from './routes/staffWorkspaceRoutes';
import appointmentStatusRoutes from './routes/appointmentStatusRoutes';
import { webSocketService } from './services/WebSocketService';
import { requestLogger, notFoundHandler } from './middleware/requestLogger';
import { loadSecrets } from './config/secrets';
import { startTelemetry } from './config/telemetry';
import { RevenueScheduler, startBackgroundJobs } from './services/RevenueScheduler';
import actionHistoryRoutes from './routes/actionHistoryRoutes';
import paymentRoutes from './routes/paymentRoutes';
import { errorTracking } from './middleware/errorTracking';
import adminErrorRoutes from './routes/adminErrors';
import exportRoutes from './routes/exportRoutes';
import { performanceMiddleware, getHealthStatus } from './config/monitoring';

console.log('[STARTUP] 2. Modules loaded');

// Crash detection - log any uncaught errors
process.on('uncaughtException', (err) => {
  console.error('[CRASH] Uncaught Exception:', err);
  console.error('[CRASH] Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRASH] Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 8080;

console.log('[STARTUP] 3. Configuring middleware...');
console.log('[STARTUP] NODE_ENV:', process.env.NODE_ENV);
console.log('[STARTUP] PORT:', PORT);

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.warn('[STARTUP] Warning: Missing environment variables:', missingEnvVars.join(', '));
}

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [];
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));
app.use(express.json());
app.use(rateLimiter);
app.use(securityHeaders);
app.use(performanceMiddleware);
app.use(requestLogger);

console.log('[STARTUP] 4. Middleware configured');

// Health check - responds immediately
app.get('/health', (req: any, res: any) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/health/detailed', (req, res) => {
  res.json(getHealthStatus());
});

console.log('[STARTUP] 5. Registering routes...');

// Routes
app.use('/api/clients', clientRoutes);
app.use('/api/clients', clientNotesRoutes);
app.use('/api/clients', clientSearchRoutes);
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
app.use('/api/feedback', feedbackRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/ai-concierge', aiConciergeRoutes);
app.use('/api/revenue-actions', revenueActionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/user-profile', userProfileRoutes);
app.use('/api/salon-settings', salonSettingsRoutes);
app.use('/api/staff-profile', staffProfileRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', actionHistoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/client', clientBookingRoutes);
app.use('/api/staff', staffWorkspaceRoutes);
app.use('/api/appointments', appointmentStatusRoutes);
app.use('/api/admin/errors', adminErrorRoutes);
app.use('/api/exports', exportRoutes);
app.use(notFoundHandler);
app.use(errorTracking);

console.log('[STARTUP] 6. Routes registered');

const server = http.createServer(app);

console.log('[STARTUP] 7. Initializing WebSocket...');
webSocketService.initialize(server);

if (process.env.OTEL_ENABLED === 'true') {
  startTelemetry();
}

console.log('[STARTUP] 8. Starting server on port', PORT);

server.listen(PORT, () => {
  console.log(`[STARTUP] ✓ Server listening on port ${PORT}`);
  console.log(`[STARTUP] Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Load secrets asynchronously (non-blocking)
  loadSecrets().then(() => {
    console.log('[STARTUP] Secrets loaded');
  }).catch(err => {
    console.error('[STARTUP] Failed to load secrets:', err);
  });
  
  // Background jobs after server starts (delayed to ensure server is ready)
  setTimeout(() => {
    console.log('[STARTUP] Initializing background jobs...');
    try {
      const revenueScheduler = new RevenueScheduler();
      revenueScheduler.start(process.env.SALON_ID || 'salon_1');
      startBackgroundJobs();
      console.log('[STARTUP] Background jobs initialized');
    } catch (err) {
      console.error('[STARTUP] Background job init error (non-fatal):', err);
    }
  }, 2000);
});

server.on('error', (err) => {
  console.error('[STARTUP] Server error:', err);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down...');
  server.close(() => process.exit(0));
});
