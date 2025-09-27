#!/bin/bash

# 🚀 Safe Deploy Script for Hetzner Server
# Usage: ./safe-deploy.sh YOUR_SERVER_IP

if [ $# -eq 0 ]; then
    echo "❌ خطا: لطفاً IP سرور را مشخص کنید"
    echo "استفاده: ./safe-deploy.sh YOUR_SERVER_IP"
    exit 1
fi

SERVER_IP=$1
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="backup-$TIMESTAMP"

echo "🚀 شروع Deploy امن به سرور $SERVER_IP"
echo "⏰ زمان: $TIMESTAMP"

# Step 1: Create backup on server
echo ""
echo "1️⃣ ایجاد backup از دیتابیس‌های سرور..."
ssh root@$SERVER_IP << EOF
    cd /root/farsi-dutch-bot
    echo "📊 وضعیت فعلی ربات:"
    pm2 list
    
    echo "🛑 متوقف کردن ربات..."
    pm2 stop bot
    
    echo "💾 ایجاد backup..."
    mkdir -p $BACKUP_DIR
    cp -r db/* $BACKUP_DIR/ 2>/dev/null || echo "⚠️ هشدار: پوشه db وجود ندارد، ادامه می‌دهیم..."
    
    echo "✅ Backup ایجاد شد: $BACKUP_DIR"
    ls -la $BACKUP_DIR
EOF

if [ $? -ne 0 ]; then
    echo "❌ خطا در ایجاد backup! Deploy متوقف شد."
    exit 1
fi

# Step 2: Upload new code (excluding db and node_modules)
echo ""
echo "2️⃣ آپلود کد جدید به سرور..."

# Create temporary directory without sensitive files
mkdir -p /tmp/farsi-dutch-bot-deploy
rsync -av --exclude 'node_modules' --exclude 'db' --exclude '.git' --exclude '*.log' \
    ./ /tmp/farsi-dutch-bot-deploy/

# Upload to server
scp -r /tmp/farsi-dutch-bot-deploy/* root@$SERVER_IP:/root/farsi-dutch-bot-new/

if [ $? -ne 0 ]; then
    echo "❌ خطا در آپلود فایل‌ها! Deploy متوقف شد."
    rm -rf /tmp/farsi-dutch-bot-deploy
    exit 1
fi

# Clean up temporary directory
rm -rf /tmp/farsi-dutch-bot-deploy

# Step 3: Deploy on server
echo ""
echo "3️⃣ Deploy کردن روی سرور..."
ssh root@$SERVER_IP << EOF
    echo "🔄 جایگزینی فایل‌ها..."
    
    # Restore database files
    mkdir -p /root/farsi-dutch-bot-new/db
    cp -r /root/farsi-dutch-bot/$BACKUP_DIR/* /root/farsi-dutch-bot-new/db/ 2>/dev/null || echo "ℹ️ هیچ دیتابیسی برای بازیابی وجود ندارد"
    
    # Copy environment files
    cp /root/farsi-dutch-bot/.env* /root/farsi-dutch-bot-new/ 2>/dev/null || echo "ℹ️ فایل .env کپی نشد"
    
    # Install dependencies
    cd /root/farsi-dutch-bot-new
    echo "📦 نصب dependencies..."
    npm install --production
    
    if [ \$? -ne 0 ]; then
        echo "❌ خطا در نصب dependencies!"
        exit 1
    fi
    
    # Backup old version
    mv /root/farsi-dutch-bot /root/farsi-dutch-bot-old-$TIMESTAMP
    mv /root/farsi-dutch-bot-new /root/farsi-dutch-bot
    
    # Start new version
    cd /root/farsi-dutch-bot
    echo "� راه‌اندازی ربات جدید..."
    pm2 delete bot 2>/dev/null || echo "ℹ️ ربات قبلی وجود نداشت"
    pm2 start ecosystem.config.js
    
    echo "✅ Deploy کامل شد!"
    echo "📊 وضعیت جدید:"
    pm2 list
    
    echo "📄 آخرین لاگ‌ها:"
    pm2 logs bot --lines 10
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deploy با موفقیت انجام شد!"
    echo "💾 Backup ذخیره شده در: $BACKUP_DIR"
    echo "🔄 نسخه قدیمی در: farsi-dutch-bot-old-$TIMESTAMP"
    echo ""
    echo "� برای بررسی لاگ‌ها:"
    echo "ssh root@$SERVER_IP"
    echo "pm2 logs bot"
else
    echo ""
    echo "❌ خطا در Deploy!"
    echo "🔄 برای بازگرداندن نسخه قبلی:"
    echo "ssh root@$SERVER_IP"
    echo "cd /root && pm2 stop bot && mv farsi-dutch-bot farsi-dutch-bot-failed && mv farsi-dutch-bot-old-$TIMESTAMP farsi-dutch-bot && pm2 start ecosystem.config.js"
fi
fi

# Step 5: Deployment instructions
echo "📋 Step 5: Server deployment instructions..."
echo "🔄 On your server, run the following commands:"
echo "   git pull origin master"
echo "   npm install --production"
echo "   pm2 restart farsi-dutch-bot"
echo ""
echo "⚠️  IMPORTANT NOTES:"
echo "   • Database files (db/) are preserved and NOT overwritten"
echo "   • Test files are excluded from deployment"
echo "   • User data will remain intact"
echo "   • Make sure .env file exists on server with production tokens"

echo ""
echo "🎉 Deployment preparation completed!"
echo "📱 New Features Deployed:"
echo "   • ⭐ Important Words System"
echo "   • 🔄 Updated Test Flow"
echo "   • 📋 Word Marking After Tests"
echo "   • 💾 Enhanced State Management"