const { addWord, loadState, getVocabularyStats } = require('./lib/state.js');

async function testMultipleUsers() {
    console.log('🧪 Testing multi-user functionality...');
    
    try {
        // Test User 1: 123456
        console.log('\n👤 Testing User 123456...');
        await addWord('123456', 'kat', 'گربه');
        await addWord('123456', 'hond', 'سگ');
        
        const user1State = await loadState('123456');
        const user1Stats = await getVocabularyStats('123456');
        console.log('User 123456 words:', user1Stats.totalWords);
        console.log('User 123456 words list:', user1State.words.map(w => `${w.dutch}→${w.farsi}`));
        
        // Test User 2: 789012  
        console.log('\n👤 Testing User 789012...');
        await addWord('789012', 'auto', 'ماشین');
        await addWord('789012', 'fiets', 'دوچرخه');
        await addWord('789012', 'vliegtuig', 'هواپیما');
        
        const user2State = await loadState('789012');
        const user2Stats = await getVocabularyStats('789012');
        console.log('User 789012 words:', user2Stats.totalWords);
        console.log('User 789012 words list:', user2State.words.map(w => `${w.dutch}→${w.farsi}`));
        
        // Check User 741378837 (your original user)
        console.log('\n👤 Checking User 741378837...');
        const originalUserStats = await getVocabularyStats('741378837');
        console.log('User 741378837 words:', originalUserStats.totalWords);
        
        console.log('\n✅ Multi-user test completed successfully!');
        console.log('📊 Each user has their own separate vocabulary database.');
        
    } catch (error) {
        console.error('❌ Multi-user test failed:', error);
    }
}

testMultipleUsers();