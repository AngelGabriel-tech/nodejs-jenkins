#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const pidDir = path.join(__dirname, '..', 'tmp');
const pidFile = path.join(pidDir, 'server.pid');
const outLog = path.join(__dirname, '..', 'server.out.log');
const errLog = path.join(__dirname, '..', 'server.err.log');

function isRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

if (!fs.existsSync(pidDir)) fs.mkdirSync(pidDir, { recursive: true });

if (fs.existsSync(pidFile)) {
  try {
    const existingPid = parseInt(fs.readFileSync(pidFile, 'utf8'), 10);
    if (existingPid && isRunning(existingPid)) {
      console.log(`Server already running with pid ${existingPid}`);
      process.exit(0);
    }
  } catch (e) {
    // ignore and continue
  }
}

const nodeCmd = process.execPath; // path to node
const serverScript = path.join(__dirname, '..', 'app', 'server.js');

const out = fs.openSync(outLog, 'a');
const err = fs.openSync(errLog, 'a');

const child = spawn(nodeCmd, [serverScript], {
  detached: true,
  stdio: ['ignore', out, err]
});

child.unref();

fs.writeFileSync(pidFile, String(child.pid), { encoding: 'utf8' });
console.log(`Started server (pid=${child.pid}). Logs: ${outLog}, ${errLog}`);
process.exit(0);
