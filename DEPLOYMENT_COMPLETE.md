# ✅ تکمیل Deploy پروژه بات فارسی-هلندی روی سرور Hetzner

## ✅ کارهای انجام شده:

### 1. آپلود فایل‌ها
- ✅ تمام فایل‌های پروژه روی سرور آپلود شد
- ✅ Directory `/home/farsi-dutch-bot` ساخته شد
- ✅ فایل‌های main: `server.js`, `bot.js`, `package.json`, `ecosystem.config.js`
- ✅ Directory های: `services/`, `utils/`, `lib/`, `data/`, `db/`
- ✅ فایل environment: `.env.example`

### 2. نصب Dependencies
- ✅ Node.js v20.19.2 روی سرور موجود است
- ✅ PM2 نصب شد
- ✅ Dependencies پروژه نصب شد (`npm install`)
- ✅ Directory `logs/` ساخته شد

### 3. تنظیمات PM2
- ✅ فایل `ecosystem.config.js` آماده شده
- ✅ تنظیمات restart خودکار، logging، و memory management

## 🔧 مراحل نهایی (باید خودتان انجام دهید):

### قدم 1: اتصال به سرور
```bash
ssh root@91.99.49.208
```

### قدم 2: رفتن به directory پروژه
```bash
cd /home/farsi-dutch-bot
```

### قدم 3: ویرایش فایل environment
```bash
nano .env
```

در این فایل باید مقادیر واقعی را وارد کنید:
```
TELEGRAM_BOT_TOKEN=your_actual_telegram_bot_token
CLAUDE_API_KEY=your_actual_claude_api_key
```

### قدم 4: شروع بات
```bash
# استفاده از script آماده
./start-bot.sh

# یا دستی:
pm2 start ecosystem.config.js
```

### قدم 5: تنظیم startup خودکار
```bash
pm2 save
pm2 startup
# دستوری که PM2 نمایش می‌دهد را اجرا کنید
```

## 📊 دستورات مفید PM2:

```bash
pm2 status                 # وضعیت بات
pm2 logs farsi-dutch-bot   # مشاهده logs
pm2 restart farsi-dutch-bot # restart بات  
pm2 stop farsi-dutch-bot   # توقف بات
pm2 delete farsi-dutch-bot # حذف از PM2
pm2 monit                  # monitoring در real-time
pm2 show farsi-dutch-bot   # جزئیات کامل
```

## 🔒 نکات امنیتی:

1. **فایل .env را محافظت کنید:**
```bash
chmod 600 .env
```

2. **Firewall تنظیم کنید:**
```bash
ufw allow 22        # SSH
ufw enable
```

3. **مانیتورینگ منظم:**
```bash
pm2 monit           # برای مشاهده CPU و RAM
```

## 🔍 رفع مشکل:

اگر بات شروع نشد:
```bash
# بررسی logs
pm2 logs farsi-dutch-bot

# تست manual
node server.js

# بررسی فایل .env
cat .env

# بررسی وضعیت port
netstat -tlnp | grep 3000
```

## 📈 مانیتورینگ:

### وضعیت فعلی:
- ✅ سرور: 91.99.49.208:22 (در دسترس)
- ✅ Node.js: v20.19.2 (نصب شده)
- ✅ PM2: (نصب شده)
- ✅ پروژه: /home/farsi-dutch-bot (آپلود شده)
- 🟡 محیط: نیاز به تنظیم .env
- 🟡 بات: آماده شروع

### بعد از راه‌اندازی:
بات شما 24/7 اجرا خواهد شد و PM2 اطمینان حاصل می‌کند که:
- در صورت crash خودکار restart شود
- logs تمام فعالیت‌ها ذخیره شود
- بعد از restart سرور، بات خودکار شروع شود

## 📞 پشتیبانی:

اگر مشکلی داشتید، این اطلاعات را بررسی کنید:
1. وضعیت PM2: `pm2 status`
2. Logs بات: `pm2 logs farsi-dutch-bot --lines 50`
3. وضعیت سرور: `htop` یا `free -h`
4. اتصال اینترنت: `ping google.com`

---
**🎉 بات شما آماده Deploy است! فقط باید فایل .env را ویرایش کنید و بات را شروع کنید.**