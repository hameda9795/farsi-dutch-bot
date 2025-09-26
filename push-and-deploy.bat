@echo off
echo ========================================
echo   CI/CD Auto Deploy Setup
echo ========================================
echo.

echo Adding all changes to git...
git add .

echo.
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg=Update bot with CI/CD pipeline

echo.
echo Committing with message: %commit_msg%
git commit -m "%commit_msg%"

echo.
echo Pushing to GitHub...
git push origin master

echo.
echo ========================================
echo   Deploy Process Started!
echo ========================================
echo.
echo 1. Check GitHub Actions tab in your repository
echo 2. Wait for the green checkmark ✅
echo 3. Your bot will be automatically updated on server!
echo.
echo GitHub Repository: https://github.com/hameda9795/farsi-dutch-bot
echo Actions URL: https://github.com/hameda9795/farsi-dutch-bot/actions
echo.
pause