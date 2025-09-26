/**
 * Test script for comprehensive translation
 */

require('dotenv').config();
const ClaudeService = require('./services/claudeService');
const { formatComprehensiveTranslation } = require('./utils/messageFormatter');

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

if (!CLAUDE_API_KEY) {
    console.error('❌ Error: Missing CLAUDE_API_KEY in .env file');
    process.exit(1);
}

const claudeService = new ClaudeService(CLAUDE_API_KEY);

async function testComprehensiveTranslation() {
    console.log('🧪 Testing Comprehensive Translation Implementation\n');

    // Test Dutch text
    const dutchText = "Hamed, wat wilde je eigenlijk voorbereiden voor de videogesprek?";
    console.log(`🇳🇱 Testing Dutch text: "${dutchText}"`);
    console.log('⏳ Processing...\n');

    try {
        const detectedLang = await claudeService.detectLanguage(dutchText);
        console.log(`🔍 Detected language: ${detectedLang}`);
        
        const comprehensiveAnalysis = await claudeService.getComprehensiveTranslation(dutchText, detectedLang);
        const formattedResponse = formatComprehensiveTranslation(comprehensiveAnalysis, detectedLang);
        
        console.log('📋 COMPREHENSIVE TRANSLATION RESULT:');
        console.log('═'.repeat(50));
        console.log(formattedResponse);
        console.log('═'.repeat(50));

    } catch (error) {
        console.error('❌ Error during translation:', error);
    }

    console.log('\n' + '─'.repeat(50) + '\n');

    // Test Persian text  
    const persianText = "سلام حامد، چطوری؟ امروز چه برنامه‌ای داری؟";
    console.log(`🇮🇷 Testing Persian text: "${persianText}"`);
    console.log('⏳ Processing...\n');

    try {
        const detectedLang = await claudeService.detectLanguage(persianText);
        console.log(`🔍 Detected language: ${detectedLang}`);
        
        const comprehensiveAnalysis = await claudeService.getComprehensiveTranslation(persianText, detectedLang);
        const formattedResponse = formatComprehensiveTranslation(comprehensiveAnalysis, detectedLang);
        
        console.log('📋 COMPREHENSIVE TRANSLATION RESULT:');
        console.log('═'.repeat(50));
        console.log(formattedResponse);
        console.log('═'.repeat(50));

    } catch (error) {
        console.error('❌ Error during translation:', error);
    }

    console.log('\n✅ Test completed!');
}

// Run the test
testComprehensiveTranslation()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });