const { addWord, loadState, getVocabularyStats } = require('./lib/state.js');

async function testSpecificUser() {
    const testUserId = '6730581636'; // The user from terminal logs
    
    console.log(`🧪 Testing user ID: ${testUserId}`);
    
    try {
        // Manually add a word for this user
        console.log('📝 Adding test word...');
        await addWord(testUserId, 'test', 'تست');
        
        // Check if it was saved
        const state = await loadState(testUserId);
        const stats = await getVocabularyStats(testUserId);
        
        console.log('✅ Results:');
        console.log('- State exists:', !!state);
        console.log('- Words array exists:', !!state.words);
        console.log('- Total words:', stats.totalWords);
        console.log('- Words:', state.words);
        
        // Check if file was created
        const fs = require('fs').promises;
        const path = require('path');
        const filePath = path.join('./db', `${testUserId}.json`);
        
        try {
            await fs.access(filePath);
            console.log('✅ File exists:', filePath);
            
            const content = await fs.readFile(filePath, 'utf8');
            console.log('📄 File content:', JSON.parse(content));
        } catch (error) {
            console.log('❌ File does not exist:', filePath);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testSpecificUser();