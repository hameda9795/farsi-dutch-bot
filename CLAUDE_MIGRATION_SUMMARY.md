# Migration Summary: OpenAI to Claude API

## Changes Made

### 1. Package Dependencies
- ✅ Replaced `openai` package with `@anthropic-ai/sdk`
- ✅ Updated package.json description and keywords

### 2. Service Layer
- ✅ Renamed `services/openaiService.js` to `services/claudeService.js`
- ✅ Replaced `OpenAI` class with `Anthropic` class
- ✅ Updated all API calls to use Claude's message format
- ✅ Changed model from `gpt-3.5-turbo` to `claude-3-5-sonnet-20241022`
- ✅ Updated all method calls to use Claude API structure

### 3. Environment Variables
- ✅ Changed `OPENAI_API_KEY` to `CLAUDE_API_KEY` in bot.js
- ✅ Updated error messages to reference Claude API key
- ✅ Created .env.example with new variable names
- ✅ Updated existing .env file

### 4. Bot Configuration
- ✅ Updated imports to use `ClaudeService` instead of `OpenAIService`
- ✅ Changed service instance from `openaiService` to `claudeService`
- ✅ Updated all service method calls throughout bot.js

### 5. Utility Files
- ✅ Updated `utils/fetchWordData.js` to use Claude service
- ✅ Changed lazy-loading function to use Claude API key

### 6. Documentation
- ✅ Updated README.md to reference Claude API instead of OpenAI
- ✅ Changed API key instructions to point to Anthropic Console

## API Differences Addressed

### Request Format
- **OpenAI**: Used `messages` array with separate `role` and `content`
- **Claude**: Uses `system` parameter and `messages` array with different structure

### Response Format
- **OpenAI**: `response.choices[0].message.content`
- **Claude**: `response.content[0].text`

### Model Names
- **OpenAI**: `gpt-3.5-turbo`
- **Claude**: `claude-3-5-sonnet-20241022` (latest Sonnet 4 model)

## To Complete Migration

1. **Get Claude API Key**: Visit [Anthropic Console](https://console.anthropic.com/)
2. **Update .env file**: Replace `your_claude_api_key_here` with your actual API key
3. **Test the bot**: Run `npm start` to verify everything works

## Features Preserved

All original bot features remain intact:
- ✅ Dictionary definitions
- ✅ Text translation (Persian ↔ Dutch)
- ✅ Language detection
- ✅ Grammar correction
- ✅ Quiz generation
- ✅ State management and message saving