/**
 * Test New Post Format
 * Test different content types with the new format
 */

const TelegramBot = require('node-telegram-bot-api');
const ClaudeService = require('./services/claudeService');
const ContentService = require('./services/contentService');
require('dotenv').config();

async function testNewFormat() {
    console.log('🎨 Testing New Post Format...\n');
    
    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
    const claudeService = new ClaudeService(process.env.CLAUDE_API_KEY);
    const contentService = new ContentService(claudeService);
    
    // Test different content types
    const testTypes = ['vocabulary', 'quiz', 'simplified_news', 'dutch_humor'];
    
    for (const contentType of testTypes) {
        try {
            console.log(`🎯 Testing content type: ${contentType}`);
            
            const result = await contentService.forcePostContent(bot, '@parsibrug', contentType, 'A2');
            
            if (result.success) {
                console.log(`✅ ${contentType} posted successfully!`);
                console.log(`📊 Type: ${result.type}, Level: ${result.level}\n`);
                
                // Wait 5 seconds between posts
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                console.log(`❌ Failed to post ${contentType}: ${result.message}\n`);
            }
        } catch (error) {
            console.log(`❌ Error testing ${contentType}:`, error.message);
        }
    }
    
    console.log('🎉 New Format Test Complete!');
    process.exit(0);
}

testNewFormat();