// SalonOS Backend Entrypoint
// Combines bootstrap error handling with application startup
// (Dockerfile copies this file but not bootstrap.js, so logic is inlined)

process.on('uncaughtException', (err) => {
  console.error('[BOOTSTRAP FATAL] Uncaught Exception during startup:');
  console.error('[BOOTSTRAP FATAL] Error:', err.message);
  console.error('[BOOTSTRAP FATAL] Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[BOOTSTRAP FATAL] Unhandled Rejection during startup:');
  console.error('[BOOTSTRAP FATAL] Reason:', reason);
  process.exit(1);
});

console.log('[BOOTSTRAP] Starting SalonOS backend...');
console.log('[BOOTSTRAP] NODE_ENV:', process.env.NODE_ENV);
console.log('[BOOTSTRAP] PORT:', process.env.PORT);
console.log('[BOOTSTRAP] JWT_SECRET set:', !!process.env.JWT_SECRET, 'length:', process.env.JWT_SECRET?.length || 0);
console.log('[BOOTSTRAP] REFRESH_TOKEN_SECRET set:', !!process.env.REFRESH_TOKEN_SECRET, 'length:', process.env.REFRESH_TOKEN_SECRET?.length || 0);
console.log('[BOOTSTRAP] DB_USER set:', !!process.env.DB_USER);
console.log('[BOOTSTRAP] DB_HOST set:', !!process.env.DB_HOST);
console.log('[BOOTSTRAP] DB_NAME set:', !!process.env.DB_NAME);
console.log('[BOOTSTRAP] REDIS_HOST set:', !!process.env.REDIS_HOST);
console.log('[BOOTSTRAP] INSTANCE_CONNECTION_NAME set:', !!process.env.INSTANCE_CONNECTION_NAME);

try {
  require('./dist/index.js');
} catch (err) {
  console.error('[BOOTSTRAP FATAL] Failed to load application:');
  console.error('[BOOTSTRAP FATAL] Error:', err.message);
  console.error('[BOOTSTRAP FATAL] Stack:', err.stack);
  process.exit(1);
}
