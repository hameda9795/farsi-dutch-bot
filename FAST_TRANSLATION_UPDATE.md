# Fast Translation Update

## مسئله (Problem)
زمانی که متنی را برای ترجمه وارد می‌کردیم طول می‌کشید تا ترجمه بشود و احتمالا به خاطر پیدا کردن کلمات بود.

When entering text for translation, it took a long time to get the translation, likely due to the word extraction process.

## راه‌حل (Solution)
دو حالت ترجمه اضافه شده است:

Two translation modes have been added:

### ⚡ ترجمه سریع (Fast Translation)
- ترجمه فوری بدون استخراج کلمات
- مناسب برای ترجمه سریع متن
- برای زمانی که فقط ترجمه می‌خواهید

- Instant translation without word extraction
- Perfect for quick text translation
- Use when you only want the translation

### 🌐 ترجمه عادی (Regular Translation)  
- ترجمه + استخراج کلمات جدید
- تحلیل کلمات جمله و ذخیره در دیکشنری
- برای یادگیری کلمات جدید

- Translation + extraction of new words
- Analyzes sentence words and saves to dictionary
- Use for learning new vocabulary

## تغییرات تکنیکی (Technical Changes)

### 1. New Translation Modes
- Added `FAST_TRANSLATE` mode
- Modified keyboard layout to prioritize fast translation
- Added `handleFastTranslationMode()` function

### 2. Performance Optimizations
- Fast mode bypasses word extraction entirely
- Regular mode now processes max 5 words (reduced from 10)
- Reduced processing delays from 200ms to 100ms per word

### 3. UI Improvements
- New keyboard button: `⚡ ترجمه سریع`
- Updated help message with clear mode explanations
- Visual indicators for fast vs regular translation

### 4. Code Structure
```javascript
// New mode constant
FAST_TRANSLATE: 'fast_translate'

// New keyboard layout prioritizing fast translation
[
    { text: '⚡ ترجمه سریع' },
    { text: '🌐 ترجمه' }
]

// New handler function
async function handleFastTranslationMode(userInput, analysis, chatId)
```

## کاربرد (Usage)

### For Quick Translation:
1. Press `⚡ ترجمه سریع`
2. Send your text
3. Get instant translation

### For Learning New Words:
1. Press `🌐 ترجمه`  
2. Send your text
3. Get translation + word analysis

## Performance Comparison

| Mode | Speed | Word Extraction | API Calls | Best For |
|------|-------|----------------|-----------|----------|
| ⚡ Fast | Very Fast | ❌ | 1-2 | Quick translations |
| 🌐 Regular | Slower | ✅ | 3-7+ | Learning vocabulary |

## Implementation Details

- Fast translation skips the entire word extraction loop
- Saves only the main translation without processing individual words
- Maintains all other functionality (language detection, dictionary lookup for single words)
- Shows helpful note about fast mode in response

## مزایا (Benefits)
- ترجمه فوری برای متون سریع 
- انتخاب بین سرعت و یادگیری
- صرفه‌جویی در مصرف API کلود
- بهبود تجربه کاربری

- Instant translation for quick texts
- Choice between speed and learning
- Saves Claude API usage
- Improved user experience