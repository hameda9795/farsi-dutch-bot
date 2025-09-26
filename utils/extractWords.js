/**
 * Word Extraction Utility
 * Extracts meaningful words from sentences while filtering out stop-words
 */

const stopFa = require('../data/stop-fa.json');
const stopNl = require('../data/stop-nl.json');

/**
 * Detect language of text
 * @param {string} text - Input text
 * @returns {string} - 'fa', 'nl', or 'mixed'
 */
function detectLanguage(text) {
    const persianChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const latinChars = (text.match(/[a-zA-ZàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿĀāĂăĄąĆćĈĉĊċČčĎďĐđĒēĔĕĖėĘęĚěĜĝĞğĠġĢģĤĥĦħĨĩĪīĬĭĮįİıĲĳĴĵĶķĸĹĺĻļĽľĿŀŁłŃńŅņŇňŉŊŋŌōŎŏŐőŒœŔŕŖŗŘřŚśŜŝŞşŠšŢţŤťŦŧŨũŪūŬŭŮůŰűŲųŴŵŶŷŸŹźŻżŽžſ]/g) || []).length;
    
    if (persianChars > 0 && latinChars > 0) return 'mixed';
    if (persianChars > 0) return 'fa';
    if (latinChars > 0) return 'nl';
    return 'mixed';
}

/**
 * Extract meaningful words from text
 * @param {string} text - Input text
 * @param {string} lang - Language ('fa' or 'nl'), if not provided will be auto-detected
 * @returns {Array<string>} - Array of meaningful words
 */
function extractWords(text, lang) {
    if (!text || typeof text !== 'string') return [];
    
    // Auto-detect language if not provided
    if (!lang) {
        lang = detectLanguage(text);
    }
    
    // Handle mixed content by processing both languages
    if (lang === 'mixed') {
        const faWords = extractWords(text, 'fa');
        const nlWords = extractWords(text, 'nl');
        return [...faWords, ...nlWords];
    }
    
    let words = [];
    
    if (lang === 'fa') {
        // Extract Persian/Arabic words
        const matches = text.match(/[\u0600-\u06FF]+/g) || [];
        words = matches
            .filter(w => w.length > 1) // Filter very short words
            .filter(w => !stopFa.includes(w)) // Filter stop-words
            .filter(w => w.length <= 20); // Filter very long words (likely not single words)
    } else if (lang === 'nl') {
        // Extract Latin-based words (Dutch/English)
        const matches = text.toLowerCase().match(/[a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+/g) || [];
        words = matches
            .filter(w => w.length > 1) // Filter very short words
            .filter(w => !stopNl.includes(w.toLowerCase())) // Filter stop-words
            .filter(w => w.length <= 20); // Filter very long words
    }
    
    // Remove duplicates and return
    return [...new Set(words)];
}

/**
 * Check if text is likely a single word (not a sentence)
 * @param {string} text - Input text
 * @returns {boolean} - True if likely a single word
 */
function isSingleWord(text) {
    if (!text) return false;
    
    const trimmed = text.trim();
    
    // Contains sentence markers
    if (trimmed.includes('.') || trimmed.includes(',') || trimmed.includes('!') || trimmed.includes('?')) {
        return false;
    }
    
    // Count words
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    return words.length <= 2; // Allow compound words (max 2 words)
}

module.exports = {
    extractWords,
    detectLanguage,
    isSingleWord
};