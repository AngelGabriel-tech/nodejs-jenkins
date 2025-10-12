const express = require('express');
const path = require('path');
const pino = require('pino');

const app = express();

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    timestamp: () => `,"time":"${new Date().toISOString()}"`
});

// Basic log lines for demonstration / tutorial
logger.info('hello elastic world');
logger.info('This is some great stuff');
logger.info('Some more entries for our logging');

// Serve static files from app/public
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// JSON body parsing for API endpoints
app.use(express.json());

// Root route serves the static index.html automatically from public/
app.get('/api/info', (req, res) => {
    logger.info('Received request to /api/info');
    res.json({
        message: 'Hello from Node.js app deployed from Nexus!',
        timestamp: new Date().toISOString(),
        version: '1.0.3',
        status: 'running'
    });
});

// Health check route
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Endpoint that returns a sample Jenkinsfile (for teaching/demo)
app.get('/api/jenkinsfile', (req, res) => {
    logger.info('Serving Jenkinsfile content');
    res.type('text/plain');
    res.send(`pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                echo 'Building...'
            }
        }
        stage('Test') {
            steps {
                echo 'Testing...'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying...'
            }
        }
    }
}`);
});

// A simple endpoint to simulate triggering a Jenkins pipeline (for demos)
app.post('/api/trigger-pipeline', (req, res) => {
    const payload = req.body || {};
    logger.info({ payload }, 'Received pipeline trigger request');

    // In a real setup you'd call Jenkins API here. For teaching, we just echo back.
    res.json({
        status: 'queued',
        received: payload,
        timestamp: new Date().toISOString()
    });
});

// Serve a minimal Jenkins tutorial page from /jenkins (file in public/jenkins.html)
app.get('/jenkins', (req, res) => {
    res.sendFile(path.join(publicDir, 'jenkins.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    logger.info(`app listening on port ${PORT}!`);
});
