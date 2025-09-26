#!/bin/bash

# Farsi-Dutch Bot Deployment Script for Hetzner Server
# This script sets up the bot on the server with PM2

echo "🚀 Starting deployment of Farsi-Dutch Bot..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally (if not already installed)
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Navigate to project directory
PROJECT_DIR="/home/$(whoami)/farsi-dutch-bot"
echo "📁 Setting up project directory: $PROJECT_DIR"

# Create project directory if it doesn't exist
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

# Create logs directory
mkdir -p logs

# Set up PM2 ecosystem file
echo "⚙️ Setting up PM2 configuration..."

# Start the bot with PM2
echo "🤖 Starting bot with PM2..."
pm2 start server.js --name "farsi-dutch-bot" --log-file logs/combined.log --out-file logs/out.log --error-file logs/error.log --restart-delay=1000 --max-restarts=10

# Save PM2 configuration
pm2 save

# Set up PM2 startup script
pm2 startup

echo "✅ Deployment completed!"
echo "📊 Bot status:"
pm2 status
echo ""
echo "📋 Useful PM2 commands:"
echo "  pm2 status                 - Check bot status"
echo "  pm2 restart farsi-dutch-bot - Restart the bot"
echo "  pm2 stop farsi-dutch-bot   - Stop the bot"
echo "  pm2 logs farsi-dutch-bot   - View bot logs"
echo "  pm2 monit                  - Monitor bot performance"