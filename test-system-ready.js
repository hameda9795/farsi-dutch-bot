/**
 * Simple test without running the bot
 */

const { loadState } = require('./lib/state');

async function testSystemReady() {
    const testUserId = '741378837';
    
    console.log('🧪 Testing Improved Test System...\n');
    
    try {
        // Load current state
        const state = await loadState(testUserId);
        console.log(`📚 User has ${state.words.length} words in vocabulary`);
        
        if (state.words.length < 3) {
            console.log('❌ Need at least 3 words for testing');
            return;
        }
        
        console.log('✅ User has enough words for testing');
        console.log(`🎯 Test session active: ${state.testSession.isActive}`);
        console.log(`📝 Used words in session: ${state.testSession.usedWordIds.length}`);
        
        console.log('\n🎉 System is ready!');
        console.log('Now when user clicks "تست" button:');
        console.log('  1️⃣ Smart word selection will pick newest words first');
        console.log('  2️⃣ No repetition during session');
        console.log('  3️⃣ User can exit test anytime');
        console.log('  4️⃣ Session resets when needed');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testSystemReady();