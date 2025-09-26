const { loadState } = require('./lib/state.js');

async function testStateLoading() {
    try {
        console.log('Testing state loading for user 741378837...');
        
        const state = await loadState('741378837');
        
        console.log('State loaded successfully:');
        console.log('- Words array exists:', !!state.words);
        console.log('- Number of words:', state.words ? state.words.length : 0);
        console.log('- First few words:', state.words ? state.words.slice(0, 3) : 'No words');
        
        if (state.words && state.words.length > 0) {
            console.log('✅ State is loaded correctly with', state.words.length, 'words');
        } else {
            console.log('❌ State has no words');
        }
        
    } catch (error) {
        console.error('❌ Error loading state:', error);
    }
}

testStateLoading();