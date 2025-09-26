// Test the new word-focused architecture migration
const { loadState, addWord, getVocabularyStats } = require('./lib/state');

async function testMigration() {
    const testUserId = '741378837'; // Using existing user
    
    console.log('🔍 Testing migration and new word-focused architecture...\n');
    
    try {
        // Load state (should trigger migration if needed)
        console.log('📖 Loading user state...');
        const state = await loadState(testUserId);
        
        console.log('Current state structure:');
        console.log('- Words:', state.words ? state.words.length : 'undefined');
        console.log('- Messages (old):', state.messages ? state.messages.length : 'undefined');
        
        // Get vocabulary stats
        console.log('\n📊 Getting vocabulary statistics...');
        const stats = await getVocabularyStats(testUserId);
        console.log('Stats:', stats);
        
        // Test adding a new word
        console.log('\n➕ Testing word addition...');
        await addWord(
            testUserId, 
            'test', 
            'تست',
            ['proef', 'examen'],
            ['falen'],
            [
                { dutch: 'Dit is een test', farsi: 'این یک تست است', english: 'This is a test' }
            ]
        );
        
        // Check stats again
        console.log('\n📊 Getting updated statistics...');
        const newStats = await getVocabularyStats(testUserId);
        console.log('Updated stats:', newStats);
        
        console.log('\n✅ Migration and word-focused architecture test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testMigration();