/**
 * Simple Bot Test - Debug Loop Issue
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN not found!');
    process.exit(1);
}

console.log('🔧 Starting simple bot test...');

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Simple message counter to detect loops
let messageCount = 0;
const startTime = Date.now();

// Basic message handler
bot.on('message', (msg) => {
    messageCount++;
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text;
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    console.log(`[${elapsed}s] Message #${messageCount} from ${userId}: ${text}`);
    
    // Prevent spam/loops
    if (messageCount > 10) {
        console.log('⚠️ Too many messages - stopping to prevent loop');
        bot.stopPolling();
        process.exit(1);
    }
    
    // Simple response
    if (text === '/test') {
        bot.sendMessage(chatId, `✅ Bot working! Message count: ${messageCount}`);
    }
});

// Error handlers
bot.on('polling_error', (error) => {
    console.error('❌ Polling error:', error.message);
});

bot.on('error', (error) => {
    console.error('❌ Bot error:', error.message);
});

// Safety timeout
setTimeout(() => {
    console.log(`⏰ Safety timeout reached - Messages processed: ${messageCount}`);
    bot.stopPolling();
    process.exit(0);
}, 30000); // 30 seconds

console.log('✅ Simple bot started - send /test to verify');
console.log('⏰ Will auto-stop in 30 seconds or after 10 messages');