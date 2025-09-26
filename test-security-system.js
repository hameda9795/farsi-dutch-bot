/**
 * Test script for Advanced Security System
 * Tests continuous membership checking, warnings, and blocking
 */

require('dotenv').config();
const config = require('./config');

console.log('🛡️ Testing Advanced Security System...\n');

// Mock bot for testing
class MockSecureBot {
    constructor() {
        this.membershipCache = new Map();
        this.mockMembers = new Set([741378837]); // Admin is always member
    }

    // Simulate API call
    async getChatMember(chatId, userId) {
        if (this.mockMembers.has(userId)) {
            return { status: 'member' };
        }
        throw new Error('Bad Request: user not found');
    }

    async sendMessage(chatId, text, options = {}) {
        console.log(`📩 Message to ${chatId}:`);
        console.log(`   ${text.substring(0, 80)}${text.length > 80 ? '...' : ''}`);
        if (options.reply_markup?.inline_keyboard) {
            console.log(`   🎹 Buttons: ${options.reply_markup.inline_keyboard.length} rows`);
        }
        console.log();
    }

    // Simulate user leaving channel
    simulateLeaveChannel(userId) {
        this.mockMembers.delete(userId);
        console.log(`👋 User ${userId} left the channel`);
    }

    // Simulate user joining channel
    simulateJoinChannel(userId) {
        this.mockMembers.add(userId);
        console.log(`🎉 User ${userId} joined the channel`);
    }
}

// Security functions (copied from main bot)
function needsMembershipCheck(userId, membershipCache) {
    if (!config.CHANNEL_MEMBERSHIP.REQUIRED) return false;
    if (config.CHANNEL_MEMBERSHIP.SECURITY.CHECK_ON_EVERY_MESSAGE) return true;
    
    const cached = membershipCache.get(userId);
    if (!cached) return true;
    
    const cacheExpiry = config.CHANNEL_MEMBERSHIP.SECURITY.CACHE_MINUTES * 60 * 1000;
    const timeSinceCheck = Date.now() - cached.lastChecked.getTime();
    
    return timeSinceCheck > cacheExpiry;
}

function updateMembershipCache(userId, isMember, membershipCache) {
    const existing = membershipCache.get(userId) || { warnings: 0 };
    membershipCache.set(userId, {
        isMember,
        lastChecked: new Date(),
        warnings: existing.warnings
    });
}

async function handleMembershipLoss(bot, chatId, userId, membershipCache) {
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
        
        await bot.sendMessage(chatId, warningMessage);
        
        return false; // Don't block yet, just warn
    } else {
        // Block user
        await bot.sendMessage(chatId, config.CHANNEL_MEMBERSHIP.MESSAGES.MEMBERSHIP_LOST);
        return true; // Block user
    }
}

async function isChannelMember(bot, userId, chatId, membershipCache, forceCheck = false) {
    if (!config.CHANNEL_MEMBERSHIP.REQUIRED) return true;
    
    if (!forceCheck && !needsMembershipCheck(userId, membershipCache)) {
        const cached = membershipCache.get(userId);
        console.log(`📋 Using cached result for user ${userId}: ${cached ? cached.isMember : false}`);
        return cached ? cached.isMember : false;
    }
    
    try {
        const chatMember = await bot.getChatMember('@parsibrug', userId);
        const isMember = ['member', 'administrator', 'creator'].includes(chatMember.status);
        
        updateMembershipCache(userId, isMember, membershipCache);
        console.log(`✅ Fresh check for user ${userId}: ${isMember ? 'MEMBER' : 'NOT MEMBER'}`);
        
        if (!isMember && chatId) {
            const shouldBlock = await handleMembershipLoss(bot, chatId, userId, membershipCache);
            return !shouldBlock;
        }
        
        if (isMember) {
            const cached = membershipCache.get(userId);
            if (cached && cached.warnings > 0) {
                console.log(`🔄 Resetting warnings for user ${userId}`);
                membershipCache.set(userId, { ...cached, warnings: 0 });
            }
        }
        
        return isMember;
    } catch (error) {
        console.log(`⚠️ API Error: ${error.message}`);
        return config.CHANNEL_MEMBERSHIP.ON_CHECK_FAILURE === 'allow';
    }
}

// Run comprehensive tests
async function runSecurityTests() {
    const bot = new MockSecureBot();
    const membershipCache = new Map();
    
    console.log('📋 Test Configuration:');
    console.log(`   - Check on every message: ${config.CHANNEL_MEMBERSHIP.SECURITY.CHECK_ON_EVERY_MESSAGE}`);
    console.log(`   - Cache minutes: ${config.CHANNEL_MEMBERSHIP.SECURITY.CACHE_MINUTES}`);
    console.log(`   - Warning count: ${config.CHANNEL_MEMBERSHIP.SECURITY.WARNING_COUNT}`);
    console.log(`   - Warn before block: ${config.CHANNEL_MEMBERSHIP.SECURITY.WARN_BEFORE_BLOCK}\n`);

    const testUser = 123456789;
    const chatId = `chat_${testUser}`;

    // Test 1: User joins and uses bot
    console.log('🧪 Test 1: New user joins channel');
    bot.simulateJoinChannel(testUser);
    let hasAccess = await isChannelMember(bot, testUser, chatId, membershipCache, true);
    console.log(`   Result: ${hasAccess ? '✅ Access granted' : '❌ Access denied'}\n`);

    // Test 2: User uses bot again (cache test)
    console.log('🧪 Test 2: User tries to use bot again (testing cache)');
    hasAccess = await isChannelMember(bot, testUser, chatId, membershipCache);
    console.log(`   Result: ${hasAccess ? '✅ Access granted' : '❌ Access denied'}\n`);

    // Test 3: User leaves channel
    console.log('🧪 Test 3: User leaves channel and tries to use bot');
    bot.simulateLeaveChannel(testUser);
    hasAccess = await isChannelMember(bot, testUser, chatId, membershipCache, true);
    console.log(`   Result: ${hasAccess ? '✅ Access granted (warning sent)' : '❌ Access denied'}\n`);

    // Test 4: User tries again (should get another warning)
    console.log('🧪 Test 4: User tries again (second warning)');
    hasAccess = await isChannelMember(bot, testUser, chatId, membershipCache, true);
    console.log(`   Result: ${hasAccess ? '✅ Access granted (warning sent)' : '❌ Access denied'}\n`);

    // Test 5: Third attempt (should be blocked)
    console.log('🧪 Test 5: User tries third time (should be blocked)');
    hasAccess = await isChannelMember(bot, testUser, chatId, membershipCache, true);
    console.log(`   Result: ${hasAccess ? '✅ Access granted' : '❌ Access BLOCKED'}\n`);

    // Test 6: User rejoins channel
    console.log('🧪 Test 6: User rejoins channel (warnings should reset)');
    bot.simulateJoinChannel(testUser);
    hasAccess = await isChannelMember(bot, testUser, chatId, membershipCache, true);
    console.log(`   Result: ${hasAccess ? '✅ Access granted (warnings reset)' : '❌ Access denied'}\n`);

    console.log('✅ Security tests completed!');
    console.log('\n📊 Final cache state:');
    const finalCache = membershipCache.get(testUser);
    if (finalCache) {
        console.log(`   - User: ${testUser}`);
        console.log(`   - Is Member: ${finalCache.isMember}`);
        console.log(`   - Warnings: ${finalCache.warnings}`);
        console.log(`   - Last Checked: ${finalCache.lastChecked.toLocaleString()}`);
    }
}

runSecurityTests().catch(console.error);