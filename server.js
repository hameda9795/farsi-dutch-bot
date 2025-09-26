/**
 * HTTP Server for Render.com deployment
 * This creates a simple HTTP server that keeps the service alive on Render
 * Enhanced with Keep-Alive service to prevent sleeping
 */

require('dotenv').config();
const express = require('express');
const bot = require('./bot');
const KeepAliveService = require('./utils/keepAliveService');

const app = express();
const PORT = process.env.PORT || 3000;

// Keep-alive service configuration
let keepAliveService = null;
const RENDER_URL = process.env.RENDER_URL || `http://localhost:${PORT}`;
const KEEP_ALIVE_ENABLED = process.env.KEEP_ALIVE_ENABLED !== 'false'; // Default enabled

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'Bot is running! 🤖',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        keepAlive: keepAliveService ? keepAliveService.getStatus() : null
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        bot_status: 'running',
        timestamp: new Date().toISOString(),
        keepAlive: keepAliveService ? keepAliveService.getStatus() : null
    });
});

// Keep-alive endpoint (for external pinging)
app.get('/keep-alive', (req, res) => {
    res.json({
        status: 'alive',
        message: 'Service is active',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        keepAlive: keepAliveService ? keepAliveService.getStatus() : null
    });
});

// Keep-alive status endpoint
app.get('/keep-alive/status', (req, res) => {
    if (keepAliveService) {
        res.json({
            status: 'success',
            keepAlive: keepAliveService.getStatus(),
            config: {
                url: RENDER_URL,
                enabled: KEEP_ALIVE_ENABLED,
                interval: '10 minutes'
            }
        });
    } else {
        res.json({
            status: 'not_initialized',
            message: 'Keep-alive service not initialized'
        });
    }
});

// Bot info endpoint
app.get('/status', (req, res) => {
    res.json({
        bot_name: 'Farsi-Dutch Translation Bot',
        status: 'active',
        description: 'Telegram bot for translating between Farsi and Dutch using Claude API',
        uptime: `${Math.floor(process.uptime())} seconds`,
        memory_usage: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 HTTP Server is running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🏓 Keep-alive: http://localhost:${PORT}/keep-alive`);
    
    // Initialize and start keep-alive service if enabled
    if (KEEP_ALIVE_ENABLED) {
        console.log('🚀 Initializing keep-alive service...');
        
        // Wait a bit for server to be fully ready
        setTimeout(() => {
            keepAliveService = new KeepAliveService(RENDER_URL + '/keep-alive', {
                interval: 10 * 60 * 1000, // 10 minutes
                timeout: 30000, // 30 seconds
                maxRetries: 3,
                retryDelay: 5000 // 5 seconds
            });
            
            keepAliveService.start();
            console.log('✅ Keep-alive service initialized and started');
        }, 5000); // Wait 5 seconds after server start
    } else {
        console.log('⚠️  Keep-alive service disabled');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📴 Received SIGTERM. Graceful shutdown...');
    if (keepAliveService) {
        console.log('⏹️  Stopping keep-alive service...');
        keepAliveService.stop();
    }
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('📴 Received SIGINT. Graceful shutdown...');
    if (keepAliveService) {
        console.log('⏹️  Stopping keep-alive service...');
        keepAliveService.stop();
    }
    process.exit(0);
});