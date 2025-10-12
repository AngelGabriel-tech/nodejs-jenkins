const express = require('express');
const pino = require('pino');

const app = express();

const logger = pino({
    level: 'info',
    timestamp: () => `,"time":"${new Date().toISOString()}"`
});

logger.info('hello elastic world');
logger.info('This is some great stuff');
logger.info('Some more entries for our logging');
logger.info('another line');
logger.info('This never stops');
logger.info('Logging logging all the way');
logger.info('I think this is enough');
logger.info('nope, one more!');

// Add a basic route
app.get('/', (req, res) => {
    logger.info('Received request to root path');
    res.json({
        message: 'Hello from Node.js app deployed from Nexus!',
        timestamp: new Date().toISOString(),
        version: '1.0.2',
        status: 'running'
    });
});

// Add a health check route
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.listen(3000, function () {
    logger.info("app listening on port 3000!");
});
