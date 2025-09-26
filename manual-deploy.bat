@echo off
echo =================================================
echo   Manual Deploy to Hetzner Server
echo =================================================
echo.

set /p commit_msg="Enter commit message: "
if "%commit_msg%"=="" set commit_msg=Manual update

echo Step 1: Git operations...
git add .
git commit -m "%commit_msg%"
git push origin master

echo.
echo Step 2: Manual deploy to server...
echo Connecting to server and updating bot...

ssh root@91.99.49.208 "cd /home/farsi-dutch-bot && git pull origin master && npm install && pm2 restart farsi-dutch-bot && pm2 status"

echo.
echo =================================================
echo   Manual Deploy Completed!
echo =================================================
pause