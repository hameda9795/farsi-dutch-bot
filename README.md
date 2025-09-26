# Farsi-Dutch Telegram Bot 🤖

A comprehensive Telegram bot that provides Dutch-Farsi translation, dictionary services, and grammar correction using Claude API (Sonnet 4).

## Features ✨

- 📖 **Dictionary Mode**: Get definitions, meanings, synonyms, antonyms, and examples for Dutch words
- 🌐 **Translation Mode**: Translate between Farsi and Dutch sentences
- ✅ **Grammar Correction**: Fix grammar errors in Dutch and Farsi text
- 🤖 **Intelligent Detection**: Automatically detects input type and language
- 📱 **User-Friendly**: Clean interface with persistent keyboard buttons
- ⚡ **Fast**: Efficient processing with real-time feedback

## How It Works 🔧

The bot intelligently analyzes user input:

1. **Single Dutch Word** → Dictionary mode (returns JSON-formatted definition)
2. **Farsi Sentence/Word** → Translation to Dutch
3. **Dutch Sentence** → Translation to Farsi

### Examples

```
Input: "bezigheden"
Output: Dictionary definition with Farsi/English meanings, synonyms, examples

Input: "من امروز به مدرسه رفتم."
Output: Dutch translation: "Ik ben vandaag naar school gegaan."

Input: "Vandaag is het koud."
Output: Farsi translation: "امروز سرد است."
```

## Installation 🚀

1. **Clone or download this project**
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env` file and add your tokens:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   CLAUDE_API_KEY=your_claude_api_key_here
   ```

4. **Get your tokens:**
   - **Telegram Bot Token**: Message [@BotFather](https://t.me/botfather) on Telegram
   - **Claude API Key**: Get from [Anthropic Console](https://console.anthropic.com/)

5. **Run the bot:**
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

## Project Structure 📁

```
farsi-dutch-bot/
├── bot.js                      # Main bot entry point
├── package.json                # Dependencies and scripts
├── .env                        # Environment variables (not committed)
├── .gitignore                  # Git ignore rules
├── README.md                   # This file
├── db/                         # User data storage (gitignored)
│   └── <chatId>.json          # Individual user translation history
├── lib/                        # Core modules
│   └── state.js               # Data persistence
├── services/                   # External API services
│   └── openaiService.js       # OpenAI API integration
└── utils/                      # Utility functions
    ├── extractWords.js         # Text processing utilities
    ├── fetchWordData.js        # Dictionary data fetching
    ├── inputDetection.js       # Input analysis
    └── messageFormatter.js     # Telegram message formatting
```

## Usage 📝

1. **Start the bot:** Send `/start` to your bot
2. **Choose mode:** Use the keyboard buttons to select:
   - 🌐 **Translation** - Translate text between languages
   - ✅ **Grammar** - Get grammar corrections
3. **Send text:** Type your message in Dutch or Farsi
4. **Get results:** Receive translations, definitions, or corrections

## Available Commands 📋

- `/start` - Initialize bot and show mode selection
- `/help` - Show detailed help message
- `/cancel` - Reset current mode

## Features Detail 📖

### Translation Mode
- **Single Words**: Get full dictionary definitions with examples
- **Sentences**: Natural translation between Dutch and Farsi
- **Automatic Detection**: No need to specify language

### Grammar Mode  
- **Error Detection**: Identifies grammatical mistakes
- **Corrections**: Provides corrected versions
- **Explanations**: Detailed explanations of errors

### Dictionary Mode
- **Comprehensive**: Includes meanings, synonyms, antonyms
- **Examples**: Real usage examples in both languages
- **Context**: Explanations help understand proper usage

## Technical Details ⚙️

- **Node.js** runtime environment
- **Telegram Bot API** for messaging
- **OpenAI GPT** for translations and grammar
- **JSON file storage** for user data
- **Modular architecture** for maintainability

## Environment Setup 🔧

Required environment variables:
```
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
OPENAI_API_KEY=your_openai_api_key
```

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License 📄

This project is licensed under the MIT License.

## Support 💬

If you encounter any issues or have questions, please open an issue on GitHub.