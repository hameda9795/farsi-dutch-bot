# PowerShell Script for Deploying Farsi-Dutch Bot to Hetzner Server
# راه‌اندازی بات فارسی-هلندی روی سرور Hetzner

param(
    [string]$ServerIP = "91.99.49.208",
    [string]$Username = "root",
    [string]$ProjectPath = "C:\Users\31623\Documents\My-Projecten\farsi-dutch-bot"
)

Write-Host "🚀 Starting deployment to Hetzner server..." -ForegroundColor Green

# Check if SCP is available (part of OpenSSH)
try {
    scp
    Write-Host "✅ SCP is available" -ForegroundColor Green
} catch {
    Write-Host "❌ SCP not found. Please install OpenSSH client." -ForegroundColor Red
    Write-Host "Run: Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0" -ForegroundColor Yellow
    exit 1
}

# Create temporary deployment directory without node_modules
$TempDir = "$env:TEMP\farsi-dutch-bot-deploy"
Write-Host "📁 Creating temporary deployment directory..." -ForegroundColor Yellow

if (Test-Path $TempDir) {
    Remove-Item $TempDir -Recurse -Force
}

New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

# Copy files excluding node_modules, .git, and other unnecessary files
$ExcludeFolders = @("node_modules", ".git", "logs")
$ExcludeFiles = @("*.log", "*.tmp", ".env")

Write-Host "📦 Copying project files (excluding node_modules)..." -ForegroundColor Yellow

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

Write-Host "🔧 Setting up bot on server..." -ForegroundColor Yellow

# SSH commands to set up the bot
$SetupCommands = @(
    "cd /home/farsi-dutch-bot",
    "chmod +x deploy.sh",
    "npm install",
    "mkdir -p logs",
    "echo 'Please update the .env file with your actual tokens:'",
    "echo 'nano .env'",
    "echo 'Then run: pm2 start ecosystem.config.js'"
)

foreach ($command in $SetupCommands) {
    Write-Host "Executing: $command" -ForegroundColor Gray
    ssh ${Username}@${ServerIP} $command
}

Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. SSH to your server: ssh ${Username}@${ServerIP}"
Write-Host "2. Navigate to project: cd /home/farsi-dutch-bot"
Write-Host "3. Update .env file: nano .env"
Write-Host "4. Start bot with PM2: pm2 start ecosystem.config.js"
Write-Host "5. Save PM2 config: pm2 save"
Write-Host "6. Setup PM2 startup: pm2 startup"
Write-Host ""
Write-Host "📊 Monitor your bot:" -ForegroundColor Cyan
Write-Host "- pm2 status"
Write-Host "- pm2 logs farsi-dutch-bot"
Write-Host "- pm2 monit"