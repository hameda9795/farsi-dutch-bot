// Test simple word saving
const { addWord, getVocabularyStats, loadState } = require('./lib/state');

async function testWordSaving() {
    const testUserId = '741378837';
    
    console.log('🧪 Testing simple word saving...\n');
    
    try {
        // Add some test words
        console.log('➕ Adding test words...');
        await addWord(testUserId, 'huis', 'خانه');
        await addWord(testUserId, 'boek', 'کتاب');
        await addWord(testUserId, 'water', 'آب');
        await addWord(testUserId, 'eten', 'خوردن');
        await addWord(testUserId, 'slapen', 'خوابیدن');
        
        console.log('\n📊 Checking statistics...');
        const stats = await getVocabularyStats(testUserId);
        console.log('Stats:', stats);
        
        console.log('\n📖 Loading state to verify...');
        const state = await loadState(testUserId);
        console.log('Total words in state:', state.words.length);
        console.log('Words:', state.words.map(w => `${w.dutch} → ${w.farsi}`));
        
        console.log('\n✅ Test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testWordSaving();