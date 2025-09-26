/**
 * Simple Creative Content Test
 */

const TelegramBot = require('node-telegram-bot-api');
const ClaudeService = require('./services/claudeService');
const ContentService = require('./services/contentService');
require('dotenv').config();

async function quickTest() {
    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
    const claudeService = new ClaudeService(process.env.CLAUDE_API_KEY);
    const contentService = new ContentService(claudeService);
    
    try {
        // Generate creative content
        const contentType = contentService.contentTypes.find(ct => ct.type === 'visual_memory');
        const content = await contentService.generateContent(contentType, 'A2');
        
        console.log('Generated content:');
        console.log(content);
        
        // Try to post without markdown
        await bot.sendMessage(741378837, content);
        console.log('✅ Posted successfully without markdown!');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    process.exit(0);
}

quickTest();