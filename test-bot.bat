@echo off
echo 🧪 Starting local test bot...
echo 🔧 Using test environment variables...

REM Set test environment
set NODE_ENV=test
set DOTENV_CONFIG_PATH=.env.test

REM Run bot with test config  
node bot.js

echo 🛑 Test bot stopped.