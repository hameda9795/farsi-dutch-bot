// Add 10 important Dutch words manually to test the system
const { addWord, getVocabularyStats } = require('./lib/state');

async function addImportantWords() {
    const testUserId = '741378837';
    
    console.log('➕ Adding important Dutch words for testing...\n');
    
    const importantWords = [
        ['kinderen', 'بچه‌ها'],
        ['moeder', 'مادر'],
        ['vader', 'پدر'],  
        ['leven', 'زندگی کردن'],
        ['moment', 'لحظه'],
        ['plaats', 'جای'],
        ['eerste', 'اول'],
        ['tweede', 'دوم'],
        ['kleine', 'کوچک'],
        ['komen', 'آمدن'],
        ['gaan', 'رفتن'],
        ['maken', 'ساختن'],
        ['zien', 'دیدن'],
        ['weten', 'دانستن'],
        ['tijd', 'زمان']
    ];
    
    try {
        for (const [dutch, farsi] of importantWords) {
            await addWord(testUserId, dutch, farsi);
            console.log(`✅ Added: ${dutch} → ${farsi}`);
        }
        
        console.log('\n📊 Final statistics:');
        const stats = await getVocabularyStats(testUserId);
        console.log('Stats:', stats);
        
        console.log(`\n🎉 Successfully added ${importantWords.length} important Dutch words!`);
        console.log('✅ Now you have enough words for testing!');
        
    } catch (error) {
        console.error('❌ Failed to add words:', error);
    }
}

addImportantWords();