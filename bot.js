/**
 * Farsi-Dutch Telegram Bot
 * Main bot file that handles all interactions
 */

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'test') {
    require('dotenv').config({ path: '.env.test' });
} else {
    require('dotenv').config();
}
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
const { loadState, saveState, addWord, addWordsFromExtraction, getRandomWords, setCurrentTest, updateTestScore, clearCurrentTest, getVocabularyStats, getNextTestWord, getWordsForOptions, startTestSession, endTestSession } = require('./lib/state');

// Environment variables validation
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
const ContentService = require('./services/contentService');
const contentService = new ContentService(claudeService);

// Constants
const MAX_INPUT_LENGTH = config.BEHAVIOR.MAX_INPUT_LENGTH;
const CHANNEL_USERNAME = config.CHANNEL_MEMBERSHIP.CHANNEL_USERNAME;
const CHANNEL_LINK = config.CHANNEL_MEMBERSHIP.CHANNEL_LINK;

// User mode storage (in production, consider using Redis or database)
const userModes = new Map(); // userId -> { mode: 'translate'|'grammar', timestamp: Date }

// Membership cache and security tracking
const membershipCache = new Map(); // userId -> { isMember: boolean, lastChecked: Date, warnings: number }

// Manual whitelist for users when API can't check (backup solution)
const manualWhitelist = new Set([741378837]); // Set of user IDs manually approved - admin is pre-approved

// Admin mode - bot has admin access to channel for real-time checking
const adminMode = true; // Bot is admin of @parsibrug channel

console.log('🚀 AUTOMATIC MEMBERSHIP SYSTEM ENABLED');
console.log('✅ Bot is admin of @parsibrug channel');
console.log('✅ Real-time membership checking active');
console.log('✅ Instant blocking for non-members enabled\n');

/**
 * Security function to check if membership check is needed
 * @param {number} userId - User ID to check
 * @returns {boolean} - True if check is needed
 */
function needsMembershipCheck(userId) {
    if (!config.CHANNEL_MEMBERSHIP.REQUIRED) return false;
    if (config.CHANNEL_MEMBERSHIP.SECURITY.CHECK_ON_EVERY_MESSAGE) return true;
    
    const cached = membershipCache.get(userId);
    if (!cached) return true;
    
    const cacheExpiry = config.CHANNEL_MEMBERSHIP.SECURITY.CACHE_MINUTES * 60 * 1000;
    const timeSinceCheck = Date.now() - cached.lastChecked.getTime();
    
    return timeSinceCheck > cacheExpiry;
}

/**
 * Update membership cache
 * @param {number} userId - User ID
 * @param {boolean} isMember - Membership status
 */
function updateMembershipCache(userId, isMember) {
    const existing = membershipCache.get(userId) || { warnings: 0 };
    membershipCache.set(userId, {
        isMember,
        lastChecked: new Date(),
        warnings: existing.warnings
    });
}

/**
 * Safe message sending with fallback for Markdown parsing errors
 * @param {number} chatId - Chat ID
 * @param {string} text - Message text
 * @param {Object} options - Message options
 */
async function safeSendMessage(chatId, text, options = {}) {
    try {
        // First try with original options (usually includes Markdown)
        return await bot.sendMessage(chatId, text, options);
    } catch (error) {
        if (error.code === 'ETELEGRAM' && error.response.body.description.includes("can't parse entities")) {
            console.log('⚠️  Markdown parsing failed, retrying without formatting...');
            // Remove parse_mode and try again
            const safeOptions = { ...options };
            delete safeOptions.parse_mode;
            return await bot.sendMessage(chatId, text, safeOptions);
        }
        throw error; // Re-throw if it's a different error
    }
}

/**
 * Safe message editing with fallback for Markdown parsing errors
 * @param {number} chatId - Chat ID
 * @param {number} messageId - Message ID
 * @param {string} text - Message text
 * @param {Object} options - Message options
 */
async function safeEditMessage(chatId, messageId, text, options = {}) {
    try {
        // First try with original options (usually includes Markdown)
        return await bot.editMessageText(text, { 
            chat_id: chatId, 
            message_id: messageId, 
            ...options 
        });
    } catch (error) {
        if (error.code === 'ETELEGRAM' && error.response.body.description.includes("can't parse entities")) {
            console.log('⚠️  Markdown parsing failed in edit, retrying without formatting...');
            // Remove parse_mode and try again
            const safeOptions = { ...options };
            delete safeOptions.parse_mode;
            return await bot.editMessageText(text, { 
                chat_id: chatId, 
                message_id: messageId, 
                ...safeOptions 
            });
        }
        throw error; // Re-throw if it's a different error
    }
}

/**
 * Handle user who lost membership
 * @param {number} chatId - Chat ID
 * @param {number} userId - User ID
 */
async function handleMembershipLoss(chatId, userId) {
    const cached = membershipCache.get(userId) || { warnings: 0 };
    const maxWarnings = config.CHANNEL_MEMBERSHIP.SECURITY.WARNING_COUNT;
    
    if (config.CHANNEL_MEMBERSHIP.SECURITY.WARN_BEFORE_BLOCK && cached.warnings < maxWarnings) {
        // Send warning
        cached.warnings += 1;
        membershipCache.set(userId, {
            ...cached,
            lastChecked: new Date()
        });
        
        let warningMessage;
        if (cached.warnings === maxWarnings) {
            warningMessage = config.CHANNEL_MEMBERSHIP.MESSAGES.FINAL_WARNING;
        } else {
            warningMessage = config.CHANNEL_MEMBERSHIP.MESSAGES.WARNING_MESSAGE;
        }
        
        const warningKeyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: config.CHANNEL_MEMBERSHIP.MESSAGES.JOIN_BUTTON,
                            url: CHANNEL_LINK
                        }
                    ],
                    [
                        {
                            text: config.CHANNEL_MEMBERSHIP.MESSAGES.RECHECK_BUTTON,
                            callback_data: 'check_membership'
                        }
                    ]
                ]
            }
        };
        
        await safeSendMessage(chatId, warningMessage, {
            parse_mode: 'Markdown',
            ...warningKeyboard
        });
        
        return false; // Don't block yet, just warn
    } else {
        // Block user - send final message
        await safeSendMessage(chatId, config.CHANNEL_MEMBERSHIP.MESSAGES.MEMBERSHIP_LOST, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: config.CHANNEL_MEMBERSHIP.MESSAGES.JOIN_BUTTON,
                            url: CHANNEL_LINK
                        }
                    ],
                    [
                        {
                            text: config.CHANNEL_MEMBERSHIP.MESSAGES.RECHECK_BUTTON,
                            callback_data: 'check_membership'
                        }
                    ]
                ]
            }
        });
        
        return true; // Block user
    }
}

// Mode constants
const MODES = {
    TRANSLATE: 'translate',
    GRAMMAR: 'grammar',
    TEST: 'test'
};

// Button text constants
const BUTTON_TEXTS = {
    TRANSLATE: '🌐 ترجمه',
    GRAMMAR: '📝 اصلاح گرامر',
    TEST: '📝 تست',
    STATS: '📊 آمار من',
    EXIT_TEST: '🚪 خروج از تست',
    NEXT_TEST: '⏭️ سوال بعدی'
};

// Persistent reply keyboard configuration
const mainKeyboard = {
    reply_markup: {
        keyboard: [
            [
                { text: BUTTON_TEXTS.TRANSLATE },
                { text: BUTTON_TEXTS.GRAMMAR }
            ],
            [
                { text: BUTTON_TEXTS.TEST },
                { text: BUTTON_TEXTS.STATS }
            ]
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
        is_persistent: true
    }
};

console.log('🤖 Farsi-Dutch Telegram Bot is starting...');

/**
 * Check if a user is a member of the required channel with smart caching
 * @param {number} userId - User ID to check
 * @param {number} chatId - Chat ID (for sending messages)
 * @param {boolean} forceCheck - Force check even if cached
 * @returns {boolean} - True if user should have access
 */
async function isChannelMember(userId, chatId = null, forceCheck = false) {
    // If channel membership is disabled, always return true
    if (!config.CHANNEL_MEMBERSHIP.REQUIRED) {
        return true;
    }
    
    // Check manual whitelist first (for when API doesn't work)
    if (manualWhitelist.has(userId)) {
        console.log(`✅ User ${userId} in manual whitelist`);
        updateMembershipCache(userId, true);
        return true;
    }
    
    // Check if we need to verify membership
    if (!forceCheck && !needsMembershipCheck(userId)) {
        const cached = membershipCache.get(userId);
        return cached ? cached.isMember : false;
    }
    
    try {
        const chatMember = await bot.getChatMember(CHANNEL_USERNAME, userId);
        const isMember = ['member', 'administrator', 'creator'].includes(chatMember.status);
        
        // Update cache
        updateMembershipCache(userId, isMember);
        
        // If user lost membership, handle it
        if (!isMember && chatId) {
            const shouldBlock = await handleMembershipLoss(chatId, userId);
            return !shouldBlock; // Return opposite of shouldBlock
        }
        
        // If user regained membership, reset warnings
        if (isMember) {
            const cached = membershipCache.get(userId);
            if (cached && cached.warnings > 0) {
                membershipCache.set(userId, {
                    ...cached,
                    warnings: 0 // Reset warnings
                });
            }
        }
        
        return isMember;
    } catch (error) {
        console.log('⚠️ Channel membership check failed:', error.message);
        
        // Handle different failure scenarios based on configuration
        if (error.message.includes('member list is inaccessible') || 
            error.message.includes('Forbidden') ||
            error.message.includes('user not found')) {
            
            if (config.CHANNEL_MEMBERSHIP.ON_CHECK_FAILURE === 'allow') {
                console.log('🔓 Allowing access due to API limitations');
                updateMembershipCache(userId, true); // Cache as member
                return true;
            } else if (config.CHANNEL_MEMBERSHIP.ON_CHECK_FAILURE === 'block') {
                console.log('🔒 Blocking access due to API limitations - showing membership message');
                updateMembershipCache(userId, false); // Cache as non-member
                
                // Show membership message when blocking due to API failure
                if (chatId) {
                    sendChannelMembershipMessage(chatId);
                }
                return false;
            }
        }
        return false;
    }
}

/**
 * Send channel membership requirement message
 * @param {number} chatId - Chat ID to send message to
 */
function sendChannelMembershipMessage(chatId) {
    const membershipMessage = config.CHANNEL_MEMBERSHIP.MESSAGES.MEMBERSHIP_REQUIRED;

    const membershipKeyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: config.CHANNEL_MEMBERSHIP.MESSAGES.JOIN_BUTTON,
                        url: CHANNEL_LINK
                    }
                ],
                [
                    {
                        text: config.CHANNEL_MEMBERSHIP.MESSAGES.RECHECK_BUTTON,
                        callback_data: 'check_membership'
                    }
                ]
            ]
        }
    };

    safeSendMessage(chatId, membershipMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...membershipKeyboard
    });
}

// Error handler for polling
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

// Start command handler
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Check if user is a member of the required channel
    const isMember = await isChannelMember(userId, chatId, true); // Force check on start
    
    if (!isMember) {
        sendChannelMembershipMessage(chatId);
        return;
    }
    
    const welcomeMessage = getWelcomeMessage();
    
    // Clear any existing mode for this user
    userModes.delete(userId);
    
    // Send welcome message with persistent reply keyboard
    safeSendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...mainKeyboard
    });
});

// Cancel/Reset command handler
bot.onText(/\/cancel/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Check channel membership
    const isMember = await isChannelMember(userId, chatId);
    
    if (!isMember) {
        sendChannelMembershipMessage(chatId);
        return;
    }
    
    // Clear user's mode
    userModes.delete(userId);
    
    safeSendMessage(chatId, '🔄 حالت شما بازنشانی شد. لطفاً یکی از گزینه‌های کیبورد را انتخاب کنید.', {
        parse_mode: 'Markdown',
        ...mainKeyboard
    });
});

// Help command handler
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Check channel membership
    const isMember = await isChannelMember(userId);
    
    if (!isMember) {
        sendChannelMembershipMessage(chatId);
        return;
    }
    
    const helpMessage = getHelpMessage();
    
    safeSendMessage(chatId, helpMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...mainKeyboard
    });
});

// Admin cleanup command (restricted access)
bot.onText(/\/cleanup/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Restrict to bot admin (replace with your user ID)
    const ADMIN_USER_ID = config.ADMIN.USER_ID;
    
    if (userId !== ADMIN_USER_ID) {
        bot.sendMessage(chatId, '❌ دسترسی غیرمجاز', { ...mainKeyboard });
        return;
    }
    
    try {
        bot.sendMessage(chatId, '🔄 در حال اجرای cleanup...', { ...mainKeyboard });
        await manualCleanup(bot);
        bot.sendMessage(chatId, '✅ Cleanup تکمیل شد', { ...mainKeyboard });
    } catch (error) {
        console.error('Manual cleanup error:', error);
        bot.sendMessage(chatId, '❌ خطا در cleanup', { ...mainKeyboard });
    }
});

// Content management commands (admin only)
bot.onText(/\/contentstats/, async (msg) => {
    await handleAdminContentCommands(msg, '/contentstats', []);
});

bot.onText(/\/forcepost(.*)/, async (msg, match) => {
    const args = match[1] ? match[1].trim().split(' ').filter(arg => arg) : [];
    await handleAdminContentCommands(msg, '/forcepost', args);
});

bot.onText(/\/contenttypes/, async (msg) => {
    await handleAdminContentCommands(msg, '/contenttypes', []);
});

// Admin commands for manual user management
bot.onText(/\/approve (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const ADMIN_USER_ID = config.ADMIN.USER_ID;
    
    if (userId !== ADMIN_USER_ID) {
        bot.sendMessage(chatId, '❌ دسترسی غیرمجاز');
        return;
    }
    
    const targetUserId = parseInt(match[1]);
    manualWhitelist.add(targetUserId);
    
    bot.sendMessage(chatId, `✅ کاربر ${targetUserId} به لیست تأیید شده اضافه شد`);
});

bot.onText(/\/remove (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const ADMIN_USER_ID = config.ADMIN.USER_ID;
    
    if (userId !== ADMIN_USER_ID) {
        bot.sendMessage(chatId, '❌ دسترسی غیرمجاز');
        return;
    }
    
    const targetUserId = parseInt(match[1]);
    manualWhitelist.delete(targetUserId);
    membershipCache.delete(targetUserId);
    
    bot.sendMessage(chatId, `❌ کاربر ${targetUserId} از لیست تأیید شده حذف شد`);
});

bot.onText(/\/whitelist/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const ADMIN_USER_ID = config.ADMIN.USER_ID;
    
    if (userId !== ADMIN_USER_ID) {
        bot.sendMessage(chatId, '❌ دسترسی غیرمجاز');
        return;
    }
    
    const whitelistArray = Array.from(manualWhitelist);
    if (whitelistArray.length === 0) {
        bot.sendMessage(chatId, '📋 لیست تأیید شده خالی است');
    } else {
        bot.sendMessage(chatId, `📋 کاربران تأیید شده:\n${whitelistArray.join(', ')}`);
    }
});

bot.onText(/\/userinfo/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const ADMIN_USER_ID = config.ADMIN.USER_ID;
    
    if (userId !== ADMIN_USER_ID) {
        bot.sendMessage(chatId, '❌ دسترسی غیرمجاز');
        return;
    }
    
    const user = msg.from;
    const isInWhitelist = manualWhitelist.has(userId);
    const cachedInfo = membershipCache.get(userId);
    
    let info = `👤 **اطلاعات کاربر:**\n`;
    info += `🆔 ID: ${userId}\n`;
    info += `👤 Username: ${user.username || 'ندارد'}\n`;
    info += `📝 Name: ${user.first_name || ''} ${user.last_name || ''}\n`;
    info += `✅ در Whitelist: ${isInWhitelist ? 'بله' : 'خیر'}\n`;
    
    if (cachedInfo) {
        info += `📋 Cache Info:\n`;
        info += `  - عضو: ${cachedInfo.isMember ? 'بله' : 'خیر'}\n`;
        info += `  - هشدارها: ${cachedInfo.warnings}\n`;
        info += `  - آخرین بررسی: ${cachedInfo.lastChecked.toLocaleString()}\n`;
    }
    
    safeSendMessage(chatId, info, { parse_mode: 'Markdown' });
});

bot.onText(/\/adminhelp/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const ADMIN_USER_ID = config.ADMIN.USER_ID;
    
    if (userId !== ADMIN_USER_ID) {
        bot.sendMessage(chatId, '❌ دسترسی غیرمجاز');
        return;
    }
    
    const helpText = `🔧 **دستورات مدیریت:**

**مدیریت کاربران:**
\`/approve [user_id]\` - تأیید دستی کاربر
\`/remove [user_id]\` - حذف کاربر از لیست تأیید شده
\`/whitelist\` - نمایش لیست کاربران تأیید شده
\`/userinfo\` - نمایش اطلاعات خودتان

**مدیریت سیستم:**
\`/cleanup\` - پاکسازی دستی سیستم
\`/adminhelp\` - نمایش این راهنما

**نکات:**
- وقتی API نتواند عضویت را بررسی کند، از whitelist دستی استفاده می‌شود
- کاربران در whitelist همیشه دسترسی دارند
- برای تأیید کاربر جدید از \`/approve [user_id]\` استفاده کنید`;

    safeSendMessage(chatId, helpText, { parse_mode: 'Markdown' });
});

// Main message handler - handles all types of messages
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userInput = msg.text;
    
    // Handle non-text messages (photos, stickers, voice messages, etc.)
    if (!msg.text) {
        if (msg.photo || msg.sticker || msg.voice || msg.document || msg.video) {
            bot.sendMessage(chatId, 'من فقط پیام‌های متنی را پردازش می‌کنم. لطفاً متن خود را تایپ کنید و یکی از گزینه‌های کیبورد را انتخاب کنید.', {
                parse_mode: 'Markdown',
                ...mainKeyboard
            });
        }
        return;
    }
    
    // Skip if message is a command (already handled by command handlers)
    if (userInput.startsWith('/')) {
        return;
    }
    
    console.log(`📨 [MAIN] Processing text from user ${userId}: "${userInput}"`);
    
    // Check channel membership before allowing any interactions
    const isMember = await isChannelMember(userId, chatId);
    
    if (!isMember) {
        console.log(`🚫 [MAIN] Access denied for user ${userId} - sending membership message`);
        sendChannelMembershipMessage(chatId);
        return;
    }
    
    console.log(`✅ [MAIN] Access granted for user ${userId} - processing message`);
    
    // Handle keyboard button presses
    if (userInput === BUTTON_TEXTS.TRANSLATE) {
        handleModeSelection(chatId, userId, MODES.TRANSLATE, '🌐 حالت ترجمه فعال شد – پیام بعدی‌ات را بفرست.');
        return;
    }
    
    if (userInput === BUTTON_TEXTS.GRAMMAR) {
        handleModeSelection(chatId, userId, MODES.GRAMMAR, '✅ حالت اصلاح گرامر فعال شد – پیام بعدی‌ات را بفرست.');
        return;
    }
    
    if (userInput === BUTTON_TEXTS.TEST) {
        // Start test immediately by calling handleTestMode
        try {
            const testResponse = await handleTestMode(chatId, userId);
            
            if (typeof testResponse === 'object' && testResponse.reply_markup) {
                await bot.sendMessage(chatId, testResponse.text, {
                    parse_mode: 'Markdown',
                    reply_markup: testResponse.reply_markup
                });
            } else {
                await bot.sendMessage(chatId, testResponse, {
                    parse_mode: 'Markdown',
                    ...mainKeyboard
                });
            }
        } catch (error) {
            console.error('Test button error:', error);
            bot.sendMessage(chatId, 'خطایی در ساخت تست پیش آمد. لطفاً دوباره تلاش کنید.', {
                parse_mode: 'Markdown',
                ...mainKeyboard
            });
        }
        return;
    }
    
    if (userInput === BUTTON_TEXTS.STATS) {
        // Show user statistics
        try {
            const stats = await getVocabularyStats(chatId);
            let statsMessage = '📊 **آمار دیکشنری شما:**\n\n';
            
            if (stats.totalWords === 0) {
                statsMessage += '📚 هنوز کلمه‌ای ثبت نکرده‌اید.\n';
                statsMessage += '🌐 برای شروع، از دکمه **ترجمه** استفاده کنید.\n\n';
            } else {
                statsMessage += `🔤 **تعداد کلمات:** ${stats.totalWords}\n`;
                statsMessage += `� **کلمات با مترادف:** ${stats.wordsWithSynonyms}\n`;
                statsMessage += `� **کلمات با متضاد:** ${stats.wordsWithAntonyms}\n`;
                statsMessage += `� **کلمات با مثال:** ${stats.wordsWithExamples}\n\n`;
                
                if (stats.testTotal > 0) {
                    const percentage = Math.round((stats.testScore / stats.testTotal) * 100);
                    statsMessage += `🎯 **آمار تست:**\n`;
                    statsMessage += `✅ پاسخ‌های درست: ${stats.testScore}\n`;
                    statsMessage += `📊 کل سوالات: ${stats.testTotal}\n`;
                    statsMessage += `🏆 درصد موفقیت: ${percentage}%\n\n`;
                }
                
                if (stats.totalWords >= 3) {
                    statsMessage += '🎉 آماده تست هستید!\n';
                    statsMessage += '📝 برای تست کلمات، دکمه **تست** را بزنید.\n';
                } else {
                    const needed = 3 - stats.totalWords;
                    statsMessage += `⚠️ برای تست، ${needed} کلمه دیگر نیاز دارید.\n`;
                }
            }
            
            bot.sendMessage(chatId, statsMessage, {
                parse_mode: 'Markdown',
                ...mainKeyboard
            });
        } catch (error) {
            console.error('Stats error:', error);
            bot.sendMessage(chatId, 'خطایی در نمایش آمار پیش آمد.', {
                parse_mode: 'Markdown',
                ...mainKeyboard
            });
        }
        return;
    }
    
    if (userInput === BUTTON_TEXTS.EXIT_TEST) {
        // End test session and return to main menu
        try {
            await endTestSession(chatId);
            await clearCurrentTest(chatId);
            bot.sendMessage(chatId, '🚪 **از تست خارج شدید**\n\n🏠 به منو اصلی برگشتید.', {
                parse_mode: 'Markdown',
                ...mainKeyboard
            });
        } catch (error) {
            console.error('Exit test error:', error);
            bot.sendMessage(chatId, '❌ خطایی در خروج از تست پیش آمد.', {
                parse_mode: 'Markdown', 
                ...mainKeyboard
            });
        }
        return;
    }
    
    if (userInput === BUTTON_TEXTS.NEXT_TEST) {
        // Generate next test question
        try {
            const testResponse = await handleTestMode(chatId, userId);
            
            if (typeof testResponse === 'object' && testResponse.reply_markup) {
                await bot.sendMessage(chatId, testResponse.text, {
                    parse_mode: 'Markdown',
                    reply_markup: testResponse.reply_markup
                });
            } else {
                await bot.sendMessage(chatId, testResponse, { 
                    parse_mode: 'Markdown',
                    ...mainKeyboard 
                });
            }
        } catch (error) {
            console.error('Next test error:', error);
            bot.sendMessage(chatId, '❌ خطایی در ساخت سوال بعدی پیش آمد.', {
                parse_mode: 'Markdown',
                ...mainKeyboard
            });
        }
        return;
    }
    
    // Handle user input when mode is selected
    await handleUserInput(chatId, userId, userInput);
});

/**
 * Handle mode selection from keyboard buttons
 * @param {number} chatId - Chat ID
 * @param {number} userId - User ID
 * @param {string} mode - Selected mode
 * @param {string} message - Confirmation message
 */
function handleModeSelection(chatId, userId, mode, message) {
    // Store user's selected mode
    userModes.set(userId, {
        mode: mode,
        timestamp: new Date()
    });
    
    // Send confirmation message with persistent keyboard
    bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        ...mainKeyboard
    });
}

/**
 * Handle actual user input when mode is selected
 * @param {number} chatId - Chat ID
 * @param {number} userId - User ID
 * @param {string} userInput - User's input text
 */
async function handleUserInput(chatId, userId, userInput) {
    // Validate input
    if (!userInput || typeof userInput !== 'string') {
        bot.sendMessage(chatId, formatErrorMessage('لطفاً یک پیام متنی بفرستید.'), {
            parse_mode: 'Markdown',
            ...mainKeyboard
        });
        return;
    }
    
    // Check input length
    if (userInput.length > MAX_INPUT_LENGTH) {
        bot.sendMessage(chatId, formatErrorMessage(`پیام خیلی طولانیه. لطفاً کمتر از ${MAX_INPUT_LENGTH} کاراکتر بفرستید.`), {
            parse_mode: 'Markdown',
            ...mainKeyboard
        });
        return;
    }
    
    try {
        // Show typing indicator
        bot.sendChatAction(chatId, 'typing');
        
        // Check if user has selected a mode
        const userMode = userModes.get(userId);
        
        if (!userMode) {
            // No mode selected, ask to choose from keyboard
            bot.sendMessage(chatId, 'لطفاً یکی از گزینه‌های کیبورد را انتخاب کن.', {
                parse_mode: 'Markdown',
                ...mainKeyboard
            });
            return;
        }
        
        // Check if user is in test mode and has an active test (for text-based answers)
        // Only check for test answers if user is NOT in translate or grammar mode
        const state = await loadState(chatId);
        if (state.currentTest && userMode.mode !== MODES.TRANSLATE && userMode.mode !== MODES.GRAMMAR) {
            // Handle test answer via text
            const testResult = await handleTestAnswer(chatId, userInput, state.currentTest);
            bot.sendMessage(chatId, testResult, {
                parse_mode: 'Markdown',
                ...mainKeyboard
            });
            return;
        }
        
        // Optional: Check if mode is not expired (30 minutes timeout)
        const modeAge = new Date() - userMode.timestamp;
        if (modeAge > 30 * 60 * 1000) { // 30 minutes
            userModes.delete(userId);
            bot.sendMessage(chatId, '⏰ زمان جلسه شما تمام شده. لطفاً دوباره یکی از گزینه‌های کیبورد را انتخاب کنید.', {
                parse_mode: 'Markdown',
                ...mainKeyboard
            });
            return;
        }

        // Simple analysis - just check for routing logic
        const analysis = analyzeInput(userInput);
        console.log(`🔍 Input analysis:`, analysis);
        
        let response;
        
        // Process based on selected mode - language is already validated above
        switch (userMode.mode) {
            case MODES.TRANSLATE:
                response = await handleTranslationMode(userInput, analysis, chatId);
                // Send normal response
                bot.sendMessage(chatId, response, {
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true,
                    ...mainKeyboard
                });
                break;
            case MODES.GRAMMAR:
                response = await handleGrammarMode(userInput, analysis);
                // Send normal response
                bot.sendMessage(chatId, response, {
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true,
                    ...mainKeyboard
                });
                break;
            default:
                throw new Error('Invalid mode selected');
        }
        
        // Don't send response here anymore since we're handling it in the switch statement
        return;
        
        // Keep the user mode active (don't delete it)
        // User can send another message or switch modes using keyboard
        
    } catch (error) {
        console.error('Bot Error:', error);
        
        // Don't reset user mode on error, just show error message
        let errorMessage = 'خطایی در پردازش درخواست شما پیش آمد. لطفاً دوباره تلاش کنید.';
        
        if (error.status === 529 || (error.error && error.error.type === 'overloaded_error')) {
            errorMessage = '⏱️ سرور Claude مشغول است. لطفاً ۳۰ ثانیه صبر کنید و دوباره تلاش کنید.';
        } else if (error.message && error.message.includes('API')) {
            errorMessage = 'سرویس موقتاً در دسترس نیست. لطفاً چند لحظه دیگر تلاش کنید.';
        } else if (error.status >= 500) {
            errorMessage = 'مشکل سرور. لطفاً چند دقیقه دیگر تلاش کنید.';
        }
        
        bot.sendMessage(chatId, formatErrorMessage(errorMessage), {
            parse_mode: 'Markdown',
            ...mainKeyboard
        });
    }
}

// Callback query handler for inline keyboard buttons
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    
    console.log('Callback received:', data);
    
    try {
        // Answer callback query to remove loading state
        await bot.answerCallbackQuery(callbackQuery.id);
        
        // Allow membership check without membership requirement
        if (data === 'check_membership') {
            const isMember = await isChannelMember(userId, chatId, true); // Force check
            
            if (isMember) {
                // User is now a member, show welcome message
                const welcomeMessage = getWelcomeMessage();
                
                // Clear any existing mode for this user
                userModes.delete(userId);
                
                // Reset warnings when user rejoins
                const cached = membershipCache.get(userId);
                if (cached) {
                    membershipCache.set(userId, {
                        ...cached,
                        warnings: 0
                    });
                }
                
                try {
                    await safeEditMessage(chatId, callbackQuery.message.message_id, config.CHANNEL_MEMBERSHIP.MESSAGES.MEMBERSHIP_VERIFIED, {
                        parse_mode: 'Markdown'
                    });
                } catch (editError) {
                    // If message edit fails (e.g., same content), just send a new message
                    console.log('Message edit failed, sending new message instead:', editError.message);
                    await safeSendMessage(chatId, config.CHANNEL_MEMBERSHIP.MESSAGES.MEMBERSHIP_VERIFIED, {
                        parse_mode: 'Markdown'
                    });
                }
                
                // Send welcome message with main keyboard
                await safeSendMessage(chatId, welcomeMessage, {
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true,
                    ...mainKeyboard
                });
            } else {
                // User is still not a member
                try {
                    await safeEditMessage(chatId, callbackQuery.message.message_id, config.CHANNEL_MEMBERSHIP.MESSAGES.MEMBERSHIP_FAILED, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: config.CHANNEL_MEMBERSHIP.MESSAGES.JOIN_BUTTON,
                                        url: CHANNEL_LINK
                                    }
                                ],
                                [
                                    {
                                        text: config.CHANNEL_MEMBERSHIP.MESSAGES.RECHECK_BUTTON,
                                        callback_data: 'check_membership'
                                    }
                                ]
                            ]
                        }
                    });
                } catch (editError) {
                    // If message edit fails, send a new message
                    console.log('Message edit failed, sending new message instead:', editError.message);
                    await bot.sendMessage(chatId, config.CHANNEL_MEMBERSHIP.MESSAGES.MEMBERSHIP_FAILED, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: config.CHANNEL_MEMBERSHIP.MESSAGES.JOIN_BUTTON,
                                        url: CHANNEL_LINK
                                    }
                                ],
                                [
                                    {
                                        text: config.CHANNEL_MEMBERSHIP.MESSAGES.RECHECK_BUTTON,
                                        callback_data: 'check_membership'
                                    }
                                ]
                            ]
                        }
                    });
                }
            }
            return;
        }
        
        // Check channel membership for all other callback queries
        const isMember = await isChannelMember(userId, chatId);
        
        if (!isMember) {
            return; // User was already notified by isChannelMember function
        }
        
        // Handle test answers
        if (data.startsWith('test_answer_')) {
            const parts = data.split('_');
            const selectedIndex = parseInt(parts[2]);
            const testId = parts[3];
            
            // Load current test from state
            const state = await loadState(chatId);
            if (state.currentTest && state.currentTest.id === testId) {
                const selectedOption = state.currentTest.options[selectedIndex];
                const testResult = await handleTestCallbackAnswer(chatId, selectedOption, state.currentTest);
                
                // Edit the message to show result
                await safeEditMessage(chatId, callbackQuery.message.message_id, testResult, {
                    parse_mode: 'Markdown'
                });
                
                // Send follow-up message with keyboard and option for next test
                const nextTestKeyboard = {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🔄 تست بعدی', callback_data: 'start_new_test' }]
                        ]
                    }
                };
                
                await bot.sendMessage(chatId, '🎯 آماده تست بعدی هستی؟', {
                    parse_mode: 'Markdown',
                    ...nextTestKeyboard
                });
            } else {
                await bot.sendMessage(chatId, 'این تست منقضی شده. لطفاً تست جدید شروع کنید.', {
                    parse_mode: 'Markdown',
                    ...mainKeyboard
                });
            }
        }
        
        // Handle next test request from inline button
        if (data === 'next_test') {
            try {
                const testResponse = await handleTestMode(chatId, userId);
                if (typeof testResponse === 'object' && testResponse.reply_markup) {
                    // Edit current message with new test
                    await safeEditMessage(chatId, callbackQuery.message.message_id, testResponse.text, {
                        parse_mode: 'Markdown',
                        reply_markup: testResponse.reply_markup
                    });
                } else {
                    // Edit message and send main keyboard
                    await safeEditMessage(chatId, callbackQuery.message.message_id, testResponse, {
                        parse_mode: 'Markdown'
                    });
                    
                    await bot.sendMessage(chatId, '🏠 برگشت به منوی اصلی:', {
                        parse_mode: 'Markdown',
                        ...mainKeyboard
                    });
                }
            } catch (error) {
                console.error('Next test error:', error);
                await bot.sendMessage(chatId, '❌ خطایی در ساخت سوال بعدی پیش آمد.', {
                    parse_mode: 'Markdown',
                    ...mainKeyboard
                });
            }
        }
        
        // Handle exit test request from inline button
        if (data === 'exit_test') {
            try {
                await endTestSession(chatId);
                await clearCurrentTest(chatId);
                
                // Edit current message
                await safeEditMessage(chatId, callbackQuery.message.message_id, '🚪 **از تست خارج شدید**\n\n🏠 به منو اصلی برگشتید.', {
                    parse_mode: 'Markdown'
                });
                
                // Send main keyboard
                await bot.sendMessage(chatId, '💡 می‌توانید دوباره تست شروع کنید یا از امکانات دیگر استفاده کنید:', {
                    parse_mode: 'Markdown',
                    ...mainKeyboard
                });
            } catch (error) {
                console.error('Exit test error:', error);
                await bot.sendMessage(chatId, '❌ خطایی در خروج از تست پیش آمد.', {
                    parse_mode: 'Markdown',
                    ...mainKeyboard
                });
            }
        }
        
        // Handle new test request
        if (data === 'start_new_test') {
            try {
                const testResponse = await handleTestMode(chatId, userId);
                if (typeof testResponse === 'object' && testResponse.reply_markup) {
                    await bot.sendMessage(chatId, testResponse.text, {
                        parse_mode: 'Markdown',
                        reply_markup: testResponse.reply_markup
                    });
                } else {
                    await bot.sendMessage(chatId, testResponse, {
                        parse_mode: 'Markdown',
                        ...mainKeyboard
                    });
                }
            } catch (error) {
                console.error('New test error:', error);
                await bot.sendMessage(chatId, 'خطایی در ساخت تست پیش آمد. لطفاً دوباره تلاش کنید.', {
                    parse_mode: 'Markdown',
                    ...mainKeyboard
                });
            }
        }
        
        // Handle vocabulary test request
        if (data === 'test_vocab') {
            try {
                const testResponse = await handleTestMode(chatId, userId);
                
                if (typeof testResponse === 'object' && testResponse.reply_markup) {
                    await bot.sendMessage(chatId, testResponse.text, {
                        parse_mode: 'Markdown',
                        reply_markup: testResponse.reply_markup
                    });
                } else {
                    await bot.sendMessage(chatId, testResponse, {
                        parse_mode: 'Markdown',
                        ...mainKeyboard
                    });
                }
                
            } catch (error) {
                console.error('❌ Vocabulary test error:', error);
                await bot.sendMessage(chatId, 'خطایی در ساخت تست پیش آمد. لطفاً دوباره تلاش کنید.', {
                    parse_mode: 'Markdown',
                    ...mainKeyboard
                });
            }
        }
        
        // Handle show vocabulary request
        if (data === 'show_vocab') {
            try {
                const state = await loadState(chatId);
                const stats = await getVocabularyStats(chatId);
                
                if (stats.totalWords === 0) {
                    await bot.sendMessage(chatId, '📚 هنوز هیچ کلمه‌ای در مجموعه واژگان شما نیست.\n\n💡 برای اضافه کردن کلمات، متن هلندی برای ترجمه ارسال کنید.', {
                        parse_mode: 'Markdown',
                        ...mainKeyboard
                    });
                } else {
                    // Show first 10 words as preview
                    const recentWords = state.words.slice(-10).reverse();
                    let vocabList = `📊 **آمار واژگان:**\n🔢 تعداد کل: ${stats.totalWords} کلمه\n\n`;
                    vocabList += `📝 **آخرین کلمات:**\n`;
                    
                    recentWords.forEach((word, index) => {
                        vocabList += `${index + 1}. ${word.dutch} → ${word.farsi}\n`;
                    });
                    
                    if (stats.totalWords > 10) {
                        vocabList += `\n... و ${stats.totalWords - 10} کلمه دیگر`;
                    }
                    
                    await bot.sendMessage(chatId, vocabList, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {text: '🧪 تست واژگان', callback_data: 'test_vocab'},
                                    {text: '🏠 منوی اصلی', callback_data: 'main_menu'}
                                ]
                            ]
                        }
                    });
                }
            } catch (error) {
                console.error('Show vocabulary error:', error);
                await bot.sendMessage(chatId, 'خطایی در نمایش واژگان پیش آمد.', {
                    parse_mode: 'Markdown',
                    ...mainKeyboard
                });
            }
        }
        
        // Handle main menu request
        if (data === 'main_menu') {
            await bot.sendMessage(chatId, 'سلام! 👋\n\nمن ربات ترجمه فارسی-هلندی هستم. می‌تونم:\n\n🔤 متن هلندی یا فارسی رو ترجمه کنم\n📝 گرامر متن‌تون رو بررسی کنم\n🧪 تست واژگان بسازم\n\nفقط کافیه متنتون رو ارسال کنید!', {
                parse_mode: 'Markdown',
                ...mainKeyboard
            });
        }
        
    } catch (error) {
        console.error('Callback query error:', error);
        await bot.sendMessage(chatId, 'خطایی پیش آمد. لطفاً دوباره تلاش کنید.', {
            parse_mode: 'Markdown',
            ...mainKeyboard
        });
    }
});

// Helper functions for different modes
/**
 * Handle translation mode
 * @param {string} userInput - User's input text
 * @param {object} analysis - Pre-computed analysis from analyzeInput
 * @param {string} chatId - Chat ID for saving messages
 * @returns {Promise<string>} - Formatted response
 */
async function handleTranslationMode(userInput, analysis, chatId) {
    console.log(`🌐 Translation request: "${userInput}"`);
    
    let response;
    let detectedLanguage;
    
    if (analysis.inputType === 'dictionary') {
        // Single word - provide dictionary definition
        detectedLanguage = await claudeService.detectLanguage(userInput);
        const dictionaryData = await claudeService.getDictionaryDefinition(userInput, detectedLanguage);
        response = formatDictionaryResponse(dictionaryData);
        
        // Save dictionary examples as individual words (SIMPLIFIED)
        if (dictionaryData.examples && dictionaryData.examples.length > 0) {
            console.log(`📖 Saving ${dictionaryData.examples.length} dictionary examples`);
            for (const example of dictionaryData.examples) {
                if (example.dutch && example.farsi) {
                    try {
                        await addWord(chatId, example.dutch, example.farsi);
                        console.log(`✅ Saved example: ${example.dutch} → ${example.farsi}`);
                    } catch (error) {
                        console.error('Error saving dictionary example:', error);
                    }
                }
            }
        }
        
        // Also save the main word entry (SIMPLIFIED)
        try {
            console.log(`💾 Saving main dictionary word: "${userInput}" → "${dictionaryData.translation || ''}"`);
            
            if (detectedLanguage === 'persian') {
                await addWord(chatId, dictionaryData.translation || '', userInput);
            } else {
                await addWord(chatId, userInput, dictionaryData.translation || '');
            }
            console.log(`✅ Dictionary entry saved successfully`);
        } catch (error) {
            console.error('❌ Error saving dictionary entry:', error);
        }
    } else {
        // Sentence or phrase - use comprehensive translation with vocabulary analysis
        detectedLanguage = await claudeService.detectLanguage(userInput);
        const comprehensiveAnalysis = await claudeService.getComprehensiveTranslation(userInput, detectedLanguage);
        response = formatComprehensiveTranslation(comprehensiveAnalysis, detectedLanguage);
        
        // Extract simple translation for saving (first line of comprehensive analysis)
        let simpleTranslation = userInput; // fallback
        try {
            // Try to extract translation from comprehensive analysis
            const lines = comprehensiveAnalysis.split('\n');
            const translationLine = lines.find(line => 
                line.includes('یعنی:') || line.includes('betekent:') || line.includes('«') || line.includes('"')
            );
            if (translationLine) {
                // Extract text between quotes or after colon
                const match = translationLine.match(/[«"](.*?)[»"]/);
                if (match) {
                    simpleTranslation = match[1];
                } else {
                    const colonMatch = translationLine.split(':').slice(1).join(':').trim();
                    if (colonMatch) simpleTranslation = colonMatch.replace(/[«»"]/g, '').trim();
                }
            }
        } catch (e) {
            console.log('Could not extract simple translation for saving');
        }
        
        // Extract and save individual words from comprehensive analysis for vocabulary building
        try {
            console.log('🔤 Extracting vocabulary from translation for word-focused storage');
            
            // Simple approach: save the main translation first
            const isSimpleWord = !userInput.includes(' ') && !simpleTranslation.includes(' ');
            if (isSimpleWord && userInput.trim() && simpleTranslation.trim()) {
                if (detectedLanguage === 'persian') {
                    await addWord(chatId, simpleTranslation, userInput);
                    console.log(`✅ Saved simple word: ${userInput} → ${simpleTranslation}`);
                } else {
                    await addWord(chatId, userInput, simpleTranslation);
                    console.log(`✅ Saved simple word: ${userInput} → ${simpleTranslation}`);
                }
            }
            
            // Enable vocabulary extraction from comprehensive translation
            console.log('🔤 Extracting vocabulary from translation for word-focused storage');
            
            // Try to extract additional words using Claude
            try {
                console.log('🔤 Asking Claude to extract key vocabulary...');
                
                // Check if the comprehensive analysis contains Dutch text
                const dutchIndicators = [
                    // Common Dutch words
                    /\b(is|zijn|het|de|een|van|voor|op|met|aan|door|over|onder|tussen|zonder|binnen|buiten|tijdens|tegen|sinds|tot|naar|uit|bij)\b/i,
                    // Dutch specific patterns
                    /\b(hebben|hebt|heeft|zijn|bent|was|waren|wordt|worden|kan|kunnen|moet|moeten|wil|willen|zou|zouden)\b/i,
                    // Dutch vocabulary indicators
                    /\b(leven|gevoel|aandacht|uitkomen|gelijk|helemaal|toch|wanneer|waar|hoe|wat|wie|waarom)\b/i,
                    // Dutch letter combinations
                    /ij|oo|ee|aa|uu|ou|au|eu|ui/i
                ];
                
                const containsDutch = dutchIndicators.some(pattern => pattern.test(comprehensiveAnalysis));
                console.log('🔍 Dutch content detection:', containsDutch ? 'Found' : 'Not found');
                console.log('🔍 Checking text:', comprehensiveAnalysis.substring(0, 100) + '...');
                
                if (!containsDutch) {
                    console.log('ℹ️ No substantial Dutch content found for vocabulary extraction');
                } else {
                    const vocabularyExtractionPrompt = `
Extract Dutch vocabulary words from this text. Only extract meaningful words (nouns, verbs, adjectives). Skip common words like: het, de, een, is, zijn, van, voor, op, met, aan, door, etc.

Format: dutch_word|persian_translation

Text: ${comprehensiveAnalysis}

Extract only vocabulary words in the specified format:`;
                    
                    const extractedVocabulary = await claudeService.translateText(vocabularyExtractionPrompt, 'english');
                    console.log('🔍 Claude vocabulary extraction response:', extractedVocabulary.substring(0, 200) + '...');
                    
                    // Parse the response more reliably
                    const lines = extractedVocabulary.split('\n');
                    let addedCount = 0;
                    
                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (trimmedLine.includes('|') && 
                            !trimmedLine.toLowerCase().includes('extract') &&
                            !trimmedLine.includes('**') && 
                            !trimmedLine.includes('##') &&
                            !trimmedLine.toLowerCase().includes('format') &&
                            !trimmedLine.toLowerCase().includes('dutch_word') &&
                            !trimmedLine.toLowerCase().includes('persian_translation')) {
                            
                            const parts = trimmedLine.split('|');
                            if (parts.length >= 2) {
                                const dutch = parts[0].trim();
                                const farsi = parts[1].trim();
                                
                                // Validate that we have actual words, not instructions
                                if (dutch && farsi && 
                                    dutch.length > 1 && dutch.length < 30 &&
                                    farsi.length > 0 && farsi.length < 50 &&
                                    !dutch.toLowerCase().includes('word') &&
                                    !farsi.toLowerCase().includes('translation')) {
                                    
                                    await addWord(chatId, dutch, farsi);
                                    console.log(`✅ Added vocabulary: ${dutch} → ${farsi}`);
                                    addedCount++;
                                }
                            }
                        }
                    }
                    
                    if (addedCount > 0) {
                        console.log(`🎉 Added ${addedCount} vocabulary words from translation!`);
                        
                        // Show success message to user
                        await bot.sendMessage(chatId, `📚 ${addedCount} کلمه جدید به مجموعه واژگان شما اضافه شد!`, {
                            reply_markup: {
                                inline_keyboard: [[
                                    {text: '📊 مشاهده واژگان', callback_data: 'show_vocab'},
                                    {text: '🧪 تست واژگان', callback_data: 'test_vocab'}
                                ]]
                            }
                        });
                    } else {
                        console.log('ℹ️ No new vocabulary words extracted from this translation');
                    }
                }
                
            } catch (extractError) {
                console.log('⚠️ Vocabulary extraction failed, but main translation saved:', extractError.message);
            }
            
        } catch (error) {
            console.error('❌ Error in vocabulary processing:', error);
        }
    }
    
    return response;
}

/**
 * Handle grammar correction mode
 * @param {string} userInput - User's input text
 * @param {object} analysis - Pre-computed analysis from analyzeInput
 * @returns {Promise<string>} - Formatted grammar correction
 */
async function handleGrammarMode(userInput, analysis) {
    console.log(`✅ Grammar correction request: "${userInput}"`);
    
    // Check text length limits (50 words or 300 characters max)
    const wordCount = userInput.trim().split(/\s+/).length;
    const charCount = userInput.length;
    
    if (wordCount > 50) {
        return `⚠️ **محدودیت طول متن**\n\nلطفاً متن کوتاه‌تری ارسال کنید:\n• حداکثر **50 کلمه** مجاز است\n• متن شما: **${wordCount} کلمه**\n\n💡 متن کوتاه‌تر برای اصلاح بهتر ارسال کنید.`;
    }
    
    if (charCount > 300) {
        return `⚠️ **محدودیت طول متن**\n\nلطفاً متن کوتاه‌تری ارسال کنید:\n• حداکثر **300 کاراکتر** مجاز است\n• متن شما: **${charCount} کاراکتر**\n\n💡 متن کوتاه‌تر برای اصلاح بهتر ارسال کنید.`;
    }
    
    // Detect language and validate it's Dutch only
    const detectedLanguage = await claudeService.detectLanguage(userInput);
    console.log(`🔍 Language detected for grammar correction: ${detectedLanguage}`);
    
    if (detectedLanguage !== 'dutch') {
        return `⚠️ **فقط متن هلندی قابل اصلاح است**\n\nاین بخش فقط برای اصلاح گرامر متون هلندی طراحی شده است.\n\n• زبان تشخیص داده شده: **${detectedLanguage === 'persian' ? 'فارسی' : 'نامشخص'}**\n• برای اصلاح گرامر، لطفاً متن هلندی ارسال کنید\n\n💡 برای ترجمه از دکمه "ترجمه" استفاده کنید.`;
    }
    
    try {
        // Request grammar correction from Claude
        const correction = await claudeService.correctGrammar(userInput, detectedLanguage);
        return formatGrammarResponse(correction, detectedLanguage);
    } catch (error) {
        console.error('Grammar correction error:', error);
        return `❌ خطایی در اصلاح گرامر رخ داد. لطفاً دوباره تلاش کنید.`;
    }
}

/**
 * Handle test mode - generate word-focused tests from user's vocabulary
 * @param {string} chatId - Chat ID
 * @param {string} userId - User ID
 * @returns {Promise<string>} - Formatted test response
 */
async function handleTestMode(chatId, userId) {
    console.log(`📝 Test generation request for user: ${userId}`);
    
    try {
        // Load user's vocabulary from state
        const state = await loadState(chatId);
        
        if (!state.words || state.words.length === 0) {
            return '📚 **هنوز کلمه‌ای در دیکشنری شما ثبت نشده!**\n\n' +
                   '🔤 برای شروع تست، ابتدا کلمات هلندی ترجمه کنید:\n\n' +
                   '1️⃣ روی دکمه **🌐 ترجمه** بزنید\n' +
                   '2️⃣ کلمه هلندی بنویسید (مثل: huis، boek، water)\n' +
                   '3️⃣ سپس دوباره تست را امتحان کنید\n\n' +
                   '💡 حداقل 3 کلمه نیاز است تا بتوانید تست بدهید.';
        }
        
        const totalWords = state.words.length;
        
        if (totalWords < 3) {
            return `📊 **شما ${totalWords} کلمه در دیکشنری دارید**\n\n` +
                   `🎯 برای ساخت تست، حداقل 3 کلمه نیاز است.\n\n` +
                   `🔤 کلمات بیشتری با دکمه **🌐 ترجمه** اضافه کنید:\n` +
                   `• کلمات فارسی (مثل: خانه، کتاب، آب)\n` +
                   `• کلمات هلندی (مثل: huis، boek، water)\n\n` +
                   `✨ هر چه کلمات بیشتری داشته باشید، تست‌ها متنوع‌تر می‌شوند!`;
        }
        
        // Generate a simple word test from available vocabulary
        const test = await generateWordTest(chatId);
        if (!test) {
            return 'خطایی در ساخت تست پیش آمد. لطفاً دوباره تلاش کنید.';
        }
        
        // Save current test to state
        await setCurrentTest(chatId, test);
        
        return formatSingleTestResponse(test);
        
    } catch (error) {
        console.error('Error generating tests:', error);
        return 'خطایی در ساخت تست پیش آمد. لطفاً دوباره تلاش کنید.';
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Bot is shutting down...');
    bot.stopPolling();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Bot is shutting down...');
    bot.stopPolling();
    process.exit(0);
});

console.log('✅ Farsi-Dutch Telegram Bot is running!');
console.log('📱 Send messages to your bot to test it');
console.log('🛑 Press Ctrl+C to stop');

/**
 * Generate a simple word test from user's vocabulary
 * Uses smart word selection: newest, middle, oldest pattern
 * Avoids repetition during active session
 * @param {string} chatId - Chat ID for session management
 * @returns {Promise<object>} - Single test object
 */
async function generateWordTest(chatId) {
    // Get next word using smart selection
    const questionWord = await getNextTestWord(chatId);
    
    if (!questionWord) {
        return null;
    }

    // Get other words for wrong options
    const otherWords = await getWordsForOptions(chatId, questionWord.id, 2);
    
    if (otherWords.length < 2) {
        // Not enough words for options
        return null;
    }

    // Only 2 test types for words
    const testTypes = [
        'dutch_to_farsi',    // معنی کلمه هلندی (گزینه‌ها به فارسی)
        'farsi_to_dutch'     // معادل هلندی کلمه فارسی (گزینه‌ها به هلندی)
    ];

    // Randomly pick a test type
    const testType = testTypes[Math.floor(Math.random() * testTypes.length)];

    const test = {
        id: Math.random().toString(36).substr(2, 9),
        type: testType,
        question: '',
        correctAnswer: '',
        options: [],
        explanation: ''
    };

    // Generate wrong options from other words
    const wrongOptions = otherWords
        .map(word => testType === 'dutch_to_farsi' ? word.farsi : word.dutch);

    if (testType === 'dutch_to_farsi') {
        test.question = `معنی کلمه «${questionWord.dutch}» چیست؟`;
        test.correctAnswer = questionWord.farsi;
        test.explanation = `کلمه «${questionWord.dutch}» به معنی «${questionWord.farsi}» است.`;
    } else {
        test.question = `معادل هلندی کلمه «${questionWord.farsi}» چیست؟`;
        test.correctAnswer = questionWord.dutch;
        test.explanation = `کلمه «${questionWord.farsi}» به هلندی «${questionWord.dutch}» است.`;
    }

    // Mix correct answer with wrong options and shuffle
    test.options = [test.correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);

    return test;
}

/**
 * Create a diverse test question
 * @param {string} testType - Type of test
 * @param {Array} sourceData - Primary data for the test
 * @param {Array} allData - All available data for wrong options
 * @returns {Promise<object>} - Test object
 */
async function createDiverseTest(testType, sourceData, allData) {
    // Shuffle source data
    const shuffledSource = [...sourceData].sort(() => Math.random() - 0.5);
    
    for (const item of shuffledSource) {
        const test = {
            id: Math.random().toString(36).substr(2, 9),
            type: testType,
            question: '',
            correctAnswer: '',
            options: [],
            explanation: ''
        };
        
        switch (testType) {
            case 'farsi_sentence_meaning':
                if (item.fa && item.nl) {
                    test.question = `این جمله فارسی به هلندی چه معنایی دارد؟\n\n«${item.fa}»`;
                    test.correctAnswer = item.nl;
                    
                    // Get wrong options from other Dutch sentences
                    const wrongOptions = allData
                        .filter(d => d.nl && d.nl !== item.nl && d.nl.length < 100) // Not too long
                        .map(d => d.nl)
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 2);
                    
                    if (wrongOptions.length >= 2) {
                        test.options = [test.correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);
                        test.explanation = `جمله فارسی «${item.fa}» به هلندی «${item.nl}» ترجمه می‌شود.`;
                    }
                }
                break;
                
            case 'dutch_sentence_meaning':
                if (item.nl && item.fa) {
                    test.question = `این جمله هلندی به فارسی چه معنایی دارد؟\n\n«${item.nl}»`;
                    test.correctAnswer = item.fa;
                    
                    // Get wrong options from other Farsi sentences
                    const wrongOptions = allData
                        .filter(d => d.fa && d.fa !== item.fa && d.fa.length < 100)
                        .map(d => d.fa)
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 2);
                    
                    if (wrongOptions.length >= 2) {
                        test.options = [test.correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);
                        test.explanation = `جمله هلندی «${item.nl}» به فارسی «${item.fa}» ترجمه می‌شود.`;
                    }
                }
                break;
                
            case 'dutch_word_meaning':
                if (item.nl && item.fa) {
                    test.question = `معنی کلمه/واژه «${item.nl}» چیست؟`;
                    test.correctAnswer = item.fa;
                    
                    // Get wrong options from other Farsi translations
                    const wrongOptions = allData
                        .filter(d => d.fa && d.fa !== item.fa)
                        .map(d => d.fa)
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 2);
                    
                    if (wrongOptions.length >= 2) {
                        test.options = [test.correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);
                        test.explanation = `کلمه «${item.nl}» به معنی «${item.fa}» است.`;
                    }
                }
                break;
                
            case 'farsi_word_meaning':
                if (item.fa && item.nl) {
                    test.question = `معادل هلندی کلمه/واژه «${item.fa}» چیست؟`;
                    test.correctAnswer = item.nl;
                    
                    // Get wrong options from other Dutch translations
                    const wrongOptions = allData
                        .filter(d => d.nl && d.nl !== item.nl)
                        .map(d => d.nl)
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 2);
                    
                    if (wrongOptions.length >= 2) {
                        test.options = [test.correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);
                        test.explanation = `کلمه «${item.fa}» به هلندی «${item.nl}» است.`;
                    }
                }
                break;
        }
        
        // Check if we have exactly 3 options
        if (test.options.length === 3) {
            return test;
        }
    }
    
    return null;
}

/**
 * Handle test answer from callback button
 * @param {string} chatId - Chat ID
 * @param {string} selectedOption - Selected option
 * @param {object} currentTest - Current test data
 * @returns {Promise<string>} - Response message
 */
async function handleTestCallbackAnswer(chatId, selectedOption, currentTest) {
    const isCorrect = selectedOption === currentTest.correctAnswer;
    
    // Update score
    const scoreData = await updateTestScore(chatId, isCorrect);
    
    // Determine test category for display
    let categoryIcon = '';
    if (currentTest.type.includes('sentence')) {
        categoryIcon = '📝';
    } else {
        categoryIcon = '🔤';
    }
    
    let response = `${categoryIcon} **${currentTest.question}**\n\n`;
    
    // Show all options with indicators
    const letters = ['آ', 'ب', 'ج'];
    currentTest.options.forEach((option, index) => {
        // Truncate long options for display
        let displayOption = option;
        if (option.length > 80) {
            displayOption = option.substring(0, 77) + '...';
        }
        
        if (option === selectedOption && isCorrect) {
            response += `✅ ${letters[index]}) ${displayOption} ← انتخاب شما (درست)\n`;
        } else if (option === selectedOption && !isCorrect) {
            response += `❌ ${letters[index]}) ${displayOption} ← انتخاب شما (اشتباه)\n`;
        } else if (option === currentTest.correctAnswer) {
            response += `✅ ${letters[index]}) ${displayOption} ← جواب درست\n`;
        } else {
            response += `⚪ ${letters[index]}) ${displayOption}\n`;
        }
    });
    
    response += `\n`;
    
    if (isCorrect) {
        response += `🎉 **آفرین! درست جواب دادی!**\n\n`;
    } else {
        response += `😔 **متاسفانه اشتباه بود!**\n\n`;
    }
    
    response += `💡 ${currentTest.explanation}\n\n`;
    response += `📊 **امتیاز شما:** ${scoreData.score} از ${scoreData.total}`;
    
    // Clear current test
    await clearCurrentTest(chatId);
    
    return response;
}

/**
 * Handle test answer from user (text input - legacy)
 * @param {string} chatId - Chat ID
 * @param {string} userAnswer - User's answer
 * @param {object} currentTest - Current test data
 * @returns {Promise<string>} - Response message
 */
async function handleTestAnswer(chatId, userAnswer, currentTest) {
    // Check if answer matches any of the valid options (آ، ب، ج)
    let selectedOption = null;
    const validAnswers = ['آ', 'ب', 'ج', 'a', 'b', 'c', 'A', 'B', 'C'];
    const optionMap = {
        'آ': 0, 'a': 0, 'A': 0,
        'ب': 1, 'b': 1, 'B': 1,
        'ج': 2, 'c': 2, 'C': 2
    };
    
    const cleanAnswer = userAnswer.trim();
    
    if (validAnswers.includes(cleanAnswer)) {
        selectedOption = currentTest.options[optionMap[cleanAnswer]];
    } else {
        // Maybe user wrote the full answer
        selectedOption = currentTest.options.find(opt => 
            opt.toLowerCase().includes(cleanAnswer.toLowerCase()) || 
            cleanAnswer.toLowerCase().includes(opt.toLowerCase())
        );
    }
    
    if (!selectedOption) {
        return 'لطفاً یکی از گزینه‌های آ، ب، یا ج را انتخاب کنید.';
    }
    
    return await handleTestCallbackAnswer(chatId, selectedOption, currentTest);
}

/**
 * Check if a word can be used for a specific test type
 * @param {object} word - Word object
 * @param {string} testType - Type of test
 * @returns {boolean} - Whether test can be created
 */
function canCreateTestType(word, testType) {
    switch (testType) {
        case 'dutch_meaning':
            return word.nl && word.fa;
        case 'farsi_meaning':
            return word.nl && word.fa;
        case 'synonyms_antonyms':
            return (word.synonyms && word.synonyms.length > 0) || (word.antonyms && word.antonyms.length > 0);
        default:
            return false;
    }
}

/**
 * Create a single test question
 * @param {object} word - Target word
 * @param {string} testType - Type of test
 * @param {Array} otherWords - Other words for wrong options
 * @returns {Promise<object>} - Test object
 */
async function createTest(word, testType, otherWords) {
    const test = {
        id: Math.random().toString(36).substr(2, 9),
        type: testType,
        question: '',
        correctAnswer: '',
        options: [],
        explanation: ''
    };
    
    switch (testType) {
        case 'dutch_meaning':
            test.question = `معنی کلمه «${word.nl}» چیست؟`;
            test.correctAnswer = word.fa;
            
            // Generate wrong options from other Dutch words' Farsi meanings
            const wrongFarsiOptions = otherWords
                .filter(w => w.fa && w.fa !== word.fa)
                .map(w => w.fa)
                .sort(() => Math.random() - 0.5)
                .slice(0, 2);
            
            test.options = [test.correctAnswer, ...wrongFarsiOptions]
                .sort(() => Math.random() - 0.5);
            test.explanation = `کلمه «${word.nl}» به معنی «${word.fa}» است.`;
            break;
            
        case 'farsi_meaning':
            test.question = `معادل هلندی کلمه «${word.fa}» چیست؟`;
            test.correctAnswer = word.nl;
            
            // Generate wrong options from other words' Dutch translations
            const wrongDutchOptions = otherWords
                .filter(w => w.nl && w.nl !== word.nl)
                .map(w => w.nl)
                .sort(() => Math.random() - 0.5)
                .slice(0, 2);
            
            test.options = [test.correctAnswer, ...wrongDutchOptions]
                .sort(() => Math.random() - 0.5);
            test.explanation = `کلمه «${word.fa}» به هلندی «${word.nl}» است.`;
            break;
            
        case 'synonyms_antonyms':
            if (word.synonyms && word.synonyms.length > 0) {
                const synonym = word.synonyms[0];
                test.question = `کدام کلمه مترادف «${word.nl}» است؟`;
                test.correctAnswer = synonym;
                
                // Generate wrong options
                const wrongSynOptions = otherWords
                    .filter(w => w.nl && w.nl !== word.nl)
                    .map(w => w.nl)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 2);
                
                test.options = [test.correctAnswer, ...wrongSynOptions]
                    .sort(() => Math.random() - 0.5);
                test.explanation = `«${synonym}» مترادف «${word.nl}» است.`;
            } else if (word.antonyms && word.antonyms.length > 0) {
                const antonym = word.antonyms[0];
                test.question = `کدام کلمه متضاد «${word.nl}» است؟`;
                test.correctAnswer = antonym;
                
                // Generate wrong options
                const wrongAntOptions = otherWords
                    .filter(w => w.nl && w.nl !== word.nl)
                    .map(w => w.nl)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 2);
                
                test.options = [test.correctAnswer, ...wrongAntOptions]
                    .sort(() => Math.random() - 0.5);
                test.explanation = `«${antonym}» متضاد «${word.nl}» است.`;
            }
            break;
    }
    
    // Ensure we have exactly 3 options
    if (test.options.length !== 3) {
        return null;
    }
    
    return test;
}

// ============================================================================
// AUTOMATIC CONTENT GENERATION SYSTEM
// ============================================================================

/**
 * Start automatic content generation system
 * Posts educational content every 2 hours to @parsibrug channel
 */
async function startContentGeneration() {
    console.log('🤖 Starting automatic content generation system...');
    console.log(`📋 Content will be posted every 2 hours to ${CHANNEL_USERNAME}`);
    
    // Check and post content every 30 minutes (to ensure precise timing)
    const checkInterval = 30 * 60 * 1000; // 30 minutes
    
    setInterval(async () => {
        try {
            const posted = await contentService.checkAndPostContent(bot, CHANNEL_USERNAME);
            if (posted) {
                console.log('✅ New content posted successfully');
            }
        } catch (error) {
            console.error('❌ Error in content generation:', error.message);
            console.error('Stack:', error.stack);
        }
    }, checkInterval);
    
    // Post initial content if needed (after 1 minute startup delay)
    setTimeout(async () => {
        try {
            console.log('🔄 Checking for initial content post...');
            const posted = await contentService.checkAndPostContent(bot, CHANNEL_USERNAME);
            if (posted) {
                console.log('✅ Initial content posted successfully');
            } else {
                console.log('ℹ️  No initial content needed at this time');
            }
        } catch (error) {
            console.error('❌ Error in initial content posting:', error.message);
            console.error('Stack:', error.stack);
        }
    }, 60000); // 1 minute delay
}

/**
 * Handle admin content commands
 */
async function handleAdminContentCommands(msg, command, args) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Check if user is admin
    if (userId !== config.ADMIN.USER_ID) {
        await bot.sendMessage(chatId, '❌ این دستور فقط برای ادمین در دسترس است.');
        return;
    }
    
    switch (command) {
        case '/contentstats':
            try {
                const stats = contentService.getContentStats();
                const statsMessage = `📊 **آمار تولید محتوا**\n\n` +
                    `⏰ آخرین پست: ${stats.lastPostTime}\n` +
                    `📈 پست‌های امروز: ${stats.totalPostsToday}\n` +
                    `📝 نوع محتواهای امروز: ${stats.dailyContentUsed.join(', ')}\n\n` +
                    `📋 **آخرین پست‌ها:**\n` +
                    stats.lastFivePosts.map((post, i) => 
                        `${i + 1}. ${post.type} (${post.level}) - ${post.time}`
                    ).join('\n');
                
                await safeSendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
            } catch (error) {
                await safeSendMessage(chatId, `❌ خطا در دریافت آمار: ${error.message}`);
            }
            break;
            
        case '/forcepost':
            try {
                const contentType = args[0] || null;
                const level = args[1] || null;
                
                const result = await contentService.forcePostContent(bot, CHANNEL_USERNAME, contentType, level);
                
                if (result.success) {
                    await safeSendMessage(chatId, `✅ ${result.message}`, { parse_mode: 'Markdown' });
                } else {
                    await safeSendMessage(chatId, `❌ ${result.message}`, { parse_mode: 'Markdown' });
                }
            } catch (error) {
                await safeSendMessage(chatId, `❌ خطا در انتشار اجباری محتوا: ${error.message}`);
            }
            break;
            
        case '/contenttypes':
            const contentTypes = contentService.contentTypes.map(ct => 
                `• ${ct.type} (${ct.category}) - سطوح: ${ct.level.join(', ')}`
            ).join('\n');
            
            await bot.sendMessage(chatId, `📝 **انواع محتوا:**\n\n${contentTypes}\n\n` +
                `💡 **راهنما:**\n` +
                `/forcepost [نوع] [سطح] - انتشار اجباری محتوا\n` +
                `/contentstats - آمار محتوا`, 
                { parse_mode: 'Markdown' });
            break;
    }
}

// ============================================================================
// AUTO-CLEANUP SYSTEM
// ============================================================================

// Add comprehensive error handling
bot.on('error', (error) => {
    console.error('🚨 Bot error:', error.message);
    console.error('Stack:', error.stack);
});

process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start automatic cleanup system
console.log('🚀 Starting Farsi-Dutch Bot...');
startAutoCleanup(bot);
console.log('✅ Auto-cleanup system activated');

// Start automatic content generation system
startContentGeneration();
console.log('✅ Automatic content generation system activated');

module.exports = bot;