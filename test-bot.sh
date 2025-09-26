#!/bin/bash

echo "🧪 Starting local test bot..."
echo "🔧 Using test environment variables..."

# Load test environment
export NODE_ENV=test

# Run bot with test config
NODE_OPTIONS="--require dotenv/config" DOTENV_CONFIG_PATH=.env.test node bot.js

echo "🛑 Test bot stopped."