/**
 * HTTP Server for local development
 * Simple HTTP server for testing bot functionality
 */

require('dotenv').config();
const express = require('express');
const bot = require('./bot');

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'Bot is running! 🤖',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        bot_status: 'running',
        timestamp: new Date().toISOString()
    });
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
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📴 Received SIGTERM. Graceful shutdown...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('📴 Received SIGINT. Graceful shutdown...');
    process.exit(0);
});