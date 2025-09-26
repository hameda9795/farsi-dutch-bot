/**
 * Force Post Creative Content Test
 * Test manual posting of creative content
 */

const TelegramBot = require('node-telegram-bot-api');
const ClaudeService = require('./services/claudeService');
const ContentService = require('./services/contentService');
require('dotenv').config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CHANNEL_USERNAME = '@parsibrug'; // Post to channel, not personal chat

if (!TELEGRAM_BOT_TOKEN || !CLAUDE_API_KEY) {
    console.error('❌ Missing environment variables!');
    process.exit(1);
}

async function testCreativePost() {
    console.log('🎨 Testing Creative Content Posting...\n');
    
    const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
    const claudeService = new ClaudeService(CLAUDE_API_KEY);
    const contentService = new ContentService(claudeService);
    
    const creativeTypes = ['dutch_riddles', 'word_stories', 'dutch_memes', 'visual_memory'];
    const randomType = creativeTypes[Math.floor(Math.random() * creativeTypes.length)];
    
    try {
        console.log(`🎯 Testing creative type: ${randomType}`);
        
        const result = await contentService.forcePostContent(bot, CHANNEL_USERNAME, randomType);
        
        if (result.success) {
            console.log('✅ Creative content posted successfully!');
            console.log(`📊 Type: ${result.type}, Level: ${result.level}`);
            console.log(`💬 Message: ${result.message}`);
        } else {
            console.log('❌ Failed to post creative content');
            console.log(`💬 Error: ${result.message}`);
        }
        
    } catch (error) {
        console.error('❌ Error in creative content test:', error);
    }
    
    console.log('\n🎉 Creative Content Test Complete!');
    process.exit(0);
}

testCreativePost();