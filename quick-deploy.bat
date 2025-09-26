@echo off
echo =================================================
echo   Farsi-Dutch Bot - Hetzner Deployment
echo =================================================
echo.

REM Check if OpenSSH is installed
where scp >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: SCP not found. Please install OpenSSH client.
    echo Run this in PowerShell as Admin:
    echo Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
    pause
    exit /b 1
)

echo Step 1: Uploading files to server...
echo Creating project directory on server...
ssh root@91.99.49.208 "mkdir -p /home/farsi-dutch-bot"

echo Uploading project files (this may take a few minutes)...
scp -r *.js *.json *.md services utils lib data db ecosystem.config.js root@91.99.49.208:/home/farsi-dutch-bot/

if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to upload files
    pause
    exit /b 1
)

echo Step 2: Setting up environment on server...
ssh root@91.99.49.208 "cd /home/farsi-dutch-bot && npm install"

echo Step 3: Creating necessary directories...
ssh root@91.99.49.208 "cd /home/farsi-dutch-bot && mkdir -p logs"

echo.
echo =================================================
echo   Upload completed successfully!
echo =================================================
echo.
echo Next steps:
echo 1. SSH to server: ssh root@91.99.49.208
echo 2. Go to project: cd /home/farsi-dutch-bot  
echo 3. Copy .env file: cp .env.example .env
echo 4. Edit .env file: nano .env
echo 5. Start bot: pm2 start ecosystem.config.js
echo 6. Save PM2: pm2 save
echo 7. Setup startup: pm2 startup
echo.
echo Press any key to continue...
pause >nul