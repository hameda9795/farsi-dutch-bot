const { addMessage, loadState } = require('./lib/state');

async function testSaving() {
    const chatId = '741378837';
    
    console.log('Testing save functionality...');
    
    try {
        // Test saving a simple word
        await addMessage(chatId, 'خانه جدید', 'nieuw huis', 'sentence');
        console.log('✅ Test sentence saved successfully');
        
        // Load and display current state
        const state = await loadState(chatId);
        console.log(`📊 Total messages: ${state.messages.length}`);
        console.log(`🆔 Last message ID: ${state.messages[state.messages.length - 1]?.id}`);
        console.log(`📝 Last message: ${state.messages[state.messages.length - 1]?.fa} -> ${state.messages[state.messages.length - 1]?.nl}`);
        
    } catch (error) {
        console.error('❌ Error in test:', error);
    }
}

testSaving();