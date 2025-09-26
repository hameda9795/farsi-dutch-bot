/**
 * Test bot admin access to channel
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

async function testChannelAccess() {
    console.log('🧪 Testing bot admin access to channel...\n');
    
    const CHANNEL_USERNAME = '@parsibrug';
    const TEST_USER_ID = 741378837; // Your user ID
    
    try {
        console.log('📡 Testing getChatMember...');
        const chatMember = await bot.getChatMember(CHANNEL_USERNAME, TEST_USER_ID);
        
        console.log('✅ SUCCESS! Bot can access channel member info');
        console.log(`📋 Member status: ${chatMember.status}`);
        console.log(`👤 User: ${chatMember.user.first_name} ${chatMember.user.last_name || ''}`);
        console.log(`🆔 User ID: ${chatMember.user.id}`);
        
        if (chatMember.user.username) {
            console.log(`📝 Username: @${chatMember.user.username}`);
        }
        
        console.log('\n🎉 Perfect! Bot has admin access to channel');
        console.log('✅ We can now implement automatic membership checking');
        
    } catch (error) {
        console.log('❌ ERROR: Bot cannot access channel');
        console.log(`Error: ${error.message}`);
        
        if (error.message.includes('member list is inaccessible')) {
            console.log('\n💡 Solution: Make sure the bot is added as admin to the channel');
            console.log('   1. Go to @parsibrug channel');
            console.log('   2. Add the bot as administrator'); 
            console.log('   3. Give it "View Messages" permission');
        }
    }
}

testChannelAccess();