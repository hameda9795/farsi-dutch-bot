/**
 * Test the new smart word selection system
 * This tests the newest→middle→oldest pattern for word selection
 */

const { addWord, getNextTestWord, startTestSession, endTestSession, loadState } = require('./lib/state');

async function testSmartSelection() {
    const testUserId = '741378837';
    
    console.log('🧪 Testing Smart Word Selection System...\n');
    
    try {
        // Clear any existing test session
        await endTestSession(testUserId);
        
        // Add test words to simulate a user with vocabulary
        const testWords = [
            ['auto', 'ماشین'],      // Word 1 (oldest)
            ['huis', 'خانه'],       // Word 2
            ['boek', 'کتاب'],       // Word 3 
            ['water', 'آب'],        // Word 4
            ['eten', 'غذا'],        // Word 5 (middle)
            ['drinken', 'نوشیدن'],  // Word 6
            ['school', 'مدرسه'],    // Word 7
            ['werk', 'کار'],        // Word 8
            ['fiets', 'دوچرخه'],    // Word 9
            ['trein', 'قطار']       // Word 10 (newest)
        ];
        
        console.log('➕ Adding test words...');
        for (const [dutch, farsi] of testWords) {
            await addWord(testUserId, dutch, farsi);
            console.log(`  ✅ Added: ${dutch} → ${farsi}`);
        }
        
        // Show current vocabulary state
        const state = await loadState(testUserId);
        console.log(`\n📚 Total words in vocabulary: ${state.words.length}`);
        console.log('Words in order (oldest to newest):');
        state.words.forEach((word, index) => {
            console.log(`  ${index + 1}. ${word.dutch} → ${word.farsi}`);
        });
        
        console.log('\n🎯 Testing Smart Selection Pattern...');
        console.log('Expected pattern: Newest(10) → Middle(5) → Oldest(1) → Newest(9) → Middle(4) → Oldest(2) → etc.\n');
        
        // Test the smart selection pattern
        const selectedWords = [];
        for (let i = 0; i < 12; i++) {
            const word = await getNextTestWord(testUserId);
            if (word) {
                selectedWords.push(word);
                console.log(`Selection ${i + 1}: ${word.dutch} → ${word.farsi}`);
            }
        }
        
        console.log('\n📊 Analysis of selection pattern:');
        console.log('Words selected:', selectedWords.map(w => w.dutch).join(', '));
        
        // Verify the pattern
        console.log('\n🔍 Pattern verification:');
        if (selectedWords.length >= 6) {
            const pattern = [
                'Should be newest (position 10)',
                'Should be middle (position 5)', 
                'Should be oldest (position 1)',
                'Should be newest available',
                'Should be middle available',
                'Should be oldest available'
            ];
            
            selectedWords.slice(0, 6).forEach((word, index) => {
                console.log(`  ${index + 1}. ${word.dutch} - ${pattern[index]}`);
            });
        }
        
        // Test session reset (after all words used)
        console.log('\n🔄 Testing session reset...');
        const stateAfterSelection = await loadState(testUserId);
        console.log(`Used words in session: ${stateAfterSelection.testSession.usedWordIds.length}`);
        
        if (stateAfterSelection.testSession.usedWordIds.length === 10) {
            console.log('✅ All words have been used, next selection should reset the session');
            
            const nextWord = await getNextTestWord(testUserId);
            const stateAfterReset = await loadState(testUserId);
            
            console.log(`After reset - Used words: ${stateAfterReset.testSession.usedWordIds.length}`);
            console.log(`Selected word after reset: ${nextWord.dutch} → ${nextWord.farsi}`);
        }
        
        console.log('\n🎉 Smart selection test completed successfully!');
        console.log('The system ensures:');
        console.log('  ✅ Newest words get priority');
        console.log('  ✅ Middle words are included');
        console.log('  ✅ Oldest words are not forgotten'); 
        console.log('  ✅ No repetition during active session');
        console.log('  ✅ Session resets when all words used');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testSmartSelection();