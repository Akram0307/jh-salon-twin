// MINIMAL TEST: Does the container environment allow listening on PORT?
const http = require('http');
const port = process.env.PORT || 8080;

console.log('[MINIMAL] Node version:', process.version);
console.log('[MINIMAL] Platform:', process.platform, process.arch);
console.log('[MINIMAL] PORT:', port);
console.log('[MINIMAL] NODE_ENV:', process.env.NODE_ENV);
console.log('[MINIMAL] CWD:', process.cwd());
console.log('[MINIMAL] Starting minimal HTTP server...');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', test: 'minimal' }));
});

server.listen(port, () => {
  console.log('[MINIMAL] ✓ LISTENING on port', port);
});

server.on('error', (err) => {
  console.error('[MINIMAL] Server error:', err.message);
  process.exit(1);
});
