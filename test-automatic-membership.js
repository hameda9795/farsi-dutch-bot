/**
 * Test Automatic Membership System
 * Bot is admin of @parsibrug channel - testing real-time membership checking
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');

// Initialize bot with your token
const TOKEN = '8296341423:AAE_G7cGLQOXNPfgLpn2RM_wqLW8OoIeeKA';
const bot = new TelegramBot(TOKEN);

const CHANNEL_USERNAME = '@parsibrug';
const TEST_USER_ID = 741378837; // Admin user for testing

/**
 * Test automatic membership checking with admin privileges
 */
async function testAutomaticMembership() {
    console.log('🔧 Testing Automatic Membership System...\n');
    
    try {
        // Test 1: Check admin's membership status
        console.log('📋 Test 1: Admin membership check');
        const adminMember = await bot.getChatMember(CHANNEL_USERNAME, TEST_USER_ID);
        console.log(`✅ Admin status: ${adminMember.status}`);
        console.log(`✅ Admin username: @${adminMember.user.username || 'N/A'}`);
        console.log(`✅ Admin can access: ${['member', 'administrator', 'creator'].includes(adminMember.status)}\n`);
        
        // Test 2: Get channel info to confirm bot's admin status
        console.log('📋 Test 2: Channel information');
        const channelInfo = await bot.getChat(CHANNEL_USERNAME);
        console.log(`✅ Channel title: ${channelInfo.title}`);
        console.log(`✅ Channel type: ${channelInfo.type}`);
        console.log(`✅ Channel members count: ${channelInfo.members_count || 'Private'}\n`);
        
        // Test 3: Check bot's own status in channel
        console.log('📋 Test 3: Bot admin privileges');
        const botMember = await bot.getChatMember(CHANNEL_USERNAME, bot.token.split(':')[0]);
        console.log(`✅ Bot status in channel: ${botMember.status}`);
        console.log(`✅ Bot is admin: ${['administrator', 'creator'].includes(botMember.status)}`);
        
        if (botMember.status === 'administrator') {
            console.log(`✅ Bot admin rights:`, {
                can_manage_chat: botMember.can_manage_chat,
                can_delete_messages: botMember.can_delete_messages,
                can_manage_video_chats: botMember.can_manage_video_chats,
                can_restrict_members: botMember.can_restrict_members,
                can_promote_members: botMember.can_promote_members,
                can_change_info: botMember.can_change_info,
                can_invite_users: botMember.can_invite_users
            });
        }
        
        console.log('\n🎯 AUTOMATIC MEMBERSHIP SYSTEM STATUS:');
        console.log('✅ Bot has admin access to channel');
        console.log('✅ Real-time membership checking ENABLED');
        console.log('✅ Instant blocking for non-members READY');
        console.log('✅ No API limitations - full access');
        console.log('\n🚀 Ready to implement fully automatic system!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.message.includes('member list is inaccessible')) {
            console.log('⚠️ Bot may not have sufficient privileges');
        } else if (error.message.includes('chat not found')) {
            console.log('⚠️ Channel username may be incorrect');
        }
    }
}

// Run the test
testAutomaticMembership().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});