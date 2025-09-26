/**
 * Quick bot test with error catching
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Add comprehensive error handling
bot.on('polling_error', (error) => {
    console.error('🚨 Polling error:', error.code, error.message);
    if (error.response) {
        console.error('Response status:', error.response.statusCode);
        console.error('Response body:', error.response.body);
    }
});

bot.on('error', (error) => {
    console.error('🚨 Bot error:', error);
});

// Catch all uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Simple test message handler
bot.on('message', (msg) => {
    console.log('📨 Message received:', msg.text);
    bot.sendMessage(msg.chat.id, 'Bot is working! ✅');
});

console.log('🤖 Quick test bot started...');
console.log('📱 Send a message to test basic functionality');