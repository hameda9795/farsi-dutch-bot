// Test the handleTestMode function directly
const { loadState } = require('./lib/state.js');

async function testHandleTestMode() {
    const chatId = '741378837';
    
    try {
        console.log('🧪 Testing handleTestMode function directly...');
        
        // Load state first to check
        const state = await loadState(chatId);
        console.log('State check:');
        console.log('- Words exist:', !!state.words);
        console.log('- Words count:', state.words ? state.words.length : 0);
        
        // Simulate the same logic as in handleTestMode
        if (!state.words || state.words.length === 0) {
            console.log('❌ No words found - this is the issue');
            return;
        }
        
        const totalWords = state.words.length;
        if (totalWords < 3) {
            console.log('❌ Not enough words for test');
            return;
        }
        
        console.log(`✅ Should work: ${totalWords} words available for testing`);
        
        // Try to import and run the actual function
        // First let's test if we can require the bot file
        console.log('📦 Testing bot file import...');
        
        // We can't directly import handleTestMode since it's not exported
        // But we can check the structure
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testHandleTestMode();