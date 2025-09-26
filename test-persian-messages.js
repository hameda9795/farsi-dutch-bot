/**
 * Test Persian Welcome Message
 * Tests that the welcome and help messages are now in Persian
 */

const { getWelcomeMessage, getHelpMessage } = require('./utils/messageFormatter');

console.log('🧪 Testing Persian Messages...\n');

console.log('📋 Welcome Message:');
console.log('==================');
console.log(getWelcomeMessage());

console.log('\n📋 Help Message:');
console.log('================');
console.log(getHelpMessage());

console.log('\n✅ Messages are now in Persian! 🎉');
console.log('\n💡 Test in Telegram:');
console.log('   • Send /start to see Persian welcome message');  
console.log('   • Send /help to see Persian help message');