# PowerShell Script for Safe Deployment to Hetzner Server (با حفظ دیتابیس‌ها)
# راه‌اندازی امن بات فارسی-هلندی روی سرور Hetzner

param(
    [string]$ServerIP = "91.99.49.208",
    [string]$Username = "root",
    [string]$ProjectPath = "C:\Users\31623\Documents\My-Projecten\farsi-dutch-bot"
)

Write-Host "🚀 شروع deploy امن به سرور Hetzner..." -ForegroundColor Green
Write-Host "⚠️ دیتابیس‌های کاربران حفظ خواهند شد!" -ForegroundColor Yellow

# Step 1: Backup databases on server first
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = "backup-db-$timestamp"

Write-Host ""
Write-Host "1️⃣ ایجاد backup از دیتابیس‌های سرور..." -ForegroundColor Yellow

$backupCommands = @"
cd /home/farsi-dutch-bot 2>/dev/null || cd /root/farsi-dutch-bot 2>/dev/null || echo 'Project directory not found, skipping backup'
if [ -d "db" ]; then
    echo "💾 ایجاد backup از دیتابیس‌ها..."
    pm2 stop farsi-dutch-bot 2>/dev/null || pm2 stop bot 2>/dev/null || echo 'Bot not running'
    mkdir -p $backupDir
    cp -r db/* $backupDir/ 2>/dev/null && echo "✅ Backup موفق: $backupDir" || echo "⚠️ مشکل در backup"
    ls -la $backupDir 2>/dev/null || echo 'Backup directory check failed'
else
    echo "ℹ️ هیچ دیتابیسی برای backup وجود ندارد (اولین deploy)"
fi
"@

try {
    $backupCommands | ssh ${Username}@${ServerIP}
    Write-Host "✅ مرحله backup کامل شد" -ForegroundColor Green
} catch {
    Write-Host "⚠️ هشدار: مشکل در backup - ادامه می‌دهیم..." -ForegroundColor Yellow
}

# Check if SCP is available (part of OpenSSH)
Write-Host ""
Write-Host "2️⃣ بررسی ابزارهای مورد نیاز..." -ForegroundColor Yellow
try {
    scp 2>$null
    Write-Host "✅ SCP در دسترس است" -ForegroundColor Green
} catch {
    Write-Host "❌ SCP پیدا نشد. لطفاً OpenSSH client نصب کنید." -ForegroundColor Red
    Write-Host "اجرا کنید: Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0" -ForegroundColor Yellow
    exit 1
}

# Create temporary deployment directory without sensitive files
Write-Host ""
Write-Host "3️⃣ آماده‌سازی فایل‌ها برای آپلود..." -ForegroundColor Yellow
$TempDir = "$env:TEMP\farsi-dutch-bot-deploy"
Write-Host "📁 Creating temporary deployment directory..." -ForegroundColor Yellow

if (Test-Path $TempDir) {
    Remove-Item $TempDir -Recurse -Force
}

New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

# Copy files excluding node_modules, .git, databases and other unnecessary files
$ExcludeFolders = @("node_modules", ".git", "logs", "db", "backup-*", "temp_deploy")
$ExcludeFiles = @("*.log", "*.tmp", ".env", "test-*.js")

Write-Host "📦 کپی کردن فایل‌های پروژه (بدون node_modules و دیتابیس‌ها)..." -ForegroundColor Yellow

# Copy all files except excluded ones
Get-ChildItem $ProjectPath -Recurse | Where-Object {
    $relativePath = $_.FullName.Substring($ProjectPath.Length + 1)
    $exclude = $false
    
    foreach ($folder in $ExcludeFolders) {
        if ($relativePath.StartsWith($folder)) {
            $exclude = $true
            break
        }
    }
    
    if (!$exclude -and $_.PSIsContainer -eq $false) {
        foreach ($pattern in $ExcludeFiles) {
            if ($_.Name -like $pattern) {
                $exclude = $true
                break
            }
        }
    }
    
    return !$exclude
} | ForEach-Object {
    $destinationPath = $_.FullName.Replace($ProjectPath, $TempDir)
    $destinationDir = Split-Path $destinationPath -Parent
    
    if (!(Test-Path $destinationDir)) {
        New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
    }
    
    if (!$_.PSIsContainer) {
        Copy-Item $_.FullName $destinationPath -Force
    }
}

Write-Host "📤 Uploading files to server..." -ForegroundColor Yellow

# Upload files using SCP
$ScpCommand = "scp -r `"$TempDir\*`" ${Username}@${ServerIP}:/home/farsi-dutch-bot/"
Write-Host "Running: $ScpCommand" -ForegroundColor Gray

try {
    # Create directory on server first
    ssh ${Username}@${ServerIP} "mkdir -p /home/farsi-dutch-bot"
    
    # Upload files
    Invoke-Expression $ScpCommand
    
    Write-Host "✅ Files uploaded successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to upload files: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Clean up temporary directory
    Remove-Item $TempDir -Recurse -Force
}

Write-Host "🔧 راه‌اندازی ربات روی سرور..." -ForegroundColor Yellow

# SSH commands to set up the bot with database restoration
$SetupCommands = @"
cd /home/farsi-dutch-bot 2>/dev/null || cd /root/farsi-dutch-bot
echo "📦 نصب dependencies..."
npm install --production

echo "🔄 بازیابی دیتابیس‌ها از backup..."
if [ -d "$backupDir" ]; then
    mkdir -p db
    cp -r $backupDir/* db/ 2>/dev/null && echo "✅ دیتابیس‌ها بازیابی شدند" || echo "⚠️ مشکل در بازیابی دیتابیس‌ها"
    ls -la db/
else
    echo "ℹ️ هیچ backup برای بازیابی وجود ندارد"
    mkdir -p db
fi

echo "🚀 راه‌اندازی ربات..."
pm2 stop farsi-dutch-bot 2>/dev/null || pm2 stop bot 2>/dev/null || echo "ربات قبلی در حال اجرا نبود"
pm2 delete farsi-dutch-bot 2>/dev/null || pm2 delete bot 2>/dev/null || echo "حذف process قبلی"
pm2 start ecosystem.config.js

echo "✅ راه‌اندازی کامل شد!"
pm2 list
pm2 logs bot --lines 5
"@

try {
    $SetupCommands | ssh ${Username}@${ServerIP}
    Write-Host "✅ راه‌اندازی موفق!" -ForegroundColor Green
} catch {
    Write-Host "❌ خطا در راه‌اندازی: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Deploy کامل شد!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 کارهای انجام شده:" -ForegroundColor Yellow
Write-Host "✅ Backup از دیتابیس‌های قبلی گرفته شد: $backupDir"
Write-Host "✅ کد جدید آپلود شد"
Write-Host "✅ دیتابیس‌ها بازیابی شدند"
Write-Host "✅ ربات راه‌اندازی شد"
Write-Host ""
Write-Host "🔍 برای مانیتور کردن ربات:" -ForegroundColor Cyan
Write-Host "ssh ${Username}@${ServerIP}"
Write-Host "pm2 status"
Write-Host "pm2 logs bot"
Write-Host "pm2 monit"
Write-Host "📊 Monitor your bot:" -ForegroundColor Cyan
Write-Host "- pm2 status"
Write-Host "- pm2 logs farsi-dutch-bot"
Write-Host "- pm2 monit"