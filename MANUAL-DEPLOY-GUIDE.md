# راهنمای Deploy دستی روی سرور Hetzner

## مرحله 1: Push کردن تغییرات به GitHub
```bash
# در VS Code Terminal یا PowerShell
git add .
git commit -m "your commit message"
git push origin master
```

## مرحله 2: اتصال به سرور و Deploy دستی

### روش A: یک خط (سریع)
```bash
ssh root@91.99.49.208 "cd /home/farsi-dutch-bot && git pull origin master && npm install && pm2 restart farsi-dutch-bot && pm2 status"
```

### روش B: مرحله به مرحله (دقیق‌تر)
```bash
# اتصال به سرور
ssh root@91.99.49.208

# رفتن به directory پروژه
cd /home/farsi-dutch-bot

# دریافت آخرین تغییرات از GitHub
git pull origin master

# نصب dependencies جدید (در صورت وجود)
npm install

# Restart بات با PM2
pm2 restart farsi-dutch-bot

# بررسی وضعیت
pm2 status

# مشاهده logs (اختیاری)
pm2 logs farsi-dutch-bot --lines 10

# خروج از سرور
exit
```

## مرحله 3: Deploy بدون Git (اگر Git روی سرور نصب نیست)

### استفاده از SCP برای کپی فایل‌ها
```bash
# کپی تمام فایل‌ها
scp -r . root@91.99.49.208:/home/farsi-dutch-bot/ --exclude node_modules --exclude .git

# یا فقط فایل‌های خاص
scp bot.js server.js package.json root@91.99.49.208:/home/farsi-dutch-bot/

# سپس اتصال و restart
ssh root@91.99.49.208 "cd /home/farsi-dutch-bot && npm install && pm2 restart farsi-dutch-bot"
```

## مرحله 4: Deploy فقط فایل‌های خاص

### اگر فقط یک فایل تغییر کرده:
```bash
# مثلاً فقط bot.js تغییر کرده
scp bot.js root@91.99.49.208:/home/farsi-dutch-bot/
ssh root@91.99.49.208 "cd /home/farsi-dutch-bot && pm2 restart farsi-dutch-bot"
```

### اگر فقط package.json تغییر کرده:
```bash
scp package.json root@91.99.49.208:/home/farsi-dutch-bot/
ssh root@91.99.49.208 "cd /home/farsi-dutch-bot && npm install && pm2 restart farsi-dutch-bot"
```

## مرحله 5: بررسی نتایج

### روی سرور:
```bash
ssh root@91.99.49.208
pm2 status                     # وضعیت بات
pm2 logs farsi-dutch-bot       # logs اخیر
pm2 monit                      # monitoring
```

### تست بات در تلگرام:
- پیام بفرستید و ببینید آیا تغییرات اعمال شده

## Script های آماده شما:

1. **manual-deploy.bat** - Deploy کامل با Git
2. **push-and-deploy.bat** - فقط push (GitHub Actions خودکار deploy می‌کند)
3. **quick-deploy.bat** - Deploy سریع با SCP

## نکات مهم:

- اگر فایل `.env` را تغییر دادید، باید دستی روی سرور کپی کنید
- اگر `package.json` تغییر کرده، حتماً `npm install` اجرا کنید  
- همیشه بعد از تغییرات `pm2 restart` کنید
- برای اطمینان `pm2 status` و `pm2 logs` چک کنید

## عیب‌یابی:

اگر مشکلی پیش آمد:
```bash
ssh root@91.99.49.208
cd /home/farsi-dutch-bot
pm2 kill                       # کشتن تمام پروسه‌ها
pm2 start ecosystem.config.js  # شروع مجدد
```

ssh root@91.99.49.208 "cd /home/farsi-dutch-bot && git pull origin master && pm2 restart farsi-dutch-bot"