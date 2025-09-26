/**
 * Test Script for Content Generation System
 * برای تست سیستم تولید محتوا
 */

const ContentService = require('./services/contentService');
const ClaudeService = require('./services/claudeService');

// Initialize services
const claudeService = new ClaudeService(process.env.CLAUDE_API_KEY);
const contentService = new ContentService(claudeService);

async function testContentGeneration() {
    console.log('🧪 Testing Content Generation System...\n');
    
    // Test 1: Check if content should be posted
    console.log('1️⃣ Testing scheduling logic...');
    const shouldPost = contentService.shouldPostContent();
    console.log(`Should post now: ${shouldPost ? '✅ Yes' : '❌ No'}\n`);
    
    // Test 2: Get content statistics  
    console.log('2️⃣ Getting content statistics...');
    const stats = contentService.getContentStats();
    console.log('📊 Stats:', JSON.stringify(stats, null, 2));
    console.log();
    
    // Test 3: Generate sample content
    console.log('3️⃣ Generating sample content...');
    try {
        const sampleContent = await contentService.generateContent(
            { type: 'vocabulary', level: ['A1', 'A2'] },
            'A2'
        );
        console.log('✅ Generated content:');
        console.log('━'.repeat(50));
        console.log(sampleContent);
        console.log('━'.repeat(50));
    } catch (error) {
        console.error('❌ Error generating content:', error.message);
    }
    
    console.log('\n✅ Content generation test completed!');
}

// Run tests if called directly
if (require.main === module) {
    testContentGeneration().catch(console.error);
}

module.exports = { testContentGeneration };