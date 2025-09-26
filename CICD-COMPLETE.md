# ✅ راه‌اندازی کامل CI/CD برای بات فارسی-هلندی

## وضعیت فعلی:
- ✅ بات روی سرور Hetzner deploy شده (91.99.49.208)
- ✅ PM2 برای اجرای دائمی نصب شده
- ✅ بات در تلگرام تست شده و کار می‌کند
- ✅ GitHub Actions workflow آماده شده

## 🚀 نحوه استفاده از سیستم خودکار:

### مرحله 1: تنظیم GitHub Secrets (یکبار)

1. برید به: https://github.com/hameda9795/farsi-dutch-bot/settings/secrets/actions
2. این 3 secret را اضافه کنید:

```
Name: HETZNER_HOST
Value: 91.99.49.208

Name: HETZNER_USER  
Value: root

Name: HETZNER_PASSWORD
Value: [your_server_password]
```

### مرحله 2: تست سیستم

```bash
# روش 1: استفاده از script آماده
push-and-deploy.bat

# روش 2: دستی
git add .
git commit -m "Test auto deploy"
git push origin master
```

### مرحله 3: مشاهده نتایج

1. برید به: https://github.com/hameda9795/farsi-dutch-bot/actions
2. آخرین workflow را ببینید
3. اگر سبز شد ✅ = deploy موفق
4. اگر قرمز شد ❌ = خطا (جزئیات را ببینید)

## 📋 چه کاری انجام می‌شود:

### هر وقت `git push` کنید:
1. 🔄 GitHub Actions شروع می‌شود
2. 📦 Dependencies نصب می‌شود
3. 🧪 تست‌ها اجرا می‌شود (اگر وجود داشته باشد)
4. 📤 فایل‌ها روی سرور کپی می‌شود
5. 🔄 بات با PM2 restart می‌شود
6. ✅ گزارش نهایی

### فایل‌هایی که آپلود می‌شود:
- ✅ همه فایل‌های .js
- ✅ package.json
- ✅ فولدرهای services/, utils/, lib/, data/, db/
- ✅ ecosystem.config.js
- ❌ node_modules (روی سرور نصب می‌شود)
- ❌ .env (محفوظ می‌ماند)
- ❌ فایل‌های .log

## 🔒 امنیت:

- پسورد سرور در GitHub Secrets محفوظ است
- فایل .env روی سرور تغییر نمی‌کند
- Backup خودکار قبل از هر deploy

## 🛠️ مانیتورینگ:

### مشاهده وضعیت deploy:
- GitHub Actions: https://github.com/hameda9795/farsi-dutch-bot/actions

### مشاهده وضعیت بات روی سرور:
```bash
ssh root@91.99.49.208
pm2 status
pm2 logs farsi-dutch-bot
```

## 🎯 مثال استفاده:

### سناریو: می‌خواهید پیام خوشامدگویی را تغییر دهید

1. فایل `bot.js` را ویرایش کنید
2. تغییرات را ذخیره کنید
3. دستور بزنید: `push-and-deploy.bat`
4. پیام commit وارد کنید: "Update welcome message"
5. 2-3 دقیقه صبر کنید
6. ✅ بات در تلگرام با پیام جدید کار می‌کند!

## 🚨 عیب‌یابی:

### اگر deploy ناموفق بود:
1. برید به GitHub Actions و خطا را ببینید
2. معمولاً مشکل از اتصال SSH یا مشکل کد است
3. مشکل را حل کنید و دوباره push کنید

### اگر بات کار نمی‌کند:
```bash
ssh root@91.99.49.208
cd /home/farsi-dutch-bot
pm2 logs farsi-dutch-bot --lines 50
```

---

## 🎉 تبریک! سیستم CI/CD شما آماده است!

از این به بعد، هر تغییری که در کد بدهید و push کنید، خودکار روی سرور اعمال می‌شود و بات شما همیشه با آخرین نسخه کد اجرا می‌شود! 🚀