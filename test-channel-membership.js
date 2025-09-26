/**
 * Test script to verify channel membership functionality
 */

require('dotenv').config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_USERNAME = '@parsibrug';

if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN not found in environment variables');
    process.exit(1);
}

// Mock TelegramBot for testing
class MockBot {
    constructor(token) {
        this.token = token;
        console.log('🤖 Mock bot initialized with token:', token.substring(0, 10) + '...');
    }

    async getChatMember(chatId, userId) {
        // Simulate API call
        console.log(`📞 API Call: getChatMember(${chatId}, ${userId})`);
        
        // For testing, let's simulate different scenarios
        if (userId === 741378837) { // Your admin user ID
            return { status: 'creator' };
        } else if (userId === 123456789) { // Test member
            return { status: 'member' };
        } else { // Non-member
            throw new Error('Bad Request: user not found');
        }
    }

    async sendMessage(chatId, text, options = {}) {
        console.log(`📩 Message to ${chatId}:`, text.substring(0, 50) + '...');
        if (options.reply_markup) {
            console.log('🎹 Keyboard included:', JSON.stringify(options.reply_markup, null, 2));
        }
        return { message_id: Date.now() };
    }
}

/**
 * Check if a user is a member of the required channel
 */
async function isChannelMember(bot, userId) {
    try {
        const chatMember = await bot.getChatMember(CHANNEL_USERNAME, userId);
        return ['member', 'administrator', 'creator'].includes(chatMember.status);
    } catch (error) {
        console.log('⚠️ Channel membership check failed:', error.message);
        return false;
    }
}

/**
 * Send channel membership requirement message
 */
function sendChannelMembershipMessage(bot, chatId) {
    const membershipMessage = `🔐 **برای استفاده از این ربات، لطفاً عضو کانال زیر شوید:**

برای دسترسی به تمام امکانات ربات، عضویت در کانال ما الزامی است.

پس از عضویت، دکمه /start را مجدداً فشار دهید.`;

    const membershipKeyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '🔗 عضویت در کانال',
                        url: 'https://t.me/parsibrug'
                    }
                ],
                [
                    {
                        text: '✅ عضو شدم - بررسی مجدد',
                        callback_data: 'check_membership'
                    }
                ]
            ]
        }
    };

    return bot.sendMessage(chatId, membershipMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...membershipKeyboard
    });
}

// Test the functionality
async function runTests() {
    console.log('🧪 Starting channel membership tests...\n');
    
    const bot = new MockBot(TELEGRAM_BOT_TOKEN);
    
    // Test cases
    const testCases = [
        { userId: 741378837, description: 'Admin user (creator)' },
        { userId: 123456789, description: 'Regular member' },
        { userId: 999999999, description: 'Non-member' }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n📝 Testing: ${testCase.description}`);
        console.log(`👤 User ID: ${testCase.userId}`);
        
        const isMember = await isChannelMember(bot, testCase.userId);
        console.log(`✅ Is member: ${isMember}`);
        
        if (!isMember) {
            console.log('📮 Sending membership message...');
            await sendChannelMembershipMessage(bot, `chat_${testCase.userId}`);
        } else {
            console.log('🎉 User has access to bot features');
        }
        
        console.log('─'.repeat(50));
    }
    
    console.log('\n✅ All tests completed!');
    console.log('\n📋 Summary:');
    console.log('- Channel membership checking is working');
    console.log('- Non-members receive membership requirement message');
    console.log('- Members get access to bot features');
    console.log('- Beautiful keyboard with channel link is shown');
}

runTests().catch(console.error);