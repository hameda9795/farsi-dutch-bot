# 🚀 Safe Deploy Script for Hetzner Server (PowerShell)
# Usage: .\safe-deploy.ps1 YOUR_SERVER_IP

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = "backup-$timestamp"

Write-Host "🚀 شروع Deploy امن به سرور $ServerIP" -ForegroundColor Green
Write-Host "⏰ زمان: $timestamp" -ForegroundColor Cyan

# Step 1: Create backup on server
Write-Host ""
Write-Host "1️⃣ ایجاد backup از دیتابیس‌های سرور..." -ForegroundColor Yellow

$sshCommands = @"
cd /root/farsi-dutch-bot
echo "📊 وضعیت فعلی ربات:"
pm2 list
echo "🛑 متوقف کردن ربات..."
pm2 stop bot
echo "💾 ایجاد backup..."
mkdir -p $backupDir
cp -r db/* $backupDir/ 2>/dev/null || echo "⚠️ هشدار: پوشه db وجود ندارد، ادامه می‌دهیم..."
echo "✅ Backup ایجاد شد: $backupDir"
ls -la $backupDir
"@

$sshCommands | ssh root@$ServerIP

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ خطا در ایجاد backup! Deploy متوقف شد." -ForegroundColor Red
    exit 1
}

# Add specific production files only
$productionFiles = @(
    "bot.js",
    "config.js", 
    "server.js",
    "package.json",
    "package-lock.json",
    ".env.example",
    "lib/",
    "services/",
    "utils/",
    "data/",
    "ecosystem.config.js",
    "start-bot.sh",
    "deploy.sh",
    ".gitignore",
    "README.md"
)

foreach ($file in $productionFiles) {
    if (Test-Path $file) {
        git add $file
        Write-Host "✅ Added: $file" -ForegroundColor Green
    }
}

# Step 3: Commit changes
Write-Host "📋 Step 3: Committing changes..." -ForegroundColor Yellow
$commitMessage = "feat: Important Words System - Production Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Changes committed successfully" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No changes to commit or commit successful" -ForegroundColor Cyan
}

# Step 4: Push to remote
Write-Host "📋 Step 4: Pushing to remote repository..." -ForegroundColor Yellow
git push origin master

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to remote" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to push to remote" -ForegroundColor Red
    exit 1
}

# Step 5: Deployment instructions
Write-Host "📋 Step 5: Server deployment instructions..." -ForegroundColor Yellow
Write-Host "🔄 On your server, run the following commands:" -ForegroundColor Cyan
Write-Host "   git pull origin master" -ForegroundColor White
Write-Host "   npm install --production" -ForegroundColor White
Write-Host "   pm2 restart farsi-dutch-bot" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT NOTES:" -ForegroundColor Red
Write-Host "   • Database files (db/) are preserved and NOT overwritten" -ForegroundColor Yellow
Write-Host "   • Test files are excluded from deployment" -ForegroundColor Yellow
Write-Host "   • User data will remain intact" -ForegroundColor Yellow
Write-Host "   • Make sure .env file exists on server with production tokens" -ForegroundColor Yellow

Write-Host ""
Write-Host "🎉 Deployment preparation completed!" -ForegroundColor Green
Write-Host "📱 New Features Deployed:" -ForegroundColor Cyan
Write-Host "   • ⭐ Important Words System" -ForegroundColor White
Write-Host "   • 🔄 Updated Test Flow" -ForegroundColor White  
Write-Host "   • 📋 Word Marking After Tests" -ForegroundColor White
Write-Host "   • 💾 Enhanced State Management" -ForegroundColor White