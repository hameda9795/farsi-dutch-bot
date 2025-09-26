/**
 * Fixed Farsi-Dutch Bot - No Loop Issue
 * Simple version with automatic membership checking
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_USERNAME = config.CHANNEL_MEMBERSHIP.CHANNEL_USERNAME;
const CHANNEL_LINK = config.CHANNEL_MEMBERSHIP.CHANNEL_LINK;

if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN not found!');
    process.exit(1);
}

console.log('🚀 FIXED AUTOMATIC MEMBERSHIP SYSTEM');
console.log('✅ Bot is admin of @parsibrug channel');
console.log('✅ Real-time membership checking active\n');

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Simple membership cache
const membershipCache = new Map();

/**
 * Check membership automatically (admin mode)
 */
async function checkMembershipAuto(userId, chatId = null) {
    if (!config.CHANNEL_MEMBERSHIP.REQUIRED) {
        return true;
    }

    try {
        console.log(`🔍 [AUTO] Checking user ${userId}...`);
        
        const member = await bot.getChatMember(CHANNEL_USERNAME, userId);
        const isMember = ['creator', 'administrator', 'member'].includes(member.status);
        
        // Update cache
        membershipCache.set(userId, {
            isMember,
            lastChecked: new Date(),
            status: member.status
        });
        
        console.log(`✅ [AUTO] User ${userId}: ${isMember ? 'MEMBER' : 'NOT MEMBER'} (${member.status})`);
        
        // Send membership message for non-members
        if (!isMember && chatId) {
            console.log(`⚡ [AUTO] Sending membership message to user ${userId}`);
            
            await bot.sendMessage(chatId, 
                `🔒 <b>دسترسی محدود شده</b>\n\n` +
                `برای استفاده از ربات باید عضو کانال باشید:\n` +
                `👈 ${CHANNEL_LINK}\n\n` +
                `پس از عضویت، دوباره تلاش کنید.`, 
                { 
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '🔗 عضویت در کانال', url: CHANNEL_LINK },
                            { text: '🔄 بررسی مجدد', callback_data: 'check_membership' }
                        ]]
                    }
                }
            );
            return false;
        }
        
        return isMember;
        
    } catch (error) {
        console.error('❌ [AUTO] Membership check failed:', error.message);
        return false;
    }
}

// Simple message counter to prevent loops
let messageCount = 0;
const startTime = Date.now();

/**
 * Main message handler
 */
bot.on('message', async (msg) => {
    messageCount++;
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Safety check to prevent infinite loops
    if (messageCount > 100) {
        console.log('⚠️ Too many messages - possible loop detected');
        return;
    }
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    console.log(`[${elapsed}s] Message #${messageCount} from ${userId}: ${text || 'non-text'}`);
    
    // Skip non-text messages
    if (!text) {
        return;
    }
    
    // Skip commands for now (handle separately)
    if (text.startsWith('/')) {
        if (text === '/start') {
            await bot.sendMessage(chatId, '🤖 ربات فارسی-هلندی خوش آمدگویی می‌کند!\n\nبرای استفاده از ربات باید عضو کانال باشید.');
        }
        return;
    }
    
    // Check membership for all text messages
    const isMember = await checkMembershipAuto(userId, chatId);
    
    if (!isMember) {
        console.log(`🚫 [AUTO] Access denied for user ${userId}`);
        return;
    }
    
    // User is member - simple response for now
    console.log(`✅ [AUTO] Access granted for user ${userId}`);
    await bot.sendMessage(chatId, `✅ شما عضو کانال هستید. پیام شما: "${text}"`);
});

/**
 * Handle callback queries
 */
bot.on('callback_query', async (callbackQuery) => {
    const userId = callbackQuery.from.id;
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    
    console.log(`🔘 Callback from user ${userId}: ${data}`);
    
    if (data === 'check_membership') {
        const isMember = await checkMembershipAuto(userId, chatId);
        
        if (isMember) {
            await bot.editMessageText(
                `✅ <b>عضویت تأیید شد!</b>\n\nاکنون می‌توانید از ربات استفاده کنید.`,
                {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
                    parse_mode: 'HTML'
                }
            );
        } else {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: '❌ هنوز عضو کانال نیستید',
                show_alert: true
            });
        }
    }
});

// Error handlers
bot.on('polling_error', (error) => {
    console.error('❌ Polling error:', error.message);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down bot...');
    bot.stopPolling();
    process.exit(0);
});

console.log('✅ Fixed bot started successfully!');