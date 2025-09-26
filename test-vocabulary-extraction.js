// Test translation and vocabulary extraction
const { handleTranslateMode } = require('./bot'); // This won't work directly, but let's test the addWord function

const { addWord, getVocabularyStats, loadState } = require('./lib/state');

async function testVocabularyExtraction() {
    const testUserId = '741378837';
    
    console.log('🧪 Testing vocabulary extraction and storage...\n');
    
    // Add some sample words as if they were extracted from translation
    const sampleWords = [
        ['kinderen', 'بچه‌ها'],
        ['moeder', 'مادر'],
        ['leven', 'زندگی کردن'],
        ['moment', 'لحظه'],
        ['plaats', 'جای'],
        ['eerste', 'اول'],
        ['tweede', 'دوم'],
        ['gewoon', 'عادی'],
        ['kleine', 'کوچک'],
        ['komen', 'آمدن']
    ];
    
    console.log('➕ Adding extracted vocabulary words...');
    for (const [dutch, farsi] of sampleWords) {
        try {
            await addWord(testUserId, dutch, farsi);
            console.log(`✅ Added: ${dutch} → ${farsi}`);
        } catch (error) {
            console.error(`❌ Failed to add ${dutch}:`, error.message);
        }
    }
    
    console.log('\n📊 Checking final statistics...');
    const stats = await getVocabularyStats(testUserId);
    console.log('Final stats:', stats);
    
    console.log('\n📖 Loading state to verify...');
    const state = await loadState(testUserId);
    console.log(`Total words in database: ${state.words.length}`);
    
    if (state.words.length >= 10) {
        console.log('\n🎉 Great! We have 10+ words. Testing should work now!');
    } else {
        console.log(`\n⚠️ Only ${state.words.length} words. Need ${10 - state.words.length} more for optimal testing.`);
    }
}

testVocabularyExtraction();