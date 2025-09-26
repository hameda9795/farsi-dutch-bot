/**
 * Message Formatter
 * Formats responses for Telegram messages
 */

/**
 * Format dictionary JSON response into readable Telegram message
 * @param {object} dictionaryData - Dictionary JSON object
 * @returns {string} - Formatted message with Markdown
 */
function formatDictionaryResponse(dictionaryData) {
    let message = `📖 **${dictionaryData.word}**\n\n`;
    
    // Dutch meaning (for Persian words)
    if (dictionaryData.dutchMeaning) {
        message += `🇳🇱 **Nederlands:** ${dictionaryData.dutchMeaning}\n`;
    }
    
    // Farsi meaning (for Dutch words)
    if (dictionaryData.farsiMeaning) {
        message += `🇮🇷 **فارسی:** ${dictionaryData.farsiMeaning}\n`;
    }
    
    // English meaning
    if (dictionaryData.englishMeaning) {
        message += `🇬🇧 **English:** ${dictionaryData.englishMeaning}\n\n`;
    }
    
    // Synonyms
    if (dictionaryData.synonyms && dictionaryData.synonyms.length > 0) {
        message += `✅ **Synonyms:** ${dictionaryData.synonyms.join(', ')}\n`;
    }
    
    // Antonyms
    if (dictionaryData.antonyms && dictionaryData.antonyms.length > 0) {
        message += `❌ **Antonyms:** ${dictionaryData.antonyms.join(', ')}\n`;
    }
    
    // Examples
    if (dictionaryData.examples && dictionaryData.examples.length > 0) {
        message += `\n📝 **Examples:**\n`;
        dictionaryData.examples.forEach((example, index) => {
            message += `\n${index + 1}.`;
            
            // For Dutch word examples (has dutch property)
            if (example.dutch) {
                message += ` 🇳🇱 ${example.dutch}`;
                if (example.farsi) {
                    message += `\n   🇮🇷 ${example.farsi}`;
                }
            }
            // For Persian word examples (has farsi but no dutch, or farsi comes first)
            else if (example.farsi) {
                message += ` 🇮🇷 ${example.farsi}`;
                if (example.dutch) {
                    message += `\n   🇳🇱 ${example.dutch}`;
                }
            }
            
            if (example.english) {
                message += `\n   🇬🇧 ${example.english}`;
            }
            message += '\n';
        });
    }
    
    return message;
}

/**
 * Format translation response
 * @param {string} translation - Translated text
 * @param {string} sourceLanguage - Source language ('persian' or 'dutch')
 * @returns {string} - Formatted message
 */
function formatTranslationResponse(translation, sourceLanguage) {
    const targetFlag = sourceLanguage === 'persian' ? '🇳🇱' : '🇮🇷';
    const targetLang = sourceLanguage === 'persian' ? 'Nederlands' : 'فارسی';
    
    return `${targetFlag} **${targetLang}:**\n${translation}`;
}

/**
 * Format comprehensive translation response with vocabulary and context
 * @param {string} comprehensiveAnalysis - Full analysis from Claude
 * @param {string} sourceLanguage - Source language ('persian' or 'dutch')
 * @returns {string} - Formatted comprehensive message
 */
function formatComprehensiveTranslation(comprehensiveAnalysis, sourceLanguage) {
    // Add separator lines for better visual formatting
    const separator = '────────────────────────────────────────';
    
    return `${separator}\n${comprehensiveAnalysis}\n${separator}`;
}

/**
 * Format error message
 * @param {string} error - Error message
 * @returns {string} - Formatted error message
 */
function formatErrorMessage(error = 'Something went wrong') {
    return `❌ **Error:** ${error}\n\nPlease try again or use /help for instructions.`;
}

/**
 * Format input not recognized error message  
 * @returns {string} - Formatted error message in Persian
 */
function formatInputNotRecognizedMessage() {
    return `❌ ورودی شناسایی نشد. لطفاً دوباره تلاش کنید.

Input not recognized. Please try again.`;
}

/**
 * Get help message
 * @returns {string} - Help message
 */
function getHelpMessage() {
    return `🤖 **ربات مترجم فارسی-هلندی**

📋 **راهنمای استفاده:**

🌐 **حالت ترجمه:**
• متن فارسی یا هلندی ارسال کنید
• کلمات منفرد: معنی کامل از فرهنگ لغت
• جملات: ترجمه طبیعی و روان
• تمام ترجمه‌ها به مجموعه شخصی شما اضافه می‌شود

📚 **یادگیری واژگان:**
• هر کلمه جدید خودکار ذخیره می‌شود
• با هوش مصنوعی تجزیه و تحلیل می‌شود
• برای تست‌های آینده آماده می‌شود

📝 **تست واژگان:**
• از کلمات شخصی شما سوال طراحی می‌شود
• سطح دشواری تطبیقی
• پیگیری پیشرفت یادگیری

✅ **اصلاح گرامر:**
• متن فارسی یا هلندی ارسال کنید
• اصلاحات گرامری دریافت کنید
• توضیحات کامل برای یادگیری

📊 **آمار شخصی:**
• تعداد کلمات یادگرفته شده
• میزان موفقیت در تست‌ها
• پیشرفت یادگیری

**🔧 دستورات:**
/start - شروع مجدد
/help - نمایش این راهنما
/cancel - لغو حالت فعلی
/cleanup - پاکسازی اطلاعات (فقط admin)

**💡 نکات مهم:**
• فقط متون **فارسی** و **هلندی** پشتیبانی می‌شود
• برای معنی دقیق، کلمات را منفرد بنویسید
• تمام عملکردها به زبان فارسی هستند

**✨ شروع کنید و یادگیری را لذت ببرید!**`;
}

/**
 * Get welcome message
 * @returns {string} - Welcome message
 */
function getWelcomeMessage() {
    return `🌟 **به ربات مترجم فارسی-هلندی خوش آمدید!**

سلام و درود! 👋

🎯 **این ربات چه کمکی به شما می‌کند:**

🌐 **ترجمه** - ترجمه سریع و دقیق بین فارسی و هلندی
📚 **واژه‌نامه** - معنی دقیق کلمات با تلفظ و مثال
✅ **اصلاح گرامر** - بررسی و اصلاح گرامر متون
📝 **تست واژگان** - تست کلماتی که یاد گرفتید
📊 **آمار یادگیری** - پیگیری پیشرفت شما

🔥 **ویژگی‌های خاص:**
• **یادگیری خودکار**: هر ترجمه رو به مجموعه واژگان شما اضافه می‌کنم
• **تست‌های هوشمند**: از کلمات شخصی شما تست می‌سازم
• **پشتیبانی کامل فارسی**: همه‌چیز به زبان فارسی!

⚡ **نحوه استفاده:**
• روی دکمه‌های زیر کلیک کنید
• یا مستقیماً متن خود را بنویسید

💡 **نکته**: برای دریافت معنی دقیق، کلمات هلندی یا فارسی را منفرد بنویسید!

🚀 **آماده هستید؟ شروع کنیم!**`;
}

/**
 * Format quiz response
 * @param {object} quizData - Quiz JSON object
 * @returns {string} - Formatted quiz message
 */
function formatQuizResponse(quizData) {
    let message = `📝 **Quiz Time!**\n\n`;
    message += `**${quizData.question}**\n\n`;
    
    // Add options
    const optionLabels = ['A', 'B', 'C', 'D'];
    quizData.options.forEach((option, index) => {
        message += `${optionLabels[index]}. ${option}\n`;
    });
    
    message += `\n✅ **Answer:** ${quizData.correctAnswer}\n`;
    message += `💡 **Explanation:** ${quizData.explanation}`;
    
    return message;
}

/**
 * Format grammar correction response
 * @param {object} correctionData - Grammar correction object
 * @param {string} language - Source language
 * @returns {string} - Formatted correction message
 */
function formatGrammarResponse(correctionData, language) {
    const languageFlag = '🇱'; // Only Dutch supported now
    
    let message = `✅ **اصلاح گرامر هلندی** ${languageFlag}\n\n`;
    
    if (!correctionData.hasErrors) {
        message += `🎉 **عالی!** متن شما هیچ خطای گرامری ندارد.\n\n`;
        message += `📝 **متن:** ${correctionData.original}\n\n`;
        message += `💡 **تبریک!** گرامر شما کاملاً صحیح است.`;
    } else {
        message += `📝 **متن اصلی:** ${correctionData.original}\n\n`;
        message += `✨ **متن اصلاح شده:** ${correctionData.corrected}\n\n`;
        
        // Grammar analysis section
        if (correctionData.grammarAnalysis) {
            const analysis = correctionData.grammarAnalysis;
            message += `� **تجزیه گرامری:**\n`;
            message += `• **نوع جمله:** ${analysis.sentenceType || 'نامشخص'}\n`;
            message += `• **زمان:** ${analysis.tense || 'نامشخص'}\n`;
            if (analysis.mainIssues && analysis.mainIssues.length > 0) {
                message += `• **مشکلات اصلی:** ${analysis.mainIssues.join(', ')}\n`;
            }
            message += `\n`;
        }
        
        // Corrections section
        message += `🔧 **اصلاحات انجام شده:**\n`;
        correctionData.corrections.forEach((correction, index) => {
            message += `\n**${index + 1}. ${correction.type}**\n`;
            message += `❌ "${correction.original}" → ✅ "${correction.corrected}"\n`;
            message += `💡 **توضیح:** ${correction.explanation}\n`;
            if (correction.position) {
                message += `� **موقعیت:** ${correction.position}\n`;
            }
        });
        
        // Suggestions section
        if (correctionData.suggestions && correctionData.suggestions.length > 0) {
            message += `\n📝 **پیشنهادات بهتر:**\n`;
            correctionData.suggestions.forEach((suggestion, index) => {
                message += `${index + 1}. "${suggestion}"\n`;
            });
        }
    }
    
    message += `\n💡 **نکته:** برای اصلاح متن‌های بیشتر، دوباره از دکمه "اصلاح گرامر" استفاده کنید.`;
    
    return message;
}

/**
 * Format single interactive test response with inline keyboard
 * @param {object} test - Single test object
 * @returns {object} - Message object with text and inline keyboard
 */
function formatSingleTestResponse(test) {
    // Determine test category for display
    let categoryIcon = '';
    let categoryText = '';
    
    if (test.type.includes('sentence')) {
        categoryIcon = '📝';
        categoryText = 'تست جمله';
    } else {
        categoryIcon = '🔤';
        categoryText = 'تست کلمه';
    }
    
    let message = `${categoryIcon} **${categoryText}** 🇮🇷🇳🇱\n\n`;
    message += `❓ **${test.question}**\n\n`;
    message += `👆 گزینه درست را انتخاب کنید:`;
    
    // Create inline keyboard with options
    const keyboard = {
        inline_keyboard: []
    };
    
    const letters = ['آ', 'ب', 'ج'];
    test.options.forEach((option, index) => {
        // Truncate long options for button display
        let displayOption = option;
        if (option.length > 50) {
            displayOption = option.substring(0, 47) + '...';
        }
        
        keyboard.inline_keyboard.push([{
            text: `${letters[index]}) ${displayOption}`,
            callback_data: `test_answer_${index}_${test.id}`
        }]);
    });
    
    return {
        text: message,
        reply_markup: keyboard
    };
}

/**
 * Format test response with multiple choice questions
 * @param {Array} tests - Array of test objects
 * @returns {string} - Formatted test message
 */
function formatTestResponse(tests) {
    let message = `📝 **تست واژگان هلندی** 🇳🇱\n\n`;
    message += `🎯 ${tests.length} سوال چهارگزینه‌ای\n`;
    message += `📚 براساس کلمات ثبت‌شده شما\n\n`;
    message += `─────────────────────\n\n`;
    
    tests.forEach((test, index) => {
        message += `**${index + 1}.** ${test.question}\n\n`;
        
        // Add options with letters
        const letters = ['آ', 'ب', 'ج'];
        test.options.forEach((option, optionIndex) => {
            message += `${letters[optionIndex]}) ${option}\n`;
        });
        
        message += `\n`;
    });
    
    message += `─────────────────────\n\n`;
    message += `💡 **راهنمای پاسخ:**\n`;
    
    tests.forEach((test, index) => {
        const correctIndex = test.options.indexOf(test.correctAnswer);
        const correctLetter = ['آ', 'ب', 'ج'][correctIndex];
        message += `${index + 1}. ${correctLetter}) ${test.correctAnswer}\n`;
        message += `   💬 ${test.explanation}\n\n`;
    });
    
    return message;
}

module.exports = {
    formatDictionaryResponse,
    formatTranslationResponse,
    formatComprehensiveTranslation,
    formatErrorMessage,
    formatInputNotRecognizedMessage,
    getHelpMessage,
    getWelcomeMessage,
    formatQuizResponse,
    formatGrammarResponse,
    formatTestResponse,
    formatSingleTestResponse
};