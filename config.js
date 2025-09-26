/**
 * Bot Configuration File
 * Modify these settings to control bot behavior
 */

module.exports = {
    // Channel Membership Settings
    CHANNEL_MEMBERSHIP: {
        // Set to true to require channel membership, false to disable
        REQUIRED: true,
        
        // Channel username (with @)
        CHANNEL_USERNAME: '@parsibrug',
        
        // Channel invite link
        CHANNEL_LINK: 'https://t.me/parsibrug',
        
        // What to do when membership check fails due to API limitations
        // Options: 'allow' (allow access), 'block' (deny access), 'manual' (require manual verification)
        ON_CHECK_FAILURE: 'block',
        
        // Automatic membership checking (bot is now admin of channel)
        AUTO_CHECK: {
            // Enable automatic real-time checking (bot must be admin)
            ENABLED: true,
            
            // Immediate action when user leaves channel
            INSTANT_BLOCK: true,
            
            // Show warning message when user loses membership
            SHOW_WARNING: true
        },
        
        // Security settings for continuous membership checking
        SECURITY: {
            // Check membership on every interaction (most secure)
            CHECK_ON_EVERY_MESSAGE: true,
            
            // Cache membership status for X minutes (0 = no cache, always check)
            CACHE_MINUTES: 5, // Check every 5 minutes max
            
            // Warn user before blocking them
            WARN_BEFORE_BLOCK: true,
            
            // How many warnings before blocking
            WARNING_COUNT: 2
        },
        
        // Custom messages
        MESSAGES: {
            MEMBERSHIP_REQUIRED: `🔐 **برای استفاده از این ربات، لطفاً عضو کانال زیر شوید:**

برای دسترسی به تمام امکانات ربات، عضویت در کانال ما الزامی است.

پس از عضویت، دکمه /start را مجدداً فشار دهید.`,

            MEMBERSHIP_VERIFIED: '✅ عضویت شما تأیید شد! خوش آمدید 🎉\n\nاکنون می‌تونید از تمام امکانات ربات استفاده کنید.',
            
            MEMBERSHIP_FAILED: '❌ متاسفانه هنوز عضو کانال نشده‌اید.\n\nلطفاً ابتدا عضو کانال شوید، سپس دکمه زیر را فشار دهید.',
            
            JOIN_BUTTON: '🔗 عضویت در کانال',
            
            RECHECK_BUTTON: '✅ عضو شدم - بررسی مجدد',
            
            // New security messages
            MEMBERSHIP_LOST: '🚫 **دسترسی شما به ربات قطع شد!**\n\nمتوجه شدیم که کانال ما را ترک کرده‌اید. برای ادامه استفاده از ربات، مجدداً عضو شوید.',
            
            WARNING_MESSAGE: '⚠️ **هشدار امنیتی!**\n\nبه نظر می‌رسد کانال ما را ترک کرده‌اید. اگر این اشتباه است، لطفاً دکمه زیر را فشار دهید.\n\n🔴 در صورت عدم عضویت، دسترسی‌تان قطع خواهد شد.',
            
            FINAL_WARNING: '🔴 **آخرین هشدار!**\n\nاین آخرین فرصت شما برای تأیید عضویت است. پس از این، دسترسی‌تان به طور کامل قطع می‌شود.'
        }
    },

    // Admin Settings
    ADMIN: {
        // Your user ID (for admin commands)
        USER_ID: 741378837
    },

    // Bot Behavior
    BEHAVIOR: {
        // Maximum input length for translations
        MAX_INPUT_LENGTH: 500,
        
        // Auto-cleanup settings
        AUTO_CLEANUP: {
            ENABLED: true,
            DAYS_THRESHOLD: 30,
            INTERVAL_HOURS: 24
        }
    }
};