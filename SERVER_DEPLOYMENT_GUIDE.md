# 🚀 Server Deployment Guide - Important Words System

## ⚠️ CRITICAL: Data Safety Instructions

### 🛡️ Before Deployment on Server:

1. **Backup Current Database** (if exists):
   ```bash
   cp -r db/ db_backup_$(date '+%Y%m%d_%H%M%S')
   ```

2. **Stop Bot Service**:
   ```bash
   pm2 stop farsi-dutch-bot
   ```

### 📥 Deploy New Version:

3. **Pull Latest Changes**:
   ```bash
   git pull origin master
   ```

4. **Install Dependencies** (production only):
   ```bash
   npm install --production
   ```

5. **Verify Database Preserved**:
   ```bash
   ls -la db/
   # Should show existing user files (*.json)
   ```

6. **Start Bot Service**:
   ```bash
   pm2 start farsi-dutch-bot
   # OR
   pm2 restart farsi-dutch-bot
   ```

### ✅ Verify Deployment:

7. **Check Bot Status**:
   ```bash
   pm2 status
   pm2 logs farsi-dutch-bot --lines 20
   ```

8. **Test New Features**:
   - Send message to bot
   - Try test feature: "📝 تست"
   - Check marking: "⭐ نشان کردن کلمه"
   - View marked words: "⭐ کلمات نشان شده"

## 🎯 New Features Deployed:

### ⭐ Important Words System
- **Button Added**: "⭐ کلمات نشان شده" in main menu
- **Test Flow Updated**: Mark button appears AFTER answering test questions
- **Dynamic Buttons**: Button text changes from "نشان کردن" to "نشان شد"
- **Preserved Data**: All existing user vocabularies remain intact

### 🔄 Technical Changes:
- `lib/state.js`: Added important words management functions
- `bot.js`: New keyboard layout and callback handlers  
- `utils/messageFormatter.js`: Updated test response formatting
- `.gitignore`: Enhanced to protect user data

## 🔒 Data Safety Guarantees:

### ✅ What's Protected:
- **User Vocabularies**: All existing words preserved
- **Test Scores**: Historical data maintained
- **User States**: Session data intact
- **Important Words**: New feature data stored safely

### ❌ What's NOT in Git:
- `db/` folder - user databases
- `test-*.js` files - development tests
- `.env` files - sensitive tokens
- Documentation files - dev-only content

## 🚨 Emergency Recovery:

If something goes wrong:

1. **Restore Database**:
   ```bash
   rm -rf db/
   cp -r db_backup_YYYYMMDD_HHMMSS/ db/
   ```

2. **Restart Bot**:
   ```bash
   pm2 restart farsi-dutch-bot
   ```

3. **Check Logs**:
   ```bash
   pm2 logs farsi-dutch-bot --lines 50
   ```

## 📊 Expected Log Messages:

After successful deployment, you should see:
```
✅ Bot is admin of @parsibrug channel
✅ Real-time membership checking active  
🚀 Farsi-Dutch Telegram Bot is running!
✅ Automatic content generation system activated
```

## 🎉 Success Indicators:

- Bot responds to messages
- New keyboard shows "⭐ کلمات نشان شده" button
- Tests work with new marking flow
- User data from before deployment is accessible
- No errors in PM2 logs

---

**📅 Deployed**: 2025-09-26  
**📦 Version**: Important Words System v1.0  
**🔐 Data Safety**: ✅ Guaranteed - No user data loss