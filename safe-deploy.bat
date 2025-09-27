@echo off
REM 🚀 Safe Deploy Script for Hetzner Server (Windows)
REM Usage: safe-deploy.bat YOUR_SERVER_IP

if "%1"=="" (
    echo ❌ خطا: لطفاً IP سرور را مشخص کنید
    echo استفاده: safe-deploy.bat YOUR_SERVER_IP
    pause
    exit /b 1
)

set SERVER_IP=%1
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_DIR=backup-%TIMESTAMP%

echo 🚀 شروع Deploy امن به سرور %SERVER_IP%
echo ⏰ زمان: %TIMESTAMP%

REM Step 1: Create backup on server
echo.
echo 1️⃣ ایجاد backup از دیتابیس‌های سرور...

REM Create SSH command file
echo cd /root/farsi-dutch-bot > ssh_commands.tmp
echo echo "📊 وضعیت فعلی ربات:" >> ssh_commands.tmp
echo pm2 list >> ssh_commands.tmp
echo echo "🛑 متوقف کردن ربات..." >> ssh_commands.tmp
echo pm2 stop bot >> ssh_commands.tmp
echo echo "💾 ایجاد backup..." >> ssh_commands.tmp
echo mkdir -p %BACKUP_DIR% >> ssh_commands.tmp
echo cp -r db/* %BACKUP_DIR%/ 2^>^/dev^/null ^|^| echo "⚠️ هشدار: پوشه db وجود ندارد، ادامه می‌دهیم..." >> ssh_commands.tmp
echo echo "✅ Backup ایجاد شد: %BACKUP_DIR%" >> ssh_commands.tmp
echo ls -la %BACKUP_DIR% >> ssh_commands.tmp

REM Execute SSH commands
ssh root@%SERVER_IP% < ssh_commands.tmp

if %ERRORLEVEL% NEQ 0 (
    echo ❌ خطا در ایجاد backup! Deploy متوقف شد.
    del ssh_commands.tmp
    pause
    exit /b 1
)

del ssh_commands.tmp

REM Step 2: Upload new code using SCP
echo.
echo 2️⃣ آپلود کد جدید به سرور...

REM Create temp directory and copy files (excluding sensitive folders)
if exist temp_deploy rmdir /s /q temp_deploy
mkdir temp_deploy

REM Copy production files
xcopy /E /I /Q *.js temp_deploy\
xcopy /E /I /Q *.json temp_deploy\
xcopy /E /I /Q *.md temp_deploy\
xcopy /E /I /Q lib temp_deploy\lib
xcopy /E /I /Q services temp_deploy\services
xcopy /E /I /Q utils temp_deploy\utils 2>nul
xcopy /E /I /Q data temp_deploy\data 2>nul
copy .env.example temp_deploy\ 2>nul
copy ecosystem.config.js temp_deploy\ 2>nul

REM Upload to server
pscp -r temp_deploy/* root@%SERVER_IP%:/root/farsi-dutch-bot-new/

if %ERRORLEVEL% NEQ 0 (
    echo ❌ خطا در آپلود فایل‌ها! Deploy متوقف شد.
    if exist temp_deploy rmdir /s /q temp_deploy
    pause
    exit /b 1
)

REM Clean up
rmdir /s /q temp_deploy

REM Step 3: Deploy on server
echo.
echo 3️⃣ Deploy کردن روی سرور...

REM Create deployment commands
echo echo "🔄 جایگزینی فایل‌ها..." > deploy_commands.tmp
echo mkdir -p /root/farsi-dutch-bot-new/db >> deploy_commands.tmp
echo cp -r /root/farsi-dutch-bot/%BACKUP_DIR%/* /root/farsi-dutch-bot-new/db/ 2^>^/dev^/null ^|^| echo "ℹ️ هیچ دیتابیسی برای بازیابی وجود ندارد" >> deploy_commands.tmp
echo cp /root/farsi-dutch-bot/.env* /root/farsi-dutch-bot-new/ 2^>^/dev^/null ^|^| echo "ℹ️ فایل .env کپی نشد" >> deploy_commands.tmp
echo cd /root/farsi-dutch-bot-new >> deploy_commands.tmp
echo echo "📦 نصب dependencies..." >> deploy_commands.tmp
echo npm install --production >> deploy_commands.tmp
echo if [ $? -ne 0 ]; then echo "❌ خطا در نصب dependencies!"; exit 1; fi >> deploy_commands.tmp
echo mv /root/farsi-dutch-bot /root/farsi-dutch-bot-old-%TIMESTAMP% >> deploy_commands.tmp
echo mv /root/farsi-dutch-bot-new /root/farsi-dutch-bot >> deploy_commands.tmp
echo cd /root/farsi-dutch-bot >> deploy_commands.tmp
echo echo "🚀 راه‌اندازی ربات جدید..." >> deploy_commands.tmp
echo pm2 delete bot 2^>^/dev^/null ^|^| echo "ℹ️ ربات قبلی وجود نداشت" >> deploy_commands.tmp
echo pm2 start ecosystem.config.js >> deploy_commands.tmp
echo echo "✅ Deploy کامل شد!" >> deploy_commands.tmp
echo echo "📊 وضعیت جدید:" >> deploy_commands.tmp
echo pm2 list >> deploy_commands.tmp
echo echo "📄 آخرین لاگ‌ها:" >> deploy_commands.tmp
echo pm2 logs bot --lines 10 >> deploy_commands.tmp

ssh root@%SERVER_IP% < deploy_commands.tmp

if %ERRORLEVEL% EQU 0 (
    echo.
    echo 🎉 Deploy با موفقیت انجام شد!
    echo 💾 Backup ذخیره شده در: %BACKUP_DIR%
    echo 🔄 نسخه قدیمی در: farsi-dutch-bot-old-%TIMESTAMP%
    echo.
    echo 🔍 برای بررسی لاگ‌ها:
    echo ssh root@%SERVER_IP%
    echo pm2 logs bot
) else (
    echo.
    echo ❌ خطا در Deploy!
    echo 🔄 برای بازگرداندن نسخه قبلی:
    echo ssh root@%SERVER_IP%
    echo cd /root ^&^& pm2 stop bot ^&^& mv farsi-dutch-bot farsi-dutch-bot-failed ^&^& mv farsi-dutch-bot-old-%TIMESTAMP% farsi-dutch-bot ^&^& pm2 start ecosystem.config.js
)

del deploy_commands.tmp
pause