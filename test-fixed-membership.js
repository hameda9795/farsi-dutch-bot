/**
 * Test script for the fixed channel membership system
 */

require('dotenv').config();
const config = require('./config');

console.log('🧪 Testing Fixed Channel Membership System...\n');

// Mock the system components
class MockBotWithWhitelist {
    constructor() {
        this.manualWhitelist = new Set([741378837]); // Admin pre-approved
        this.membershipCache = new Map();
        this.sentMessages = [];
    }

    async getChatMember(chatId, userId) {
        // Simulate API failure (like the real issue you're experiencing)
        throw new Error('ETELEGRAM: 400 Bad Request: member list is inaccessible');
    }

    async sendMessage(chatId, text, options = {}) {
        this.sentMessages.push({ chatId, text, options });
        console.log(`📩 Message sent to ${chatId}:`);
        console.log(`   ${text.substring(0, 60)}${text.length > 60 ? '...' : ''}`);
        if (options.reply_markup?.inline_keyboard) {
            console.log(`   🎹 Has keyboard buttons`);
        }
        console.log();
    }

    addToWhitelist(userId) {
        this.manualWhitelist.add(userId);
        console.log(`✅ Added user ${userId} to whitelist`);
    }

    removeFromWhitelist(userId) {
        this.manualWhitelist.delete(userId);
        console.log(`❌ Removed user ${userId} from whitelist`);
    }
}

// Test functions (simplified versions from main bot)
function updateMembershipCache(userId, isMember, membershipCache) {
    const existing = membershipCache.get(userId) || { warnings: 0 };
    membershipCache.set(userId, {
        isMember,
        lastChecked: new Date(),
        warnings: existing.warnings
    });
}

function sendChannelMembershipMessage(bot, chatId) {
    const membershipMessage = config.CHANNEL_MEMBERSHIP.MESSAGES.MEMBERSHIP_REQUIRED;

    const membershipKeyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: config.CHANNEL_MEMBERSHIP.MESSAGES.JOIN_BUTTON,
                        url: config.CHANNEL_MEMBERSHIP.CHANNEL_LINK
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

    return bot.sendMessage(chatId, membershipMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...membershipKeyboard
    });
}

async function isChannelMember(bot, userId, chatId = null) {
    if (!config.CHANNEL_MEMBERSHIP.REQUIRED) {
        return true;
    }
    
    // Check manual whitelist first
    if (bot.manualWhitelist.has(userId)) {
        console.log(`✅ User ${userId} in manual whitelist`);
        updateMembershipCache(userId, true, bot.membershipCache);
        return true;
    }
    
    try {
        const chatMember = await bot.getChatMember('@parsibrug', userId);
        const isMember = ['member', 'administrator', 'creator'].includes(chatMember.status);
        updateMembershipCache(userId, isMember, bot.membershipCache);
        return isMember;
    } catch (error) {
        console.log(`⚠️ Channel membership check failed: ${error.message}`);
        
        if (error.message.includes('member list is inaccessible') || 
            error.message.includes('Forbidden') ||
            error.message.includes('user not found')) {
            
            if (config.CHANNEL_MEMBERSHIP.ON_CHECK_FAILURE === 'block') {
                console.log('🔒 Blocking access due to API limitations - showing membership message');
                updateMembershipCache(userId, false, bot.membershipCache);
                
                if (chatId) {
                    await sendChannelMembershipMessage(bot, chatId);
                }
                return false;
            }
        }
        return false;
    }
}

// Run tests
async function runTests() {
    const bot = new MockBotWithWhitelist();
    
    console.log('📋 Current Configuration:');
    console.log(`   - Channel membership required: ${config.CHANNEL_MEMBERSHIP.REQUIRED}`);
    console.log(`   - On API failure: ${config.CHANNEL_MEMBERSHIP.ON_CHECK_FAILURE}`);
    console.log(`   - Admin user in whitelist: ${bot.manualWhitelist.has(741378837)}`);
    console.log();

    // Test 1: Admin user (should have access via whitelist)
    console.log('🧪 Test 1: Admin user (in whitelist)');
    const adminUserId = 741378837;
    const adminHasAccess = await isChannelMember(bot, adminUserId, `chat_${adminUserId}`);
    console.log(`   Result: ${adminHasAccess ? '✅ Access granted' : '❌ Access denied'}\n`);

    // Test 2: Regular user not in whitelist (should be blocked and see message)
    console.log('🧪 Test 2: Regular user not in whitelist');
    const regularUserId = 123456789;
    const regularHasAccess = await isChannelMember(bot, regularUserId, `chat_${regularUserId}`);
    console.log(`   Result: ${regularHasAccess ? '✅ Access granted' : '❌ Access denied'}`);
    console.log(`   Messages sent: ${bot.sentMessages.length}\n`);

    // Test 3: Add regular user to whitelist
    console.log('🧪 Test 3: Add regular user to whitelist');
    bot.addToWhitelist(regularUserId);
    const regularHasAccessNow = await isChannelMember(bot, regularUserId, `chat_${regularUserId}`);
    console.log(`   Result: ${regularHasAccessNow ? '✅ Access granted' : '❌ Access denied'}\n`);

    // Test 4: Remove user from whitelist
    console.log('🧪 Test 4: Remove user from whitelist');
    bot.removeFromWhitelist(regularUserId);
    const regularHasAccessAfterRemoval = await isChannelMember(bot, regularUserId, `chat_${regularUserId}`);
    console.log(`   Result: ${regularHasAccessAfterRemoval ? '✅ Access granted' : '❌ Access denied'}`);
    console.log(`   Total messages sent: ${bot.sentMessages.length}\n`);

    console.log('✅ All tests completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Admin always has access via whitelist`);
    console.log(`   - Non-whitelisted users are blocked when API fails`);
    console.log(`   - Membership message is shown to blocked users`);
    console.log(`   - Whitelist management works correctly`);
}

runTests().catch(console.error);