const net = require('net');

const client = new net.Socket();
const started = Date.now();
let finished = false;

function done(code, payload) {
  if (finished) return;
  finished = true;
  console.log(JSON.stringify(payload, null, 2));
  try { client.destroy(); } catch (_) {}
  process.exit(code);
}

client.setTimeout(3000);

client.connect(5432, '127.0.0.1', () => {
  done(0, {
    ok: true,
    stage: 'tcp_connect',
    elapsedMs: Date.now() - started,
    message: 'TCP Handshake Successful: Socket is open.'
  });
});

client.on('timeout', () => {
  done(2, {
    ok: false,
    stage: 'tcp_connect',
    elapsedMs: Date.now() - started,
    message: 'TCP Handshake Failed: Socket timed out.'
  });
});

client.on('error', (err) => {
  done(1, {
    ok: false,
    stage: 'tcp_connect',
    elapsedMs: Date.now() - started,
    message: err && err.message,
    code: err && err.code,
    errno: err && err.errno,
    syscall: err && err.syscall
  });
});
