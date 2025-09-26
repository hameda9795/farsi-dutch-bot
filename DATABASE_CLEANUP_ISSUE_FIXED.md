# حل مشکل پاک شدن اطلاعات کاربران

## 🔴 مشکل شناسایی شده

تاریخ: 26 سپتامبر 2025

**علت**: سیستم پاکسازی خودکار (Auto Cleanup) که هر 24 ساعت اجرا می‌شد و اطلاعات کاربران غیرفعال (30+ روز) و بلاک شده‌ها را پاک می‌کرد.

## 📍 محل مشکل

فایل‌های تأثیرگذار:
- `utils/autoCleanup.js` - منطق پاکسازی
- `bot.js` خط 2035 - فعالسازی سیستم
- `bot-backup.js` خط 1737 - فعالسازی سیستم

## 🔧 راه‌حل اعمال شده

سیستم پاکسازی خودکار **غیرفعال** شده است:

### در فایل `bot.js`:
```javascript
// قبل از تغییر:
startAutoCleanup(bot);
console.log('✅ Auto-cleanup system activated');

// بعد از تغییر:
// startAutoCleanup(bot); // DISABLED: Keep all user data permanently
// console.log('✅ Auto-cleanup system activated');
```

### در فایل `bot-backup.js`:
همین تغییر اعمال شده.

## ✅ نتیجه

- **تمام اطلاعات کاربران برای همیشه حفظ خواهد شد**
- دیگر هیچ فایل کاربری پاک نخواهد شد
- کلمات و پیشرفت یادگیری کاربران محفوظ می‌ماند

## 🚀 Deploy کردن تغییرات

برای اعمال این تغییرات روی سرور:

```bash
git add .
git commit -m "Disable auto-cleanup: Keep all user data permanently"
git push origin master
```

سپس deploy کردن:
```bash
ssh root@91.99.49.208 "cd /home/farsi-dutch-bot && git pull origin master && pm2 restart farsi-dutch-bot"
```

## 📝 نکات مهم

1. **بکاپ دیتا**: توصیه می‌شود دوره‌ای از پوشه `db/` بکاپ تهیه کنید
2. **مانیتورینگ**: حجم دیسک سرور را نظارت کنید
3. **دسترسی دستی**: همچنان می‌توانید با دستور `/cleanup` (فقط admin) پاکسازی دستی انجام دهید

## 🔍 کدهای مربوطه

فایل `utils/autoCleanup.js` همچنان موجود است ولی فعال نیست:
- `INACTIVE_DAYS_THRESHOLD = 30` روز
- `CLEANUP_INTERVAL_HOURS = 24` ساعت
- منطق تشخیص کاربران بلاک شده
- منطق تشخیص کاربران غیرفعال

در صورت نیاز می‌توان دوباره فعال کرد، ولی **توصیه نمی‌شود**.