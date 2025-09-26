const fs = require('fs').promises;
const path = require('path');

// Configuration
const INACTIVE_DAYS_THRESHOLD = 30; // Users inactive for 30 days
const CLEANUP_INTERVAL_HOURS = 24;  // Run cleanup every 24 hours

/**
 * Check if a user is inactive based on last activity
 */
async function isUserInactive(chatId) {
    const dbPath = path.join(__dirname, '..', 'db', `${chatId}.json`);
    
    try {
        const stats = await fs.stat(dbPath);
        const lastModified = stats.mtime;
        const daysSinceLastActivity = (Date.now() - lastModified) / (1000 * 60 * 60 * 24);
        
        return daysSinceLastActivity > INACTIVE_DAYS_THRESHOLD;
    } catch (error) {
        // File doesn't exist or other error
        return false;
    }
}

/**
 * Delete user database file
 */
async function deleteUserData(chatId) {
    const dbPath = path.join(__dirname, '..', 'db', `${chatId}.json`);
    
    try {
        await fs.unlink(dbPath);
        console.log(`🗑️  Cleaned up inactive user data: ${chatId}`);
        return true;
    } catch (error) {
        console.error(`Error deleting user data for ${chatId}:`, error);
        return false;
    }
}

/**
 * Get all user database files
 */
async function getAllUserFiles() {
    const dbDir = path.join(__dirname, '..', 'db');
    
    try {
        const files = await fs.readdir(dbDir);
        return files
            .filter(file => file.endsWith('.json') && file.match(/^\d+\.json$/))
            .map(file => file.replace('.json', ''));
    } catch (error) {
        console.error('Error reading database directory:', error);
        return [];
    }
}

/**
 * Attempt to detect blocked users by sending a test message
 */
async function detectBlockedUsers(bot) {
    const userIds = await getAllUserFiles();
    const blockedUsers = [];
    
    for (const chatId of userIds) {
        try {
            // Try to get chat info - this will fail if bot is blocked
            await bot.getChat(chatId);
        } catch (error) {
            if (error.code === 'ETELEGRAM' && 
                (error.response?.body?.description?.includes('blocked') ||
                 error.response?.body?.description?.includes('deactivated') ||
                 error.response?.body?.description?.includes('not found'))) {
                blockedUsers.push(chatId);
            }
        }
    }
    
    return blockedUsers;
}

/**
 * Run automatic cleanup
 */
async function runAutoCleanup(bot) {
    console.log('🔄 Running automatic cleanup...');
    
    let cleanedCount = 0;
    
    try {
        // 1. Check for blocked users
        const blockedUsers = await detectBlockedUsers(bot);
        console.log(`📋 Found ${blockedUsers.length} potentially blocked users`);
        
        for (const chatId of blockedUsers) {
            const deleted = await deleteUserData(chatId);
            if (deleted) cleanedCount++;
        }
        
        // 2. Check for inactive users
        const allUsers = await getAllUserFiles();
        
        for (const chatId of allUsers) {
            if (blockedUsers.includes(chatId)) continue; // Already processed
            
            const inactive = await isUserInactive(chatId);
            if (inactive) {
                console.log(`⏰ User ${chatId} inactive for ${INACTIVE_DAYS_THRESHOLD}+ days`);
                const deleted = await deleteUserData(chatId);
                if (deleted) cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`✅ Cleanup completed: ${cleanedCount} user(s) cleaned`);
        } else {
            console.log('✅ Cleanup completed: No users to clean');
        }
        
    } catch (error) {
        console.error('❌ Cleanup error:', error);
    }
}

/**
 * Start automatic cleanup scheduler
 */
function startAutoCleanup(bot) {
    console.log(`🚀 Auto-cleanup started (${INACTIVE_DAYS_THRESHOLD} days threshold, ${CLEANUP_INTERVAL_HOURS}h interval)`);
    
    // Run immediately on startup
    setTimeout(() => runAutoCleanup(bot), 5000); // 5 seconds delay
    
    // Schedule regular cleanup
    setInterval(() => {
        runAutoCleanup(bot);
    }, CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000);
}

/**
 * Manual cleanup function
 */
async function manualCleanup(bot) {
    return await runAutoCleanup(bot);
}

module.exports = {
    startAutoCleanup,
    manualCleanup,
    deleteUserData,
    isUserInactive,
    detectBlockedUsers,
    INACTIVE_DAYS_THRESHOLD,
    CLEANUP_INTERVAL_HOURS
};