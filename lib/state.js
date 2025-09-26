/**
 * State Management Module - Word-Focused Architecture
 * Handles loading and saving user vocabulary data with separate word storage
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_DIR = path.join(__dirname, '../db');

/**
 * Load user state from file
 * @param {string} chatId - Chat ID
 * @returns {Promise<object>} - User state object
 */
async function loadState(chatId) {
    const filePath = path.join(DB_DIR, `${chatId}.json`);
    
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const parsedData = JSON.parse(data);
        
        // Migrate old format to new format if needed
        if (parsedData.messages && !parsedData.words) {
            console.log(`Migrating user ${chatId} from old format to new word-focused format`);
            
            const words = parsedData.messages
                .filter(msg => msg.type === 'word')
                .map(msg => ({
                    id: msg.id || uuidv4(),
                    dutch: msg.nl,
                    farsi: msg.fa,
                    timestamp: msg.timestamp,
                    synonyms: msg.synonyms || [],
                    antonyms: msg.antonyms || [],
                    examples: msg.examples || []
                }));
            
            const newState = {
                words: words,
                currentTest: parsedData.currentTest || null,
                testScore: parsedData.testScore || 0,
                testTotal: parsedData.testTotal || 0
            };
            
            // Save migrated data immediately
            await saveState(chatId, newState);
            return newState;
        }
        
        return parsedData;
    } catch (error) {
        // If file doesn't exist or is invalid, return default state
        if (error.code === 'ENOENT' || error instanceof SyntaxError) {
            return {
                words: [],
                currentTest: null,
                testScore: 0,
                testTotal: 0
            };
        }
        throw error;
    }
}

/**
 * Save user state to file
 * @param {string} chatId - Chat ID
 * @param {object} state - State object to save
 * @returns {Promise<void>}
 */
async function saveState(chatId, state) {
    const filePath = path.join(DB_DIR, `${chatId}.json`);
    
    try {
        // Ensure db directory exists
        await fs.mkdir(DB_DIR, { recursive: true });
        
        // Write state to file
        await fs.writeFile(filePath, JSON.stringify(state, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving state:', error);
        throw error;
    }
}

/**
 * Add a new word to user's vocabulary (SIMPLIFIED VERSION)
 * @param {string} chatId - Chat ID
 * @param {string} dutch - Dutch word/phrase
 * @param {string} farsi - Persian translation
 * @param {Array} synonyms - Dutch synonyms (optional)
 * @param {Array} antonyms - Dutch antonyms (optional)
 * @param {Array} examples - Usage examples (optional)
 * @returns {Promise<object>} - The added/updated word
 */
async function addWord(chatId, dutch, farsi, synonyms = [], antonyms = [], examples = []) {
    console.log(`🔍 Adding word: "${dutch}" → "${farsi}" for user ${chatId}`);
    
    const state = await loadState(chatId);
    
    // Check if word already exists (case-insensitive)
    const existingWordIndex = state.words.findIndex(word => 
        word.dutch.toLowerCase().trim() === dutch.toLowerCase().trim()
    );
    
    const wordData = {
        id: existingWordIndex >= 0 ? state.words[existingWordIndex].id : uuidv4(),
        dutch: dutch.trim(),
        farsi: farsi.trim()
    };
    
    if (existingWordIndex >= 0) {
        // Update existing word
        state.words[existingWordIndex] = wordData;
        console.log(`✅ Updated existing word: ${dutch}`);
    } else {
        // Add new word
        state.words.push(wordData);
        console.log(`✅ Added new word: ${dutch} → ${farsi}`);
    }
    
    await saveState(chatId, state);
    console.log(`💾 State saved. Total words: ${state.words.length}`);
    return wordData;
}

/**
 * Extract and add multiple words from translation data
 * @param {string} chatId - Chat ID
 * @param {Array} extractedWords - Array of word objects
 * @returns {Promise<Array>} - Array of added words
 */
async function addWordsFromExtraction(chatId, extractedWords) {
    if (!Array.isArray(extractedWords) || extractedWords.length === 0) {
        return [];
    }

    const addedWords = [];
    
    for (const wordData of extractedWords) {
        if (wordData.dutch && wordData.farsi) {
            try {
                const addedWord = await addWord(
                    chatId,
                    wordData.dutch,
                    wordData.farsi,
                    wordData.synonyms || [],
                    wordData.antonyms || [],
                    wordData.examples || []
                );
                addedWords.push(addedWord);
            } catch (error) {
                console.error(`Error adding word ${wordData.dutch}:`, error);
            }
        }
    }
    
    console.log(`Added ${addedWords.length} words to vocabulary for user ${chatId}`);
    return addedWords;
}

/**
 * Get random words for testing
 * @param {string} chatId - Chat ID
 * @param {number} count - Number of words to get
 * @returns {Promise<Array>} - Array of random words
 */
async function getRandomWords(chatId, count = 10) {
    const state = await loadState(chatId);
    
    if (state.words.length === 0) {
        return [];
    }
    
    // Shuffle words and return requested count
    const shuffled = [...state.words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Set current test for interactive testing
 * @param {string} chatId - Chat ID
 * @param {object} testData - Test data object
 * @returns {Promise<void>}
 */
async function setCurrentTest(chatId, testData) {
    const state = await loadState(chatId);
    state.currentTest = testData;
    await saveState(chatId, state);
}

/**
 * Update test score
 * @param {string} chatId - Chat ID
 * @param {boolean} isCorrect - Whether the answer was correct
 * @returns {Promise<object>} - Updated score object
 */
async function updateTestScore(chatId, isCorrect) {
    const state = await loadState(chatId);
    state.testTotal = (state.testTotal || 0) + 1;
    if (isCorrect) {
        state.testScore = (state.testScore || 0) + 1;
    }
    await saveState(chatId, state);
    return { score: state.testScore, total: state.testTotal };
}

/**
 * Clear current test
 * @param {string} chatId - Chat ID
 * @returns {Promise<void>}
 */
async function clearCurrentTest(chatId) {
    const state = await loadState(chatId);
    state.currentTest = null;
    await saveState(chatId, state);
}

/**
 * Get vocabulary statistics
 * @param {string} chatId - Chat ID
 * @returns {Promise<object>} - Statistics object
 */
async function getVocabularyStats(chatId) {
    const state = await loadState(chatId);
    
    return {
        totalWords: state.words.length,
        wordsWithSynonyms: state.words.filter(w => w.synonyms && w.synonyms.length > 0).length,
        wordsWithAntonyms: state.words.filter(w => w.antonyms && w.antonyms.length > 0).length,
        wordsWithExamples: state.words.filter(w => w.examples && w.examples.length > 0).length,
        testScore: state.testScore || 0,
        testTotal: state.testTotal || 0
    };
}

module.exports = {
    loadState,
    saveState,
    addWord,
    addWordsFromExtraction,
    getRandomWords,
    setCurrentTest,
    updateTestScore,
    clearCurrentTest,
    getVocabularyStats
};