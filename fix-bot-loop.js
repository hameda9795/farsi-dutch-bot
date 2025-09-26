/**
 * Fix Bot Loop Issue - Stop all webhooks and polling
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

console.log('🔧 Fixing bot loop issue...');

async function fixBotLoop() {
    try {
        // Create bot without polling
        const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
        
        console.log('📋 Getting current webhook info...');
        const webhookInfo = await bot.getWebHookInfo();
        console.log('Webhook info:', webhookInfo);
        
        if (webhookInfo.url) {
            console.log('🗑️ Removing webhook...');
            await bot.deleteWebHook();
            console.log('✅ Webhook removed');
        } else {
            console.log('ℹ️ No webhook found');
        }
        
        console.log('🔄 Getting bot updates to clear queue...');
        const updates = await bot.getUpdates();
        console.log(`📨 Found ${updates.length} pending updates`);
        
        if (updates.length > 0) {
            console.log('🗑️ Clearing update queue...');
            const lastUpdateId = updates[updates.length - 1].update_id;
            await bot.getUpdates({ offset: lastUpdateId + 1 });
            console.log('✅ Update queue cleared');
        }
        
        console.log('✅ Bot loop issue fixed!');
        console.log('Now you can safely restart the bot');
        
    } catch (error) {
        console.error('❌ Error fixing bot loop:', error.message);
    }
}

fixBotLoop();