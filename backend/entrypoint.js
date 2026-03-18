// Container entrypoint with full diagnostics
console.log('[ENTRY] Starting SalonOS container...');
console.log('[ENTRY] NODE_ENV:', process.env.NODE_ENV);
console.log('[ENTRY] PORT:', process.env.PORT);
console.log('[ENTRY] JWT_SECRET set:', !!process.env.JWT_SECRET, 'len:', process.env.JWT_SECRET?.length || 0);
console.log('[ENTRY] DB_USER set:', !!process.env.DB_USER);
console.log('[ENTRY] DB_HOST set:', !!process.env.DB_HOST);
console.log('[ENTRY] DB_NAME set:', !!process.env.DB_NAME);
console.log('[ENTRY] REDIS_HOST set:', !!process.env.REDIS_HOST);
console.log('[ENTRY] INSTANCE_CONNECTION_NAME set:', !!process.env.INSTANCE_CONNECTION_NAME);
console.log('[ENTRY] OTEL_ENABLED:', process.env.OTEL_ENABLED);
console.log('[ENTRY] Node version:', process.version);
console.log('[ENTRY] Platform:', process.platform, process.arch);
console.log('[ENTRY] CWD:', process.cwd());
console.log('[ENTRY] About to require dist/index.js...');

process.on('uncaughtException', (err) => {
  console.error('[ENTRY FATAL] Uncaught Exception:', err.message);
  console.error('[ENTRY FATAL] Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[ENTRY FATAL] Unhandled Rejection:', reason);
  process.exit(1);
});

try {
  require('./dist/index.js');
  console.log('[ENTRY] require() returned successfully');
} catch (err) {
  console.error('[ENTRY FATAL] Failed to require dist/index.js:', err.message);
  console.error('[ENTRY FATAL] Stack:', err.stack);
  process.exit(1);
}
