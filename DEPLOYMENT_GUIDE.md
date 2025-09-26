# راهنمای Deploy کردن بات فارسی-هلندی روی سرور Hetzner

## مرحله 1: اتصال به سرور

برای اتصال به سرور Hetzner از دستور زیر استفاده کنید:

```bash
ssh root@91.99.49.208
```

اگر از کلید SSH استفاده می‌کنید:
```bash
ssh -i path/to/your/private/key root@91.99.49.208
```

## مرحله 2: آماده‌سازی سرور

بعد از اتصال به سرور، دستورات زیر را اجرا کنید:

```bash
# به‌روزرسانی packages سیستم
sudo apt update && sudo apt upgrade -y

# نصب Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# بررسی نسخه Node.js
node --version
npm --version

# نصب PM2 برای مدیریت پروسه
sudo npm install -g pm2

# نصب Git (در صورت نیاز)
sudo apt install git -y
```

## مرحله 3: انتقال فایل‌های پروژه

### گزینه 1: استفاده از SCP (از کامپیوتر محلی)
```bash
# از محل پروژه در کامپیوتر خودتان
scp -r . root@91.99.49.208:/home/farsi-dutch-bot/
```

### گزینه 2: استفاده از Git (اگر پروژه در GitHub است)
```bash
# در سرور
cd /home
git clone https://github.com/hameda9795/farsi-dutch-bot.git
cd farsi-dutch-bot
```

### گزینه 3: استفاده از rsync (بهترین روش)
```bash
# از کامپیوتر محلی
rsync -avz --exclude 'node_modules' --exclude '.git' . root@91.99.49.208:/home/farsi-dutch-bot/
```

## مرحله 4: نصب Dependencies و تنظیم محیط

```bash
# رفتن به directory پروژه
cd /home/farsi-dutch-bot

# نصب dependencies
npm install

# ساخت فولدر logs
mkdir -p logs

# کپی کردن فایل .env
cp .env.example .env
nano .env
```

در فایل `.env` مقادیر زیر را وارد کنید:
```
TELEGRAM_BOT_TOKEN=your_actual_bot_token
CLAUDE_API_KEY=your_actual_claude_api_key
```

## مرحله 5: راه‌اندازی بات با PM2

```bash
# شروع بات با استفاده از ecosystem config
pm2 start ecosystem.config.js

# یا به صورت manual:
pm2 start server.js --name "farsi-dutch-bot" --log-file logs/combined.log

# ذخیره تنظیمات PM2
pm2 save

# تنظیم startup script
pm2 startup
# دستوری که PM2 نمایش می‌دهد را اجرا کنید
```

## مرحله 6: تست و بررسی

```bash
# بررسی وضعیت بات
pm2 status

# مشاهده logs
pm2 logs farsi-dutch-bot

# بررسی health check (اگر پورت 3000 باز باشد)
curl http://localhost:3000/health
```

## دستورات مفید PM2

```bash
# مشاهده وضعیت همه پروسه‌ها
pm2 status

# restart بات
pm2 restart farsi-dutch-bot

# توقف بات
pm2 stop farsi-dutch-bot

# حذف بات از PM2
pm2 delete farsi-dutch-bot

# مشاهده logs زنده
pm2 logs farsi-dutch-bot

# مشاهده monitoring
pm2 monit

# مشاهده اطلاعات کامل یک پروسه
pm2 show farsi-dutch-bot
```

## رفع مشکلات رایج

### 1. اگر بات شروع نمی‌شود:
```bash
# بررسی logs
pm2 logs farsi-dutch-bot --lines 50

# بررسی فایل .env
cat .env

# تست manual
node server.js
```

### 2. اگر پروژه به‌روزرسانی شد:
```bash
# انتقال فایل‌های جدید
rsync -avz --exclude 'node_modules' --exclude '.git' . root@91.99.49.208:/home/farsi-dutch-bot/

# در سرور
cd /home/farsi-dutch-bot
npm install
pm2 restart farsi-dutch-bot
```

### 3. بررسی استفاده از منابع:
```bash
# بررسی استفاده از CPU و RAM
pm2 monit

# بررسی uptime
pm2 status
```

## نکات امنیتی

1. فایل `.env` را هرگز در repository قرار ندهید
2. از firewall استفاده کنید:
```bash
sudo ufw enable
sudo ufw allow 22  # SSH
sudo ufw allow 3000  # اگر نیاز دارید
```

3. تغییر پورت SSH (اختیاری):
```bash
sudo nano /etc/ssh/sshd_config
# Port را به عدد دیگری تغییر دهید
sudo systemctl restart ssh
```

## مانیتورینگ و Backup

```bash
# ساخت backup از database files
tar -czf backup-$(date +%Y%m%d).tar.gz db/ data/

# تنظیم cron job برای backup خودکار
crontab -e
# اضافه کردن:
# 0 2 * * * cd /home/farsi-dutch-bot && tar -czf backup-$(date +\%Y\%m\%d).tar.gz db/ data/
```

پس از اجرای این مراحل، بات تلگرام شما روی سرور Hetzner به صورت دائمی اجرا خواهد شد و PM2 اطمینان حاصل می‌کند که در صورت خطا یا crash، بات دوباره راه‌اندازی شود.