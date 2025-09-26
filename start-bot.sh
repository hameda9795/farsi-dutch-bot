#!/bin/bash

echo "🚀 راه‌اندازی نهایی بات فارسی-هلندی"
echo "============================================="
echo ""

# Check current directory
if [ ! -f "package.json" ]; then
    echo "❌ خطا: در directory پروژه نیستید"
    echo "برای رفتن به directory پروژه: cd /home/farsi-dutch-bot"
    exit 1
fi

echo "📝 برای راه‌اندازی بات، باید فایل .env را ویرایش کنید:"
echo "nano .env"
echo ""
echo "در این فایل باید مقادیر زیر را وارد کنید:"
echo "TELEGRAM_BOT_TOKEN=your_actual_bot_token_here"
echo "CLAUDE_API_KEY=your_actual_claude_api_key_here"
echo ""

read -p "آیا فایل .env را ویرایش کردید؟ (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "لطفاً ابتدا فایل .env را ویرایش کنید: nano .env"
    exit 1
fi

echo ""
echo "🚀 شروع بات با PM2..."

# Start bot with PM2
pm2 start ecosystem.config.js

if [ $? -eq 0 ]; then
    echo "✅ بات با موفقیت شروع شد!"
    
    # Save PM2 configuration
    pm2 save
    
    echo ""
    echo "📊 وضعیت بات:"
    pm2 status
    
    echo ""
    echo "🔧 برای تنظیم startup script (تا بات بعد از restart سرور بالا بیاد):"
    echo "pm2 startup"
    echo "سپس دستوری که PM2 نشان می‌دهد را اجرا کنید"
    
    echo ""
    echo "📋 دستورات مفید:"
    echo "pm2 status                 - مشاهده وضعیت"
    echo "pm2 logs farsi-dutch-bot   - مشاهده logs"
    echo "pm2 restart farsi-dutch-bot - restart بات"
    echo "pm2 stop farsi-dutch-bot   - توقف بات"
    echo "pm2 monit                  - monitoring"
    
else
    echo "❌ خطا در شروع بات. برای مشاهده جزئیات:"
    echo "pm2 logs farsi-dutch-bot"
fi