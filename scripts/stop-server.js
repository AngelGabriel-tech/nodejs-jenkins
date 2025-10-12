#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pidFile = path.join(__dirname, '..', 'tmp', 'server.pid');

if (!fs.existsSync(pidFile)) {
  console.log('No server.pid found — server may not be running.');
  process.exit(0);
}

const pid = parseInt(fs.readFileSync(pidFile, 'utf8'), 10);
if (!pid) {
  console.log('Invalid PID file.');
  process.exit(1);
}

try {
  if (process.platform === 'win32') {
    // taskkill on Windows
    execSync(`taskkill /PID ${pid} /T /F`);
  } else {
    process.kill(pid, 'SIGTERM');
  }
  fs.unlinkSync(pidFile);
  console.log(`Stopped server (pid=${pid})`);
  process.exit(0);
} catch (e) {
  console.error('Failed to stop server:', e.message || e);
  process.exit(1);
}
