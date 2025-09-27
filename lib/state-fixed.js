/**
 * State Management Module - Word-Focused Architecture
 * Handles loading and saving user vocabulary data with separate word storage
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_DIR = path.join(__dirname, '../db');

/**
 * Filter words to get only simple vocabulary suitable for testing
 * Excludes complex sentences, long phrases, and technical terms
 * @param {Array} words - Array of word objects
 * @returns {Array} - Filtered array of simple words
 */
function getSimpleWordsForTesting(words) {
    if (!Array.isArray(words)) return [];
    
    return words.filter(word => {
        if (!word.dutch || !word.farsi) return false;
        
        const dutch = word.dutch.trim();
        const farsi = word.farsi.trim();
        
        // Skip if too long (likely sentences or complex phrases)
        if (dutch.length > 25 || farsi.length > 25) return false;
        
        // Skip if contains too many words (max 2-3 words)
        const dutchWordCount = dutch.split(/\s+/).length;
        const farsiWordCount = farsi.split(/\s+/).length;
        if (dutchWordCount > 3 || farsiWordCount > 3) return false;
        
        // Skip if contains sentence indicators
        const sentenceIndicators = [
            // Dutch sentence indicators
            /\b(ik|jij|hij|zij|wij|jullie|u|we|dat|die|deze|waar|wanneer|hoe|wat|wie|waarom)\b/i,
            /\b(hebben|heeft|hebt|zijn|bent|is|was|waren|wordt|worden)\b/i,
            /[.!?;:]/,
            // Persian sentence indicators  
            /\b(من|تو|او|ما|شما|آنها|که|چه|چی|کی|کجا|چگونه|چرا)\b/,
            /\b(هستم|هستی|هست|هستیم|هستید|هستند|بودم|بودی|بود|بودیم|بودید|بودند)\b/,
            /[.!?؟؛:]/
        ];
        
        const containsSentenceIndicators = sentenceIndicators.some(pattern => 
            pattern.test(dutch) || pattern.test(farsi)
        );
        
        if (containsSentenceIndicators) return false;
        
        // Skip very technical or complex terms
        const technicalTerms = [
            /\b(identificatoren|gepersonaliseerde|doelgroepinzichten|ontwikkeling|verwerken|persoonlijke|gegevens|apparaat)\b/i,
            /\b(شناسه‌ها|شخصی‌سازی شده|بینش‌های مخاطبان|پردازش کردن|داده‌ها|دستگاه|منحصر به فرد)\b/
        ];
        
        const isTechnical = technicalTerms.some(pattern => 
            pattern.test(dutch) || pattern.test(farsi)
        );
        
        if (isTechnical) return false;
        
        return true;
    });
}

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
        
        // Ensure testSession exists (migration for older states)
        if (!parsedData.testSession) {
            parsedData.testSession = {
                isActive: false,
                usedWordIds: [],
                startTime: null
            };
        }
        
        // Ensure importantWords exists
        if (!parsedData.importantWords) {
            parsedData.importantWords = [];
        }
        
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
                testTotal: parsedData.testTotal || 0,
                testSession: {
                    isActive: false,
                    usedWordIds: [],
                    startTime: null
                },
                importantWords: []
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
                testTotal: 0,
                testSession: {
                    isActive: false,
                    usedWordIds: [],
                    startTime: null
                },
                importantWords: []
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
        // Ensure the db directory exists
        await fs.mkdir(DB_DIR, { recursive: true });
        
        // Save state as JSON
        await fs.writeFile(filePath, JSON.stringify(state, null, 2), 'utf8');
        console.log(`✅ State saved for user ${chatId}`);
    } catch (error) {
        console.error(`❌ Error saving state for user ${chatId}:`, error);
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
 * Get random words for testing - only simple vocabulary
 * @param {string} chatId - Chat ID
 * @param {number} count - Number of words to get
 * @returns {Promise<Array>} - Array of random simple words
 */
async function getRandomWords(chatId, count = 10) {
    const state = await loadState(chatId);
    
    if (!state.words || state.words.length === 0) {
        return [];
    }
    
    // Filter to get only simple words suitable for testing
    const simpleWords = getSimpleWordsForTesting(state.words);
    
    if (simpleWords.length === 0) {
        console.log(`⚠️ No simple words found for testing. Total words: ${state.words.length}`);
        return [];
    }
    
    console.log(`📊 Filtered ${simpleWords.length} simple words from ${state.words.length} total words for testing`);
    
    // Shuffle words and return requested count
    const shuffled = [...simpleWords].sort(() => Math.random() - 0.5);
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
 * Get vocabulary statistics with filtering info
 * @param {string} chatId - Chat ID
 * @returns {Promise<object>} - Statistics object
 */
async function getVocabularyStats(chatId) {
    const state = await loadState(chatId);
    
    // Get simple words for statistics
    const simpleWords = getSimpleWordsForTesting(state.words);
    
    return {
        totalWords: state.words.length,
        simpleWords: simpleWords.length,
        wordsWithSynonyms: state.words.filter(w => w.synonyms && w.synonyms.length > 0).length,
        wordsWithAntonyms: state.words.filter(w => w.antonyms && w.antonyms.length > 0).length,
        wordsWithExamples: state.words.filter(w => w.examples && w.examples.length > 0).length,
        testScore: state.testScore || 0,
        testTotal: state.testTotal || 0
    };
}

/**
 * Start a new test session
 * @param {string} chatId - Chat ID
 * @returns {Promise<void>}
 */
async function startTestSession(chatId) {
    const state = await loadState(chatId);
    state.testSession = {
        isActive: true,
        usedWordIds: [],
        startTime: new Date().toISOString()
    };
    await saveState(chatId, state);
}

/**
 * End current test session
 * @param {string} chatId - Chat ID  
 * @returns {Promise<void>}
 */
async function endTestSession(chatId) {
    const state = await loadState(chatId);
    state.testSession = {
        isActive: false,
        usedWordIds: [],
        startTime: null
    };
    await saveState(chatId, state);
}

/**
 * Get next word for testing based on smart selection algorithm (filtered for simple words)
 * Priority: newest words first, then middle, then oldest
 * Avoids repetition during active session
 * @param {string} chatId - Chat ID
 * @returns {Promise<object|null>} - Selected word or null if no words available
 */
async function getNextTestWord(chatId) {
    const state = await loadState(chatId);
    
    // Filter to get only simple words suitable for testing
    const simpleWords = getSimpleWordsForTesting(state.words);
    
    if (!simpleWords || simpleWords.length === 0) {
        return null;
    }
    
    if (simpleWords.length < 3) {
        return null; // Need at least 3 words for meaningful tests
    }
    
    // Get words not used in current session
    const availableWords = simpleWords.filter(word => 
        !state.testSession.usedWordIds.includes(word.id)
    );
    
    // If we've used all words, reset the session
    if (availableWords.length === 0) {
        console.log('🔄 Resetting test session - all simple words have been used');
        state.testSession.usedWordIds = [];
        await saveState(chatId, state);
        return simpleWords[Math.floor(Math.random() * simpleWords.length)];
    }
    
    // Smart selection algorithm for simple words
    const totalWords = availableWords.length;
    
    // Choose selection pattern
    let selectedWord;
    const patternChoice = Math.random();
    
    if (patternChoice < 0.4) {
        // 40% - Newest words (last 30%)
        const newestIndex = Math.floor(totalWords * 0.7);
        const newestWords = availableWords.slice(newestIndex);
        selectedWord = newestWords[Math.floor(Math.random() * newestWords.length)];
    } else if (patternChoice < 0.7) {
        // 30% - Middle words (middle 40%)
        const startIndex = Math.floor(totalWords * 0.3);
        const endIndex = Math.floor(totalWords * 0.7);
        const middleWords = availableWords.slice(startIndex, endIndex);
        selectedWord = middleWords[Math.floor(Math.random() * middleWords.length)];
    } else {
        // 30% - Oldest words (first 30%)
        const oldestIndex = Math.floor(totalWords * 0.3);
        const oldestWords = availableWords.slice(0, oldestIndex);
        selectedWord = oldestWords[Math.floor(Math.random() * oldestWords.length)];
    }
    
    // Mark word as used in current session
    state.testSession.usedWordIds.push(selectedWord.id);
    await saveState(chatId, state);
    
    return selectedWord;
}

/**
 * Get words for wrong options in tests (filtered for simple words)
 * @param {string} chatId - Chat ID
 * @param {string} excludeWordId - ID of word to exclude (the correct answer)
 * @param {number} count - Number of words to get
 * @returns {Promise<Array>} - Array of words for wrong options
 */
async function getWordsForOptions(chatId, excludeWordId, count = 2) {
    const state = await loadState(chatId);
    
    // Filter to get only simple words suitable for testing
    const simpleWords = getSimpleWordsForTesting(state.words);
    
    if (!simpleWords || simpleWords.length === 0) {
        return [];
    }
    
    // Exclude the correct answer word
    const availableWords = simpleWords.filter(word => word.id !== excludeWordId);
    
    if (availableWords.length < count) {
        return availableWords; // Return what we have
    }
    
    // Shuffle and return requested count
    const shuffled = [...availableWords].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

/**
 * Mark a word as important
 * @param {string} chatId - Chat ID
 * @param {string} wordId - Word ID to mark
 * @returns {Promise<void>}
 */
async function markWordAsImportant(chatId, wordId) {
    const state = await loadState(chatId);
    if (!state.importantWords.includes(wordId)) {
        state.importantWords.push(wordId);
        await saveState(chatId, state);
    }
}

/**
 * Unmark a word as important
 * @param {string} chatId - Chat ID
 * @param {string} wordId - Word ID to unmark
 * @returns {Promise<void>}
 */
async function unmarkWordAsImportant(chatId, wordId) {
    const state = await loadState(chatId);
    state.importantWords = state.importantWords.filter(id => id !== wordId);
    await saveState(chatId, state);
}

/**
 * Get important words
 * @param {string} chatId - Chat ID
 * @returns {Promise<Array>} - Array of important word objects
 */
async function getImportantWords(chatId) {
    const state = await loadState(chatId);
    return state.words.filter(word => state.importantWords.includes(word.id));
}

/**
 * Check if a word is marked as important
 * @param {string} chatId - Chat ID
 * @param {string} wordId - Word ID to check
 * @returns {Promise<boolean>} - True if word is important
 */
async function isWordImportant(chatId, wordId) {
    const state = await loadState(chatId);
    return state.importantWords.includes(wordId);
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
    getVocabularyStats,
    startTestSession,
    endTestSession,
    getNextTestWord,
    getWordsForOptions,
    markWordAsImportant,
    unmarkWordAsImportant,
    getImportantWords,
    isWordImportant,
    getSimpleWordsForTesting
};