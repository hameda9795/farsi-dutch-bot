# 🧹 Auto-Cleanup System

سیستم **پاکسازی خودکار** برای حذف automatic اطلاعات کاربران غیرفعال و block شده.

## 🔧 ویژگی‌ها

### ✅ **تشخیص خودکار کاربران Block شده**
- ربات تلاش می‌کند با `getChat()` به کاربران دسترسی پیدا کند
- اگر خطای "blocked", "deactivated" یا "not found" دریافت شود، کاربر به عنوان block شده شناخته می‌شود
- فایل database آن کاربر خودکار حذف می‌شود

### ⏰ **تشخیص کاربران غیرفعال**
- کاربرانی که بیش از **30 روز** فعالیت نداشته‌اند
- بر اساس آخرین تغییر فایل database (`lastModified`)
- قابل تنظیم از طریق `INACTIVE_DAYS_THRESHOLD`

### 🕐 **اجرای دوره‌ای**
- هر **24 ساعت** یکبار اجرا می‌شود
- در شروع ربات نیز یکبار اجرا می‌شود (با تأخیر 5 ثانیه)
- قابل تنظیم از طریق `CLEANUP_INTERVAL_HOURS`

## ⚙️ **تنظیمات**

```javascript
const INACTIVE_DAYS_THRESHOLD = 30; // کاربران غیرفعال بالای 30 روز
const CLEANUP_INTERVAL_HOURS = 24;  // اجرا هر 24 ساعت
```

## 🎯 **نحوه کار**

### 1. **تشخیص کاربران Block شده**
```javascript
// تلاش برای دسترسی به chat
await bot.getChat(chatId);
// اگر خطا باشد → کاربر block شده
```

### 2. **بررسی کاربران غیرفعال**
```javascript
// بررسی آخرین فعالیت
const daysSinceLastActivity = (Date.now() - lastModified) / (1000 * 60 * 60 * 24);
return daysSinceLastActivity > INACTIVE_DAYS_THRESHOLD;
```

### 3. **حذف فایل Database**
```javascript
// حذف فایل JSON کاربر
await fs.unlink(path.join(__dirname, '..', 'db', `${chatId}.json`));
```

## 🚀 **فعال‌سازی خودکار**

در `bot.js`:
```javascript
const { startAutoCleanup } = require('./utils/autoCleanup');

// شروع سیستم cleanup
startAutoCleanup(bot);
```

## 🔧 **دستور Admin دستی**

```javascript
/cleanup  // اجرای دستی cleanup (فقط برای admin)
```

## 📊 **Log نمونه**

```
🚀 Auto-cleanup started (30 days threshold, 24h interval)
🔄 Running automatic cleanup...
📋 Found 2 potentially blocked users
⏰ User 123456789 inactive for 30+ days
🗑️ Cleaned up inactive user data: 123456789
🗑️ Cleaned up inactive user data: 987654321
✅ Cleanup completed: 2 user(s) cleaned
```

## 🛡️ **حفاظت از اطلاعات**

- **فقط کاربران واقعاً غیرفعال**: بیش از 30 روز
- **تشخیص دقیق Block**: فقط در صورت خطای مشخص
- **Log کامل**: تمام عملیات ثبت می‌شود
- **Admin Control**: امکان cleanup دستی

## 📁 **فایل‌های مرتبط**

- `utils/autoCleanup.js` - منطق اصلی cleanup
- `bot.js` - فعال‌سازی سیستم
- `test-cleanup.js` - تست سیستم
- `db/*.json` - فایل‌های database کاربران

---

**✨ نتیجه:** کاربران وقتی ربات رو block/delete می‌کنند، اطلاعاتشون automatic پاک می‌شه! 🎉