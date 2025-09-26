// Add more words to reach 10+ for testing
const { addWord } = require('./lib/state');

async function add10Words() {
    const testUserId = '741378837';
    
    console.log('➕ Adding 10+ words for testing...\n');
    
    const words = [
        ['auto', 'ماشین'],
        ['fiets', 'دوچرخه'], 
        ['trein', 'قطار'],
        ['vliegtuig', 'هواپیما'],
        ['school', 'مدرسه'],
        ['werk', 'کار'],
        ['eten', 'غذا'],
        ['drinken', 'نوشیدن'],
        ['lopen', 'راه رفتن'],
        ['rennen', 'دویدن'],
        ['zitten', 'نشستن'],
        ['staan', 'ایستادن']
    ];
    
    try {
        for (const [dutch, farsi] of words) {
            await addWord(testUserId, dutch, farsi);
            console.log(`✅ Added: ${dutch} → ${farsi}`);
        }
        
        console.log('\n🎉 Successfully added 12 words! Ready for testing!');
        
    } catch (error) {
        console.error('❌ Failed to add words:', error);
    }
}

add10Words();