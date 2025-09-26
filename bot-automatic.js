/**
 * Farsi-Dutch Telegram Bot - AUTOMATIC MEMBERSHIP VERSION
 * Bot is admin of @parsibrug channel - Real-time membership checking
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const ClaudeService = require('./services/claudeService');
const config = require('./config');
const { analyzeInput } = require('./utils/inputDetection');
const { extractWords, detectLanguage } = require('./utils/extractWords');
const { fetchWordData } = require('./utils/fetchWordData');
const { startAutoCleanup, manualCleanup } = require('./utils/autoCleanup');
const {
    formatDictionaryResponse,
    formatTranslationResponse,
    formatComprehensiveTranslation,
    formatErrorMessage,
    formatInputNotRecognizedMessage,
    getHelpMessage,
    getWelcomeMessage,
    formatQuizResponse,
    formatGrammarResponse,
    formatTestResponse,
    formatSingleTestResponse
} = require('./utils/messageFormatter');

// Import State module for saving translations
const { loadState, saveState, addWord, addWordsFromExtraction, getRandomWords, setCurrentTest, updateTestScore, clearCurrentTest, getVocabularyStats } = require('./lib/state');

// Environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

if (!TELEGRAM_BOT_TOKEN || !CLAUDE_API_KEY) {
    console.error('❌ Error: Missing required environment variables!');
    console.error('Please make sure TELEGRAM_BOT_TOKEN and CLAUDE_API_KEY are set in your .env file');
    process.exit(1);
}

// Initialize services
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
const claudeService = new ClaudeService(CLAUDE_API_KEY);

// Constants
const MAX_INPUT_LENGTH = config.BEHAVIOR.MAX_INPUT_LENGTH;
const CHANNEL_USERNAME = config.CHANNEL_MEMBERSHIP.CHANNEL_USERNAME;
const CHANNEL_LINK = config.CHANNEL_MEMBERSHIP.CHANNEL_LINK;

// User mode storage
const userModes = new Map();

// AUTOMATIC MEMBERSHIP SYSTEM (Bot is admin of channel)
const membershipCache = new Map(); // Real-time cache for instant access
const adminMode = true; // Bot has admin privileges in @parsibrug

console.log('🚀 AUTOMATIC MEMBERSHIP SYSTEM ENABLED');
console.log('✅ Bot is admin of @parsibrug channel');
console.log('✅ Real-time membership checking active');
console.log('✅ Instant blocking for non-members enabled\n');

/**
 * AUTOMATIC MEMBERSHIP CHECKER (Admin Mode)
 * Real-time checking with instant blocking
 */
async function checkMembershipAuto(userId, chatId = null) {
    if (!config.CHANNEL_MEMBERSHIP.REQUIRED) {
        return true;
    }

    try {
        console.log(`🔍 [AUTO] Real-time check for user ${userId}...`);
        
        // Direct API check (bot is admin, no limitations)
        const member = await bot.getChatMember(CHANNEL_USERNAME, userId);
        const isMember = ['creator', 'administrator', 'member'].includes(member.status);
        
        // Update real-time cache
        membershipCache.set(userId, {
            isMember,
            lastChecked: new Date(),
            status: member.status
        });
        
        console.log(`✅ [AUTO] User ${userId}: ${isMember ? 'MEMBER' : 'NOT MEMBER'} (${member.status})`);
        
        // Instant action for non-members
        if (!isMember && chatId) {
            console.log(`⚡ [AUTO] INSTANT BLOCK - User ${userId} not in channel`);
            
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
        
        // Even with admin privileges, show membership message on error
        if (chatId) {
            await bot.sendMessage(chatId, 
                `⚠️ خطا در بررسی عضویت\n` +
                `لطفاً مطمئن شوید که عضو کانال هستید:\n` +
                `👈 ${CHANNEL_LINK}`, 
                { 
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '🔗 عضویت در کانال', url: CHANNEL_LINK }
                        ]]
                    }
                }
            );
        }
        return false;
    }
}

/**
 * Middleware for all messages - Automatic membership enforcement
 */
async function membershipMiddleware(msg, next) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    
    // Check membership automatically (real-time)
    const isMember = await checkMembershipAuto(userId, chatId);
    
    if (!isMember) {
        console.log(`🚫 [AUTO] Access denied for user ${userId} - not a channel member`);
        return; // Block execution
    }
    
    // User is member, continue processing
    console.log(`✅ [AUTO] Access granted for user ${userId} - channel member verified`);
    next();
}

/**
 * Process user message with automatic membership checking
 */
async function processMessage(msg) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const messageText = msg.text;
    
    console.log(`📨 Processing message from user ${userId}: "${messageText}"`);
    
    try {
        // Admin commands (bypass all checks)
        if (userId === 741378837) { // Admin user
            if (messageText === '/status') {
                const stats = membershipCache.size;
                await bot.sendMessage(chatId, 
                    `🤖 <b>Bot Status - Automatic Mode</b>\n\n` +
                    `✅ Admin privileges: Active\n` +
                    `✅ Real-time checking: Enabled\n` +
                    `✅ Instant blocking: Active\n` +
                    `📊 Cached users: ${stats}\n` +
                    `🔗 Channel: ${CHANNEL_USERNAME}`, 
                    { parse_mode: 'HTML' }
                );
                return;
            }
        }
        
        // Handle special commands
        if (messageText === '/start') {
            await bot.sendMessage(chatId, getWelcomeMessage(), { parse_mode: 'HTML' });
            return;
        }
        
        if (messageText === '/help') {
            await bot.sendMessage(chatId, getHelpMessage(), { parse_mode: 'HTML' });
            return;
        }
        
        // Process regular messages (translation, etc.)
        const inputAnalysis = analyzeInput(messageText);
        
        if (inputAnalysis.type === 'command') {
            await handleCommand(msg, inputAnalysis);
        } else if (inputAnalysis.type === 'text') {
            await handleTextMessage(msg, inputAnalysis);
        } else {
            await bot.sendMessage(chatId, formatInputNotRecognizedMessage(), { parse_mode: 'HTML' });
        }
        
    } catch (error) {
        console.error('Error processing message:', error);
        await bot.sendMessage(chatId, formatErrorMessage(), { parse_mode: 'HTML' });
    }
}

/**
 * Handle callback queries (inline keyboard buttons)
 */
bot.on('callback_query', async (callbackQuery) => {
    const userId = callbackQuery.from.id;
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    
    console.log(`🔘 Callback from user ${userId}: ${data}`);
    
    try {
        // Check membership button
        if (data === 'check_membership') {
            const isMember = await checkMembershipAuto(userId, chatId);
            
            if (isMember) {
                await bot.editMessageText(
                    `✅ <b>عضویت تأیید شد!</b>\n\n` +
                    `اکنون می‌توانید از تمامی امکانات ربات استفاده کنید.\n` +
                    `برای شروع /help را ارسال کنید.`,
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
            return;
        }
        
        // Other callback queries need membership check
        const isMember = await checkMembershipAuto(userId);
        if (!isMember) {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: '🔒 ابتدا عضو کانال شوید',
                show_alert: true
            });
            return;
        }
        
        // Process other callbacks...
        await bot.answerCallbackQuery(callbackQuery.id);
        
    } catch (error) {
        console.error('Error handling callback query:', error);
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: '❌ خطا در پردازش درخواست',
            show_alert: true
        });
    }
});

/**
 * Main message handler with automatic membership middleware
 */
bot.on('message', async (msg) => {
    await membershipMiddleware(msg, async () => {
        await processMessage(msg);
    });
});

// Placeholder functions (simplified for demo)
async function handleCommand(msg, analysis) {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, `Command processed: ${analysis.content}`);
}

async function handleTextMessage(msg, analysis) {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, `Text processed: ${analysis.content}`);
}

// Error handling
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down bot...');
    bot.stopPolling();
    process.exit(0);
});

console.log('🤖 Farsi-Dutch Bot started with AUTOMATIC MEMBERSHIP SYSTEM!');
console.log('🔒 Real-time channel membership enforcement active');
console.log(`📱 Monitoring channel: ${CHANNEL_USERNAME}`);