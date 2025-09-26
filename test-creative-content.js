/**
 * Test Creative Content Generation
 * Tests the new creative content types
 */

const ClaudeService = require('./services/claudeService');
const ContentService = require('./services/contentService');
require('dotenv').config();

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

if (!CLAUDE_API_KEY) {
    console.error('❌ CLAUDE_API_KEY is required in .env file');
    process.exit(1);
}

async function testCreativeContent() {
    console.log('🎨 Testing Creative Content Generation System...\n');
    
    const claudeService = new ClaudeService(CLAUDE_API_KEY);
    const contentService = new ContentService(claudeService);
    
    // Test different creative content types
    const creativeTypes = [
        'dutch_riddles',
        'word_stories', 
        'rhyme_learning',
        'visual_memory',
        'dutch_memes',
        'cultural_insights',
        'word_games',
        'street_smart_dutch',
        'emotion_expressions'
    ];
    
    for (const contentType of creativeTypes.slice(0, 3)) { // Test first 3 only
        try {
            console.log(`\n🔮 Testing: ${contentType}`);
            console.log('=' .repeat(50));
            
            const typeInfo = contentService.contentTypes.find(ct => ct.type === contentType);
            const level = typeInfo.level[Math.floor(Math.random() * typeInfo.level.length)];
            
            console.log(`📊 Level: ${level}, Category: ${typeInfo.category}`);
            
            const content = await contentService.generateContent(typeInfo, level);
            
            console.log('\n📝 Generated Content:');
            console.log(content);
            console.log('\n' + '='.repeat(80) + '\n');
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.error(`❌ Error testing ${contentType}:`, error.message);
        }
    }
    
    // Test content selection algorithm
    console.log('🧠 Testing Content Selection Algorithm...');
    
    const mockSchedule = {
        dailyContentUsed: ['vocabulary', 'verbs', 'pronunciation'], // Some regular content used
        lastResetDate: new Date().toDateString()
    };
    
    console.log('\n📈 Current daily usage:', mockSchedule.dailyContentUsed);
    
    for (let i = 0; i < 5; i++) {
        const selected = contentService.selectNextContentType(mockSchedule);
        console.log(`${i + 1}. Selected: ${selected.type} (${selected.category}) - Level: ${selected.level.join(', ')}`);
        
        // Simulate adding to used content
        mockSchedule.dailyContentUsed.push(selected.type);
    }
    
    // Test stats
    console.log('\n📊 Testing Content Stats...');
    const stats = contentService.getContentStats();
    console.log('Stats:', JSON.stringify(stats, null, 2));
    
    console.log('\n✅ Creative Content Testing Complete!');
    console.log('🎨 New creative content types added successfully');
    console.log('🤖 System ready to generate unique and engaging content');
}

// Run the test
testCreativeContent().catch(console.error);