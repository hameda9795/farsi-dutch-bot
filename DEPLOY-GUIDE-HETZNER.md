# 🚀 راهنمای Deploy روی Hetzner با حفظ دیتابیس‌ها

## 📋 مراحل کامل Deploy:

### 1️⃣ **اتصال به سرور و Backup از دیتابیس‌ها:**

```bash
# اتصال به سرور (IP سرور خود را جایگزین کنید)
ssh root@YOUR_SERVER_IP

# رفتن به پوشه پروژه روی سرور
cd /root/farsi-dutch-bot

# متوقف کردن ربات فعلی
pm2 stop bot

# ایجاد پوشه backup
mkdir -p backup-$(date +%Y%m%d-%H%M%S)

# کپی کردن تمام دیتابیس‌ها
cp -r db/* backup-$(date +%Y%m%d-%H%M%S)/

# نمایش لیست backup ها
ls -la backup-*

# خروج از SSH
exit
```

### 2️⃣ **آپلود کد جدید به سرور:**

```bash
# در کامپیوتر محلی - آپلود فایل‌ها (بدون دیتابیس‌ها)
scp -r . root@YOUR_SERVER_IP:/root/farsi-dutch-bot-new

# اتصال مجدد به سرور
ssh root@YOUR_SERVER_IP

# رفتن به پوشه جدید
cd /root/farsi-dutch-bot-new

# انتقال دیتابیس‌های backup شده
cp -r /root/farsi-dutch-bot/db/* ./db/

# نصب dependencies جدید
npm install

# تست ربات
npm test
```

### 3️⃣ **جایگزینی فایل‌ها و راه‌اندازی مجدد:**

```bash
# متوقف کردن ربات قدیمی
pm2 stop bot
pm2 delete bot

# جایگزینی فایل‌ها (بدون دیتابیس)
cd /root
mv farsi-dutch-bot farsi-dutch-bot-old
mv farsi-dutch-bot-new farsi-dutch-bot

# راه‌اندازی ربات جدید
cd /root/farsi-dutch-bot
pm2 start ecosystem.config.js

# بررسی وضعیت
pm2 status
pm2 logs bot
```

## ⚡ **دستور سریع Deploy (یک مرحله‌ای):**

اگر می‌خواهید تمام مراحل را یکجا انجام دهید:

```bash
# روی کامپیوتر محلی
./safe-deploy.sh YOUR_SERVER_IP
```

## 🔒 **نکات امنیتی مهم:**

1. **همیشه backup بگیرید** قبل از deploy
2. **فایل‌های .env** را دستی کپی کنید
3. **دیتابیس‌ها** را هرگز حذف نکنید
4. **تست کنید** قبل از جایگزینی نهایی

## 📞 **تست عملکرد پس از Deploy:**

```bash
# بررسی لاگ‌ها
pm2 logs bot --lines 50

# تست ربات
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "YOUR_CHAT_ID", "text": "✅ Deploy موفق!"}'

# بررسی دیتابیس‌ها
ls -la db/
```

---

**⚠️ نکته مهم:** قبل از شروع، IP سرور و مسیرهای مربوطه را در دستورات بالا جایگزین کنید.