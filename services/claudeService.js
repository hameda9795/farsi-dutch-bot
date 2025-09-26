/**
 * Claude Service
 * Handles communication with Claude API for translation and dictionary functions
 */

const Anthropic = require('@anthropic-ai/sdk');

/**
 * Build dictionary prompt based on language
 * @param {string} word - The word to define
 * @param {string} lang - Language ('nl' for Dutch, 'fa' for Persian)
 * @returns {string} - The prompt for Claude
 */
function buildDictionaryPrompt(word, lang) {
    if (lang === 'nl') {
        // Dutch word dictionary prompt
        return `You are a Dutch-Farsi dictionary. For the Dutch word "${word}", provide a JSON response with the following structure:

{
  "word": "${word}",
  "farsiMeaning": "meaning in Farsi/Persian",
  "englishMeaning": "meaning in English",
  "synonyms": ["synonym1", "synonym2"],
  "antonyms": ["antonym1", "antonym2"],
  "examples": [
    {
      "dutch": "example sentence in Dutch",
      "farsi": "translation in Farsi/Persian",
      "english": "translation in English"
    }
  ]
}

Provide accurate translations and 2-3 examples. If synonyms/antonyms are not applicable, use empty arrays. Respond ONLY with valid JSON, no additional text.`;
    } else if (lang === 'fa') {
        // Persian word dictionary prompt
        return `You are a Persian-Dutch dictionary. For the Persian/Farsi word "${word}", provide a JSON response with the following structure:

{
  "word": "${word}",
  "dutchMeaning": "meaning in Dutch",
  "englishMeaning": "meaning in English",
  "synonyms": ["synonym1", "synonym2"],
  "antonyms": ["antonym1", "antonym2"],
  "examples": [
    {
      "farsi": "example sentence in Persian/Farsi",
      "dutch": "translation in Dutch",
      "english": "translation in English"
    }
  ]
}

Provide accurate translations and 2-3 examples. If synonyms/antonyms are not applicable, use empty arrays. Respond ONLY with valid JSON, no additional text.`;
    } else {
        throw new Error(`Unsupported language: ${lang}`);
    }
}

class ClaudeService {
    constructor(apiKey) {
        this.anthropic = new Anthropic({
            apiKey: apiKey
        });
    }

    /**
     * Get dictionary definition for a word in any supported language
     * @param {string} word - Word to define
     * @param {string} language - 'dutch' or 'persian'
     * @returns {Promise<object>} - Dictionary JSON object
     */
    async getDictionaryDefinition(word, language = 'dutch') {
        const lang = language === 'persian' ? 'fa' : 'nl';
        const prompt = buildDictionaryPrompt(word, lang);
        const systemContent = language === 'persian' 
            ? 'You are a professional Persian-Dutch dictionary. Always respond with valid JSON only.'
            : 'You are a professional Dutch-Farsi dictionary. Always respond with valid JSON only.';

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-haiku-20241022', // Faster model
                max_tokens: 800,
                temperature: 0.3,
                system: systemContent,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            const content = response.content[0].text.trim();
            return JSON.parse(content);
        } catch (error) {
            console.error('Claude Dictionary Error:', error);
            
            // Provide a basic fallback dictionary entry
            const basicEntry = {
                word: word,
                translation: language === 'persian' ? word : word,
                meaning: language === 'persian' ? 'ترجمه موقتاً در دسترس نیست' : 'Translation temporarily unavailable'
            };
            
            return basicEntry;
        }
    }

    /**
     * Translate text between Farsi and Dutch using fast model
     * @param {string} text - Text to translate
     * @param {string} sourceLanguage - 'persian' or 'dutch'
     * @returns {Promise<string>} - Translated text
     */
    async translateText(text, sourceLanguage) {
        const targetLanguage = sourceLanguage === 'persian' ? 'Dutch' : 'Farsi/Persian';
        const sourceLangName = sourceLanguage === 'persian' ? 'Persian/Farsi' : 'Dutch';

        const prompt = `Translate to ${targetLanguage}: "${text}"`;

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-haiku-20241022', // Faster model, less overload
                max_tokens: 200,
                temperature: 0.2,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            return response.content[0].text.trim();
        } catch (error) {
            console.error('Claude Translation Error:', error);
            
            // Simple fallback translation for common cases
            return this.getFallbackTranslation(text, sourceLanguage);
        }
    }

    /**
     * Comprehensive translation with vocabulary analysis and contextual explanation
     * @param {string} text - Text to translate and analyze
     * @param {string} sourceLanguage - 'persian' or 'dutch'
     * @returns {Promise<string>} - Formatted comprehensive analysis
     */
    async getComprehensiveTranslation(text, sourceLanguage) {
        const targetLanguage = sourceLanguage === 'persian' ? 'Dutch' : 'Persian/Farsi';
        const sourceLangName = sourceLanguage === 'persian' ? 'Persian/Farsi' : 'Dutch';

        const prompt = `STRICT TRANSLATION TASK - NO DEVIATIONS ALLOWED

INPUT: "${text}"

FORMAT REQUIRED (follow EXACTLY):

${sourceLanguage === 'dutch' ? 
`[1] ترجمهٔ دقیق متن

«DIRECT_PERSIAN_TRANSLATION_HERE»

[2] 📚 واژگان مهم:

advanced_dutch_word1 = persian_meaning  
complex_dutch_word2 = persian_meaning  
important_dutch_word3 = persian_meaning  
key_dutch_word4 = persian_meaning
specialized_dutch_word5 = persian_meaning
difficult_dutch_word6 = persian_meaning
(continue with ALL important words found in the text)

[3] 💡 منظور جمله:

PERSIAN_EXPLANATION_OF_MEANING` :
`[1] Precieze vertaling van de tekst

«DIRECT_DUTCH_TRANSLATION_HERE»

[2] 📚 Belangrijke woorden:

advanced_persian_word1 = dutch_meaning  
complex_persian_word2 = dutch_meaning  
important_persian_word3 = dutch_meaning  
key_persian_word4 = dutch_meaning
specialized_persian_word5 = dutch_meaning
difficult_persian_word6 = dutch_meaning
(continue with ALL important words found in the text)

[3] 💡 Betekenis van de zin:

DUTCH_EXPLANATION_OF_MEANING`}

CRITICAL RULES FOR VOCABULARY SELECTION:
❌ NEVER include simple words like: است، از، به، با، در، که، این، آن، را، و، یا
❌ NEVER include basic words like: is, van, met, in, dat, deze, die, en, of, de, het
❌ NEVER include pronouns, articles, or common prepositions
✅ EXTRACT ALL ADVANCED, COMPLEX, or SPECIALIZED vocabulary from the text
✅ Include ALL words that are DIFFICULT to translate or have MULTIPLE meanings
✅ Focus on TECHNICAL terms, IDIOMS, or CULTURAL expressions
✅ Select ALL words that LANGUAGE LEARNERS would struggle with
✅ NO LIMIT on number of vocabulary words - include ALL important ones

VOCABULARY EXAMPLES (GOOD CHOICES):
- Technical terms: onderzoeker, instituut, polarisering, haatreacties
- Complex verbs: voorbereiden, analyseren, interpreteren, onderzoeken
- Advanced adjectives: doorlopend, specifiek, gevarieerd, online
- Cultural concepts: perfectie, emotioneel, maatschappelijk, situatie
- Compound words: videobellen, maatschappij, gebeurtenissen

VOCABULARY EXAMPLES (BAD CHOICES):
- Basic words: is, van, het, de, این, که, در, از
- Simple verbs: zijn, hebben, کردن، بودن
- Common nouns: man, vrouw, مرد، زن

CRITICAL RULES - ZERO TOLERANCE:
❌ NEVER write "Here's the translation" or any introductory text
❌ NEVER use double quotes « « or nested explanations  
❌ NEVER add notes, comments, or extra explanations in section [1]
✅ ONLY put the pure translation between « »
✅ EXTRACT ALL IMPORTANT vocabulary items with = symbol (no minimum, no maximum)
✅ Section [3] explains what the speaker REALLY means

Follow format EXACTLY. Start your response with [1].`;

        try {
            // First try with Sonnet
            let response;
            let retryCount = 0;
            const maxRetries = 2;

            while (retryCount <= maxRetries) {
                try {
                    response = await this.anthropic.messages.create({
                        model: retryCount === 0 ? 'claude-3-5-sonnet-20241022' : 'claude-3-5-haiku-20241022', // Fallback to Haiku if Sonnet is overloaded
                        max_tokens: 800,
                        temperature: 0.1,
                        system: `You are a precision translator and vocabulary expert. Follow the format EXACTLY. Never add introductory phrases. For vocabulary, extract ALL advanced/complex words from the text - no limits. Ignore simple words like articles and prepositions.`,
                        messages: [{
                            role: 'user',
                            content: prompt
                        }]
                    });
                    break; // Success, exit retry loop
                } catch (apiError) {
                    console.log(`Attempt ${retryCount + 1} failed:`, apiError.status || apiError.message);
                    
                    if (apiError.status === 529 || (apiError.error && apiError.error.type === 'overloaded_error')) {
                        retryCount++;
                        if (retryCount <= maxRetries) {
                            console.log(`Retrying in ${retryCount * 2} seconds...`);
                            await new Promise(resolve => setTimeout(resolve, retryCount * 2000)); // Wait before retry
                            continue;
                        }
                    }
                    throw apiError; // Re-throw if not overloaded or max retries reached
                }
            }

            return response.content[0].text.trim();
        } catch (error) {
            console.error('Claude Comprehensive Translation Error:', error);
            
            // Fallback to simple translation with basic format
            const simpleTranslation = await this.translateText(text, sourceLanguage);
            
            if (sourceLanguage === 'persian') {
                return `[1] Precieze vertaling van de tekst\n\n«${simpleTranslation}»\n\n[2] 📚 Belangrijke woorden:\n\n(Woordenlijst tijdelijk niet beschikbaar)\n\n[3] 💡 Betekenis van de zin:\n\n(Uitgebreide betekenis tijdelijk niet beschikbaar)`;
            } else {
                return `[1] ترجمهٔ دقیق متن\n\n«${simpleTranslation}»\n\n[2] 📚 واژگان مهم:\n\n(فهرست واژگان موقتاً در دسترس نیست)\n\n[3] 💡 منظور جمله:\n\n(معنی تفصیلی موقتاً در دسترس نیست)`;
            }
        }
    }

    /**
     * Simple fallback translation for when API fails
     * @param {string} text - Text to translate
     * @param {string} sourceLanguage - 'persian' or 'dutch'
     * @returns {string} - Basic translation or error message
     */
    getFallbackTranslation(text, sourceLanguage) {
        const commonPhrases = {
            // Persian to Dutch
            'سلام': 'Hallo',
            'خوش آمدید': 'Welkom',
            'متشکرم': 'Dank je wel',
            'خداحافظ': 'Tot ziens',
            'چطور هستید؟': 'Hoe gaat het?',
            'بله': 'Ja',
            'خیر': 'Nee',
            
            // Dutch to Persian  
            'hallo': 'سلام',
            'welkom': 'خوش آمدید',
            'dank je wel': 'متشکرم',
            'dank je': 'متشکرم',
            'tot ziens': 'خداحافظ',
            'hoe gaat het': 'چطور هستید؟',
            'ja': 'بله',
            'nee': 'خیر'
        };

        const lowerText = text.toLowerCase().trim();
        
        if (commonPhrases[lowerText]) {
            return commonPhrases[lowerText];
        }

        // If no match, return explanatory message
        if (sourceLanguage === 'persian') {
            return 'سرویس ترجمه موقتاً در دسترس نیست. لطفاً بعداً تلاش کنید.';
        } else {
            return 'Translation service is temporarily unavailable. Please try again later.';
        }
    }

    /**
     * Detect language of input text
     * @param {string} text - Text to analyze
     * @returns {Promise<string>} - 'persian' or 'dutch'
     */
    /**
     * Detect language using fast model and fallback
     * @param {string} text - Text to analyze
     * @returns {Promise<string>} - 'persian' or 'dutch'
     */
    async detectLanguage(text) {
        // Fast local detection first
        const persianChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
        const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
        
        // If clear Persian text, return immediately
        if (persianChars > 0 && persianChars > latinChars) {
            return 'persian';
        }
        
        // If clear Dutch/Latin text, return immediately  
        if (latinChars > 0 && persianChars === 0) {
            return 'dutch';
        }

        // For mixed or unclear cases, use API
        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-haiku-20241022', // Faster model
                max_tokens: 5,
                temperature: 0,
                messages: [{
                    role: 'user',
                    content: `Language of "${text}": persian or dutch?`
                }]
            });

            const detected = response.content[0].text.trim().toLowerCase();
            return detected === 'persian' ? 'persian' : 'dutch';
        } catch (error) {
            console.error('Language detection failed, using fallback:', error);
            return persianChars > latinChars ? 'persian' : 'dutch';
        }
    }

    /**
     * Generate a quiz question for a Dutch word
     * @param {string} word - Dutch word to create quiz for
     * @returns {Promise<object>} - Quiz JSON object
     */
    async generateQuiz(word) {
        const prompt = `Create a multiple-choice quiz question for the Dutch word "${word}". Provide a JSON response:

{
  "word": "${word}",
  "question": "What does '${word}' mean in Persian/Farsi?",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswer": "A",
  "explanation": "Brief explanation in English"
}

Make the question clear and educational. Include one correct answer and 3 plausible wrong answers. Respond ONLY with valid JSON.`;

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 500,
                temperature: 0.4,
                system: 'You are an educational quiz generator. Always respond with valid JSON only.',
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            const content = response.content[0].text.trim();
            return JSON.parse(content);
        } catch (error) {
            console.error('Claude Quiz Generation Error:', error);
            throw new Error('Failed to generate quiz');
        }
    }

    /**
     * Correct grammar in text
     * @param {string} text - Text to correct
     * @param {string} language - 'persian' or 'dutch'
     * @returns {Promise<object>} - Grammar correction object
     */
    async correctGrammar(text, language) {
        if (language !== 'dutch') {
            throw new Error('Grammar correction is only supported for Dutch text');
        }
        
        const prompt = `You are an expert Dutch language teacher and grammar corrector. Analyze the following Dutch text for grammar, spelling, punctuation, and sentence structure errors.

Dutch text to analyze: "${text}"

Provide detailed grammar analysis in JSON format:
{
  "original": "${text}",
  "corrected": "grammatically perfect version with all errors fixed",
  "hasErrors": true/false,
  "corrections": [
    {
      "type": "grammar/spelling/punctuation/word-order/verb-conjugation",
      "original": "incorrect phrase or word",
      "corrected": "corrected phrase or word", 
      "explanation": "detailed explanation in Dutch about why this was wrong and the grammar rule",
      "position": "approximate position in text"
    }
  ],
  "grammarAnalysis": {
    "sentenceType": "simple/compound/complex",
    "tense": "present/past/future/perfect etc.",
    "mood": "indicative/imperative/subjunctive",
    "mainIssues": ["list of main grammar issues found"]
  },
  "suggestions": [
    "Alternative way to write this sentence",
    "More natural Dutch expression"
  ]
}

IMPORTANT RULES:
- ONLY analyze and correct Dutch text
- Provide explanations in Dutch language
- Focus on common Dutch grammar rules: word order, verb conjugation, article usage, prepositions
- If text is perfect, set hasErrors to false and corrections to empty array
- Suggest more natural Dutch expressions when possible
- Be thorough but concise in explanations

Respond ONLY with valid JSON, no additional text.`;

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1200,
                temperature: 0.1,
                system: `You are a professional Dutch language teacher specializing in grammar correction for Dutch learners. You have deep knowledge of Dutch grammar rules, common mistakes, and natural expressions. Always respond with valid JSON only.`,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            const content = response.content[0].text.trim();
            return JSON.parse(content);
        } catch (error) {
            console.error('Claude Grammar Correction Error:', error);
            throw new Error('Failed to correct grammar');
        }
    }
}

module.exports = ClaudeService;