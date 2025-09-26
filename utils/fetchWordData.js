/**
 * Fetch Word Data Utility
 * Fetches word definitions using the existing dictionary service
 */

const ClaudeService = require('../services/claudeService');

// Lazy-load the Claude service to avoid environment variable issues during import
let claudeService = null;

function getClaudeService() {
    if (!claudeService) {
        claudeService = new ClaudeService(process.env.CLAUDE_API_KEY);
    }
    return claudeService;
}

/**
 * Fetch word data using dictionary service
 * @param {string} word - The word to fetch
 * @param {string} lang - Language: 'fa' or 'nl'
 * @returns {Promise<object>} - Word data object compatible with state.messages format
 */
async function fetchWordData(word, lang) {
    try {
        // Convert lang format for claudeService
        const language = lang === 'fa' ? 'persian' : 'dutch';
        
        // Get dictionary definition
        const service = getClaudeService();
        const dictionaryData = await service.getDictionaryDefinition(word, language);
        
        // Generate unique ID
        const { v4: uuidv4 } = require('uuid');
        const id = uuidv4();
        
        // Format according to state.messages structure
        let wordData = {
            id: id,
            type: 'word',
            lang: lang,
            timestamp: new Date().toISOString()
        };
        
        // Extract translations based on language
        if (lang === 'fa') {
            // Persian word
            wordData.fa = word;
            wordData.nl = dictionaryData.dutchMeaning || dictionaryData.meaning || '';
        } else {
            // Dutch word  
            wordData.nl = word;
            wordData.fa = dictionaryData.farsiMeaning || dictionaryData.meaning || '';
        }
        
        // Add optional fields if available
        if (dictionaryData.synonyms && Array.isArray(dictionaryData.synonyms) && dictionaryData.synonyms.length > 0) {
            wordData.synonyms = dictionaryData.synonyms;
        }
        
        if (dictionaryData.antonyms && Array.isArray(dictionaryData.antonyms) && dictionaryData.antonyms.length > 0) {
            wordData.antonyms = dictionaryData.antonyms;
        }
        
        if (dictionaryData.examples && Array.isArray(dictionaryData.examples) && dictionaryData.examples.length > 0) {
            wordData.examples = dictionaryData.examples.slice(0, 3); // max 3 examples
        }
        
        return wordData;
        
    } catch (error) {
        console.error(`Error fetching word data for "${word}":`, error);
        
        // Return minimal word data as fallback
        const { v4: uuidv4 } = require('uuid');
        
        return {
            id: uuidv4(),
            type: 'word',
            lang: lang,
            fa: lang === 'fa' ? word : '',
            nl: lang === 'nl' ? word : '',
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = {
    fetchWordData
};