/**
 * Input Detection Utility
 * Simple routing logic: no spaces = dictionary mode, otherwise = translation mode
 * Accepts any language input (removed language restrictions)
 */

/**
 * Check if text contains Persian/Farsi characters
 * @param {string} text - The input text
 * @returns {boolean} - True if text contains Persian characters
 */
function containsPersian(text) {
    const persianRegex = /[\u0600-\u06FF]/;
    return persianRegex.test(text);
}

/**
 * Simple routing logic based on spaces
 * @param {string} text - The input text
 * @returns {object} - Object containing inputType and isSupported (always true)
 */
function analyzeInput(text) {
    const trimmed = text.trim();
    
    if (!trimmed) {
        return { inputType: 'invalid', language: null, isSupported: true };
    }

    // Simple rule: if no spaces -> dictionary mode, otherwise -> translation mode
    const hasSpaces = trimmed.includes(' ');
    
    if (!hasSpaces) {
        // Dictionary mode for single words
        return { 
            inputType: 'dictionary', 
            language: 'unknown', // Language doesn't matter anymore
            isSupported: true
        };
    } else {
        // Translation mode for sentences
        return { 
            inputType: 'translation', 
            language: 'unknown', // Language doesn't matter anymore
            isSupported: true
        };
    }
}

module.exports = {
    containsPersian,
    analyzeInput
};