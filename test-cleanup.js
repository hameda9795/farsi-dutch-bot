/**
 * Test Auto-Cleanup System
 * Tests the automatic database cleanup functionality
 */

const { 
    isUserInactive, 
    deleteUserData, 
    detectBlockedUsers,
    INACTIVE_DAYS_THRESHOLD 
} = require('./utils/autoCleanup');
const fs = require('fs').promises;
const path = require('path');

async function testCleanupSystem() {
    console.log('🧪 Testing Auto-Cleanup System...\n');
    
    // Test 1: Check if test user files exist
    console.log('📋 Test 1: Checking existing user files...');
    const dbDir = path.join(__dirname, 'db');
    
    try {
        const files = await fs.readdir(dbDir);
        const userFiles = files.filter(f => f.match(/^\d+\.json$/));
        console.log(`   Found ${userFiles.length} user files:`, userFiles);
    } catch (error) {
        console.error('   ❌ Error reading db directory:', error.message);
        return;
    }
    
    // Test 2: Create a dummy old file to test inactive detection
    console.log('\n📋 Test 2: Creating dummy inactive file...');
    const dummyUserId = '999999999';
    const dummyFilePath = path.join(dbDir, `${dummyUserId}.json`);
    
    try {
        // Create dummy file with old data
        const dummyData = {
            words: [
                { id: 1, dutch: 'test', farsi: 'تست' }
            ],
            currentTest: null,
            testScore: 0,
            testTotal: 0
        };
        
        await fs.writeFile(dummyFilePath, JSON.stringify(dummyData, null, 2));
        console.log(`   ✅ Created dummy file: ${dummyUserId}.json`);
        
        // Make it look old by changing the modification time
        const oldDate = new Date(Date.now() - (INACTIVE_DAYS_THRESHOLD + 1) * 24 * 60 * 60 * 1000);
        await fs.utimes(dummyFilePath, oldDate, oldDate);
        console.log(`   ✅ Set file date to ${INACTIVE_DAYS_THRESHOLD + 1} days ago`);
        
    } catch (error) {
        console.error('   ❌ Error creating dummy file:', error.message);
        return;
    }
    
    // Test 3: Check inactive detection
    console.log('\n📋 Test 3: Testing inactive detection...');
    try {
        const isInactive = await isUserInactive(dummyUserId);
        console.log(`   Dummy user inactive status: ${isInactive ? '✅ INACTIVE' : '❌ ACTIVE'}`);
        
        if (!isInactive) {
            console.log('   ❌ Expected user to be inactive!');
        }
    } catch (error) {
        console.error('   ❌ Error checking inactive status:', error.message);
    }
    
    // Test 4: Test deletion
    console.log('\n📋 Test 4: Testing file deletion...');
    try {
        const deleted = await deleteUserData(dummyUserId);
        console.log(`   Deletion result: ${deleted ? '✅ SUCCESS' : '❌ FAILED'}`);
        
        // Verify file is gone
        try {
            await fs.access(dummyFilePath);
            console.log('   ❌ File still exists after deletion!');
        } catch (error) {
            console.log('   ✅ File successfully deleted');
        }
    } catch (error) {
        console.error('   ❌ Error during deletion test:', error.message);
    }
    
    // Test 5: Check real users (without deleting)
    console.log('\n📋 Test 5: Checking real user activity...');
    try {
        const files = await fs.readdir(dbDir);
        const realUsers = files
            .filter(f => f.match(/^\d+\.json$/) && f !== `${dummyUserId}.json`)
            .map(f => f.replace('.json', ''));
        
        for (const userId of realUsers) {
            const inactive = await isUserInactive(userId);
            const stats = await fs.stat(path.join(dbDir, `${userId}.json`));
            const daysOld = Math.floor((Date.now() - stats.mtime) / (1000 * 60 * 60 * 24));
            
            console.log(`   User ${userId}: ${daysOld} days old, ${inactive ? 'INACTIVE' : 'ACTIVE'}`);
        }
    } catch (error) {
        console.error('   ❌ Error checking real users:', error.message);
    }
    
    console.log('\n✅ Cleanup system test completed!');
    console.log(`\n📊 Settings:`);
    console.log(`   • Inactive threshold: ${INACTIVE_DAYS_THRESHOLD} days`);
    console.log(`   • Bot checks for blocked/inactive users every 24 hours`);
    console.log(`   • Database files are automatically cleaned up`);
}

// Run the test
testCleanupSystem().catch(console.error);